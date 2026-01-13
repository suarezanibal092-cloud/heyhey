import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

// Verify API key
async function verifyApiKey(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const apiKey = authHeader.substring(7);

  const keyRecord = await prisma.apiKey.findUnique({
    where: { key: apiKey },
  });

  if (!keyRecord || !keyRecord.isActive) {
    return null;
  }

  // Update last used
  await prisma.apiKey.update({
    where: { key: apiKey },
    data: { lastUsedAt: new Date() },
  });

  return keyRecord;
}

// POST /api/v1/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const apiKey = await verifyApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key inválida o no proporcionada" },
        { status: 401 }
      );
    }

    const permissions = JSON.parse(apiKey.permissions || "[]");
    if (!permissions.includes("send_messages")) {
      return NextResponse.json(
        { error: "No tienes permiso para enviar mensajes" },
        { status: 403 }
      );
    }

    const { phoneNumberId, to, message, messageType = "text" } = await request.json();

    if (!phoneNumberId || !to || !message) {
      return NextResponse.json(
        { error: "phoneNumberId, to y message son requeridos" },
        { status: 400 }
      );
    }

    // Get connection
    const connection = await prisma.whatsAppConnection.findFirst({
      where: { phoneNumberId, userId: apiKey.userId },
    });

    if (!connection || !connection.accessToken) {
      return NextResponse.json(
        { error: "Conexión no encontrada o sin token" },
        { status: 404 }
      );
    }

    // Send message
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
          to: to.replace(/\D/g, ""),
          type: messageType,
          [messageType]: messageType === "text" ? { body: message } : message,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error?.message || "Error al enviar mensaje" },
        { status: response.status }
      );
    }

    // Log message
    await prisma.message.create({
      data: {
        connectionId: connection.id,
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
    console.error("API send message error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET /api/v1/messages - Get messages
export async function GET(request: NextRequest) {
  try {
    const apiKey = await verifyApiKey(request);
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key inválida o no proporcionada" },
        { status: 401 }
      );
    }

    const permissions = JSON.parse(apiKey.permissions || "[]");
    if (!permissions.includes("read_messages")) {
      return NextResponse.json(
        { error: "No tienes permiso para leer mensajes" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const connectionId = searchParams.get("connectionId");
    const limit = Number.parseInt(searchParams.get("limit") || "50");
    const offset = Number.parseInt(searchParams.get("offset") || "0");

    // Get user's connections
    const connections = await prisma.whatsAppConnection.findMany({
      where: { userId: apiKey.userId },
      select: { id: true },
    });

    const connectionIds = connections.map(c => c.id);

    const messages = await prisma.message.findMany({
      where: {
        connectionId: connectionId ? connectionId : { in: connectionIds },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("API get messages error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
