import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    const users = await prisma.user.findMany({
      include: {
        whatsappConnections: true,
        _count: {
          select: {
            webhookLogs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Remove passwords from response
    const sanitizedUsers = users.map((user) => ({
      ...user,
      password: undefined,
    }));

    return NextResponse.json({ users: sanitizedUsers });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}
