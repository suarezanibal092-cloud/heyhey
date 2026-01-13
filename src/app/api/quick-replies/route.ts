import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar respuestas rápidas
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

    const quickReplies = await prisma.quickReply.findMany({
      where: { userId: user.id },
      orderBy: { shortcut: "asc" },
    });

    return NextResponse.json({ quickReplies });
  } catch (error) {
    console.error("Error fetching quick replies:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST - Crear respuesta rápida
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
    const { shortcut, title, content, category } = body;

    if (!shortcut || !title || !content) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Ensure shortcut starts with /
    const normalizedShortcut = shortcut.startsWith("/") ? shortcut : `/${shortcut}`;

    // Check if shortcut already exists
    const existing = await prisma.quickReply.findUnique({
      where: { userId_shortcut: { userId: user.id, shortcut: normalizedShortcut } },
    });

    if (existing) {
      return NextResponse.json({ error: "El atajo ya existe" }, { status: 400 });
    }

    const quickReply = await prisma.quickReply.create({
      data: {
        userId: user.id,
        shortcut: normalizedShortcut,
        title,
        content,
        category: category || "general",
      },
    });

    return NextResponse.json({ quickReply }, { status: 201 });
  } catch (error) {
    console.error("Error creating quick reply:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT - Actualizar respuesta rápida
export async function PUT(request: NextRequest) {
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
    const { id, shortcut, title, content, category } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const existing = await prisma.quickReply.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Respuesta rápida no encontrada" }, { status: 404 });
    }

    const normalizedShortcut = shortcut?.startsWith("/") ? shortcut : `/${shortcut}`;

    const quickReply = await prisma.quickReply.update({
      where: { id },
      data: {
        shortcut: normalizedShortcut,
        title,
        content,
        category,
      },
    });

    return NextResponse.json({ quickReply });
  } catch (error) {
    console.error("Error updating quick reply:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE - Eliminar respuesta rápida
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

    const quickReply = await prisma.quickReply.findFirst({
      where: { id, userId: user.id },
    });

    if (!quickReply) {
      return NextResponse.json({ error: "Respuesta rápida no encontrada" }, { status: 404 });
    }

    await prisma.quickReply.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quick reply:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
