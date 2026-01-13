import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

// GET - Obtener estadísticas del dashboard
export async function GET() {
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

    // Get user's connections
    const connections = await prisma.whatsAppConnection.findMany({
      where: { userId: user.id },
      select: { id: true },
    });

    const connectionIds = connections.map(c => c.id);

    // Basic stats
    const totalContacts = await prisma.contact.count({
      where: { userId: user.id },
    });

    const totalMessages = await prisma.message.count({
      where: { connectionId: { in: connectionIds } },
    });

    const messagesIn = await prisma.message.count({
      where: { connectionId: { in: connectionIds }, direction: "inbound" },
    });

    const messagesOut = await prisma.message.count({
      where: { connectionId: { in: connectionIds }, direction: "outbound" },
    });

    const pendingScheduled = await prisma.scheduledMessage.count({
      where: { userId: user.id, status: "pending" },
    });

    // Messages per day (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const inbound = await prisma.message.count({
        where: {
          connectionId: { in: connectionIds },
          direction: "inbound",
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      const outbound = await prisma.message.count({
        where: {
          connectionId: { in: connectionIds },
          direction: "outbound",
          createdAt: { gte: dayStart, lte: dayEnd },
        },
      });

      last7Days.push({
        date: format(date, "dd/MM"),
        name: format(date, "EEE"),
        inbound,
        outbound,
        total: inbound + outbound,
      });
    }

    // Messages by status
    const messagesByStatus = await prisma.message.groupBy({
      by: ["status"],
      where: { connectionId: { in: connectionIds } },
      _count: { status: true },
    });

    const statusData = messagesByStatus.map(s => ({
      name: s.status,
      value: s._count.status,
    }));

    // Top contacts by messages
    const topContacts = await prisma.message.groupBy({
      by: ["from"],
      where: {
        connectionId: { in: connectionIds },
        direction: "inbound",
      },
      _count: { from: true },
      orderBy: { _count: { from: "desc" } },
      take: 5,
    });

    // Recent activity
    const recentMessages = await prisma.message.findMany({
      where: { connectionId: { in: connectionIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        from: true,
        to: true,
        content: true,
        direction: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      summary: {
        totalContacts,
        totalMessages,
        messagesIn,
        messagesOut,
        pendingScheduled,
        connections: connections.length,
      },
      charts: {
        last7Days,
        statusData,
        topContacts: topContacts.map(c => ({
          phone: c.from,
          messages: c._count.from,
        })),
      },
      recentActivity: recentMessages,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
