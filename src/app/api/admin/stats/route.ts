import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    // Get current stats
    const [
      totalUsers,
      totalConnections,
      activeConnections,
      totalMessages,
      totalWebhooks,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.whatsAppConnection.count(),
      prisma.whatsAppConnection.count({ where: { status: "connected" } }),
      prisma.message.count(),
      prisma.webhookLog.count(),
    ]);

    // Get users created in last 7 days
    const last7Days = subDays(new Date(), 7);
    const newUsersLast7Days = await prisma.user.count({
      where: { createdAt: { gte: last7Days } },
    });

    // Get daily stats for the last 30 days
    const last30Days = subDays(new Date(), 30);
    const dailyData: { date: string; users: number; messages: number; webhooks: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [usersCount, messagesCount, webhooksCount] = await Promise.all([
        prisma.user.count({
          where: {
            createdAt: { gte: dayStart, lt: dayEnd },
          },
        }),
        prisma.message.count({
          where: {
            createdAt: { gte: dayStart, lt: dayEnd },
          },
        }),
        prisma.webhookLog.count({
          where: {
            createdAt: { gte: dayStart, lt: dayEnd },
          },
        }),
      ]);

      dailyData.push({
        date: format(date, "MM/dd"),
        users: usersCount,
        messages: messagesCount,
        webhooks: webhooksCount,
      });
    }

    // Get messages by direction
    const [inboundMessages, outboundMessages] = await Promise.all([
      prisma.message.count({ where: { direction: "inbound" } }),
      prisma.message.count({ where: { direction: "outbound" } }),
    ]);

    // Get recent activity
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const recentConnections = await prisma.whatsAppConnection.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        newUsersLast7Days,
        totalConnections,
        activeConnections,
        totalMessages,
        inboundMessages,
        outboundMessages,
        totalWebhooks,
      },
      dailyData,
      recentUsers,
      recentConnections,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}
