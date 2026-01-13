import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "hh_";
  for (let i = 0; i < 40; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Get API keys
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Mask the keys
    const maskedKeys = apiKeys.map(k => ({
      ...k,
      key: k.key.substring(0, 10) + "..." + k.key.substring(k.key.length - 4),
    }));

    return NextResponse.json({ apiKeys: maskedKeys });
  } catch (error) {
    console.error("Get API keys error:", error);
    return NextResponse.json({ error: "Error al obtener API keys" }, { status: 500 });
  }
}

// Create API key
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { name, permissions } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });
    }

    const key = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        userId,
        name,
        key,
        permissions: JSON.stringify(permissions || ["read_messages", "send_messages"]),
      },
    });

    // Return full key only on creation
    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // Full key shown only once
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt,
      },
      message: "Guarda esta clave, no se mostrará de nuevo.",
    });
  } catch (error) {
    console.error("Create API key error:", error);
    return NextResponse.json({ error: "Error al crear API key" }, { status: 500 });
  }
}

// Delete API key
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { id } = await request.json();

    await prisma.apiKey.deleteMany({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete API key error:", error);
    return NextResponse.json({ error: "Error al eliminar API key" }, { status: 500 });
  }
}
