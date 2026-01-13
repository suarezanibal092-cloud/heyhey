import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar contactos
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
    const search = searchParams.get("search") || "";
    const tagId = searchParams.get("tagId");
    const groupId = searchParams.get("groupId");

    const contacts = await prisma.contact.findMany({
      where: {
        userId: user.id,
        ...(search && {
          OR: [
            { name: { contains: search } },
            { phoneNumber: { contains: search } },
            { email: { contains: search } },
          ],
        }),
        ...(tagId && {
          tags: { some: { tagId } },
        }),
        ...(groupId && {
          groups: { some: { groupId } },
        }),
      },
      include: {
        tags: { include: { tag: true } },
        groups: { include: { group: true } },
        notes: { orderBy: { isPinned: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ contacts });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST - Crear contacto
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
    const { phoneNumber, name, email, company, tagIds } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: "Número de teléfono requerido" }, { status: 400 });
    }

    // Check if contact already exists
    const existing = await prisma.contact.findUnique({
      where: { userId_phoneNumber: { userId: user.id, phoneNumber } },
    });

    if (existing) {
      return NextResponse.json({ error: "El contacto ya existe" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        userId: user.id,
        phoneNumber,
        name,
        email,
        company,
        ...(tagIds?.length && {
          tags: {
            create: tagIds.map((tagId: string) => ({ tagId })),
          },
        }),
      },
      include: {
        tags: { include: { tag: true } },
        groups: { include: { group: true } },
        notes: true,
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PUT - Actualizar contacto
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
    const { id, name, email, company, isBlocked, tagIds } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Verify contact belongs to user
    const existing = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      await prisma.contactTagRelation.deleteMany({
        where: { contactId: id },
      });

      if (tagIds.length > 0) {
        await prisma.contactTagRelation.createMany({
          data: tagIds.map((tagId: string) => ({ contactId: id, tagId })),
        });
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name,
        email,
        company,
        isBlocked,
      },
      include: {
        tags: { include: { tag: true } },
        groups: { include: { group: true } },
        notes: true,
      },
    });

    return NextResponse.json({ contact });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE - Eliminar contacto
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

    const contact = await prisma.contact.findFirst({
      where: { id, userId: user.id },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    }

    await prisma.contact.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
