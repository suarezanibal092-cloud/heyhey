import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { connectionId, to, message, messageType = "text" } = await request.json();

    if (!connectionId || !to || !message) {
      return NextResponse.json(
        { error: "connectionId, to y message son requeridos" },
        { status: 400 }
      );
    }

    const userId = (session.user as { id: string }).id;

    // Get connection
    const connection = await prisma.whatsAppConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Conexión no encontrada" },
        { status: 404 }
      );
    }

    if (!connection.accessToken) {
      return NextResponse.json(
        { error: "Token de acceso no disponible" },
        { status: 400 }
      );
    }

    // Send message via WhatsApp Cloud API
    const response = await fetch(
      `${WHATSAPP_API_URL}/${connection.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to.replace(/\D/g, ""), // Remove non-digits
          type: messageType,
          [messageType]: messageType === "text" ? { body: message } : message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", result);
      return NextResponse.json(
        { error: result.error?.message || "Error al enviar mensaje" },
        { status: response.status }
      );
    }

    // Log message in database
    await prisma.message.create({
      data: {
        connectionId,
        direction: "outbound",
        from: connection.phoneNumber,
        to,
        messageType,
        content: typeof message === "string" ? message : JSON.stringify(message),
        status: "sent",
        whatsappMessageId: result.messages?.[0]?.id,
      },
    });

    return NextResponse.json({
      success: true,
      messageId: result.messages?.[0]?.id,
    });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Error al enviar el mensaje" },
      { status: 500 }
    );
  }
}

// Get messages for a connection
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get("connectionId");
    const limit = Number.parseInt(searchParams.get("limit") || "50");

    if (!connectionId) {
      return NextResponse.json(
        { error: "connectionId es requerido" },
        { status: 400 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { connectionId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Error al obtener mensajes" },
      { status: 500 }
    );
  }
}
