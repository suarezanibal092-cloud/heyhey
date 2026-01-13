import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// GET - Exportar conversaciones
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

    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get("format") || "csv";
    const connectionId = searchParams.get("connectionId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Get user's connections
    const connections = await prisma.whatsAppConnection.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const connectionIds = connectionId
      ? [connectionId]
      : connections.map(c => c.id);

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        connectionId: { in: connectionIds },
        ...(startDate && { createdAt: { gte: new Date(startDate) } }),
        ...(endDate && { createdAt: { lte: new Date(endDate) } }),
      },
      orderBy: { createdAt: "asc" },
    });

    if (formatType === "csv") {
      // Generate CSV
      const headers = ["Fecha", "Hora", "De", "Para", "Tipo", "Contenido", "Estado"];
      const rows = messages.map(msg => [
        format(new Date(msg.createdAt), "dd/MM/yyyy", { locale: es }),
        format(new Date(msg.createdAt), "HH:mm:ss", { locale: es }),
        msg.from,
        msg.to,
        msg.messageType,
        `"${msg.content.replace(/"/g, '""')}"`,
        msg.status,
      ]);

      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="conversaciones_${format(new Date(), "yyyyMMdd_HHmmss")}.csv"`,
        },
      });
    }

    // JSON format
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      totalMessages: messages.length,
      messages: messages.map(msg => ({
        date: format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: es }),
        from: msg.from,
        to: msg.to,
        type: msg.messageType,
        content: msg.content,
        status: msg.status,
      })),
    });
  } catch (error) {
    console.error("Error exporting conversations:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
