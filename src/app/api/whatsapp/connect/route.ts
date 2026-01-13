import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { phoneNumber, phoneNumberId, wabaId, businessName, accessToken } =
      await request.json();

    if (!phoneNumberId || !wabaId) {
      return NextResponse.json(
        { error: "phoneNumberId y wabaId son requeridos" },
        { status: 400 }
      );
    }

    const userId = (session.user as { id: string }).id;

    // Check if connection already exists
    const existingConnection = await prisma.whatsAppConnection.findUnique({
      where: { phoneNumberId },
    });

    if (existingConnection) {
      // Update existing connection
      const updated = await prisma.whatsAppConnection.update({
        where: { phoneNumberId },
        data: {
          phoneNumber,
          wabaId,
          businessName,
          accessToken,
          status: "connected",
          connectedAt: new Date(),
        },
      });

      return NextResponse.json({
        message: "Conexión actualizada",
        connection: updated,
      });
    }

    // Create new connection
    const connection = await prisma.whatsAppConnection.create({
      data: {
        userId,
        phoneNumber,
        phoneNumberId,
        wabaId,
        businessName,
        accessToken,
        status: "connected",
        connectedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Conexión creada exitosamente",
      connection,
    });
  } catch (error) {
    console.error("Connection error:", error);
    return NextResponse.json(
      { error: "Error al guardar la conexión" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const connections = await prisma.whatsAppConnection.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("Get connections error:", error);
    return NextResponse.json(
      { error: "Error al obtener conexiones" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { connectionId } = await request.json();
    const userId = (session.user as { id: string }).id;

    // Verify ownership
    const connection = await prisma.whatsAppConnection.findFirst({
      where: { id: connectionId, userId },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Conexión no encontrada" },
        { status: 404 }
      );
    }

    await prisma.whatsAppConnection.delete({
      where: { id: connectionId },
    });

    return NextResponse.json({ message: "Conexión eliminada" });
  } catch (error) {
    console.error("Delete connection error:", error);
    return NextResponse.json(
      { error: "Error al eliminar conexión" },
      { status: 500 }
    );
  }
}
