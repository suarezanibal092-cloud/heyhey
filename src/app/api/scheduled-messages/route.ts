import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar mensajes programados
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const scheduledMessages = await prisma.scheduledMessage.findMany({
      where: { userId: user.id },
      include: {
        connection: {
          select: { phoneNumber: true, businessName: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({ scheduledMessages });
  } catch (error) {
    console.error("Error fetching scheduled messages:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST - Crear mensaje programado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const body = await request.json();
    const { connectionId, recipientPhone, content, messageType, mediaUrl, scheduledAt } = body;

    if (!connectionId || !recipientPhone || !content || !scheduledAt) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Verify connection belongs to user
    const connection = await prisma.whatsAppConnection.findFirst({
      where: { id: connectionId, userId: user.id },
    });

    if (!connection) {
      return NextResponse.json({ error: "Conexión no encontrada" }, { status: 404 });
    }

    const scheduledMessage = await prisma.scheduledMessage.create({
      data: {
        userId: user.id,
        connectionId,
        recipientPhone,
        content,
        messageType: messageType || "text",
        mediaUrl,
        scheduledAt: new Date(scheduledAt),
      },
    });

    return NextResponse.json({ scheduledMessage }, { status: 201 });
  } catch (error) {
    console.error("Error creating scheduled message:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE - Cancelar mensaje programado
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const message = await prisma.scheduledMessage.findFirst({
      where: { id, userId: user.id },
    });

    if (!message) {
      return NextResponse.json({ error: "Mensaje no encontrado" }, { status: 404 });
    }

    if (message.status === "sent") {
      return NextResponse.json({ error: "No se puede cancelar un mensaje ya enviado" }, { status: 400 });
    }

    await prisma.scheduledMessage.update({
      where: { id },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling scheduled message:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
