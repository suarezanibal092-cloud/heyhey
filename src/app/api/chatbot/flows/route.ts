import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Get flows
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;

    const flows = await prisma.chatbotFlow.findMany({
      where: { userId },
      include: { nodes: { orderBy: { position: "asc" } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ flows });
  } catch (error) {
    console.error("Get flows error:", error);
    return NextResponse.json({ error: "Error al obtener flujos" }, { status: 500 });
  }
}

// Create flow
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { name, description, triggerType, triggerValue, nodes } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Nombre es requerido" }, { status: 400 });
    }

    const flow = await prisma.chatbotFlow.create({
      data: {
        userId,
        name,
        description,
        triggerType: triggerType || "keyword",
        triggerValue,
        nodes: {
          create: (nodes || []).map((node: {
            nodeType: string;
            content: string;
            options?: string;
            nextNodeId?: string;
            position?: number;
          }, index: number) => ({
            nodeType: node.nodeType,
            content: node.content,
            options: node.options,
            nextNodeId: node.nextNodeId,
            position: node.position || index,
          })),
        },
      },
      include: { nodes: true },
    });

    return NextResponse.json({ flow });
  } catch (error) {
    console.error("Create flow error:", error);
    return NextResponse.json({ error: "Error al crear flujo" }, { status: 500 });
  }
}

// Update flow
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { id, name, description, triggerType, triggerValue, isActive, nodes } = await request.json();

    // Delete existing nodes and recreate
    await prisma.chatbotNode.deleteMany({ where: { flowId: id } });

    const flow = await prisma.chatbotFlow.update({
      where: { id },
      data: {
        name,
        description,
        triggerType,
        triggerValue,
        isActive,
        nodes: {
          create: (nodes || []).map((node: {
            nodeType: string;
            content: string;
            options?: string;
            nextNodeId?: string;
            position?: number;
          }, index: number) => ({
            nodeType: node.nodeType,
            content: node.content,
            options: node.options,
            nextNodeId: node.nextNodeId,
            position: node.position || index,
          })),
        },
      },
      include: { nodes: true },
    });

    return NextResponse.json({ flow });
  } catch (error) {
    console.error("Update flow error:", error);
    return NextResponse.json({ error: "Error al actualizar flujo" }, { status: 500 });
  }
}

// Delete flow
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { id } = await request.json();

    await prisma.chatbotFlow.deleteMany({
      where: { id, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete flow error:", error);
    return NextResponse.json({ error: "Error al eliminar flujo" }, { status: 500 });
  }
}
