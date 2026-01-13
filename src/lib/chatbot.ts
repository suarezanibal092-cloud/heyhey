import prisma from "./prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface IncomingMessage {
  from: string;
  text: string;
  connectionId: string;
  wabaId: string;
}

interface ChatbotResponse {
  shouldRespond: boolean;
  response?: string;
  flowId?: string;
  nodeId?: string;
}

// Process incoming message and determine response
export async function processChatbotMessage(message: IncomingMessage): Promise<ChatbotResponse> {
  const { from, text, connectionId, wabaId } = message;

  // Get connection to find user
  const connection = await prisma.whatsAppConnection.findFirst({
    where: { wabaId },
  });

  if (!connection) {
    return { shouldRespond: false };
  }

  // Check for active conversation
  const conversation = await prisma.chatbotConversation.findFirst({
    where: { connectionId: connection.id, phoneNumber: from, isActive: true },
  });

  // Get all active flows for this user
  const flows = await prisma.chatbotFlow.findMany({
    where: { userId: connection.userId, isActive: true },
    include: { nodes: { orderBy: { position: "asc" } } },
  });

  if (flows.length === 0) {
    return { shouldRespond: false };
  }

  // If in active conversation, continue flow
  if (conversation && conversation.currentFlowId) {
    const flow = flows.find(f => f.id === conversation!.currentFlowId);
    if (flow) {
      return await continueFlow(conversation, flow, text);
    }
  }

  // Check for flow triggers
  for (const flow of flows) {
    if (shouldTriggerFlow(flow, text, !conversation)) {
      return await startFlow(flow, from, connection.id, text);
    }
  }

  // Check for AI flow
  const aiFlow = flows.find(f => f.nodes.some(n => n.nodeType === "ai_response"));
  if (aiFlow) {
    return await processAIResponse(aiFlow, text);
  }

  return { shouldRespond: false };
}

function shouldTriggerFlow(flow: {
  triggerType: string;
  triggerValue: string | null;
}, text: string, isFirstMessage: boolean): boolean {
  switch (flow.triggerType) {
    case "keyword":
      if (!flow.triggerValue) return false;
      const keywords = flow.triggerValue.toLowerCase().split(",").map(k => k.trim());
      return keywords.some(k => text.toLowerCase().includes(k));
    case "all":
      return true;
    case "first_message":
      return isFirstMessage;
    default:
      return false;
  }
}

async function startFlow(
  flow: { id: string; nodes: { id: string; nodeType: string; content: string; options: string | null }[] },
  phoneNumber: string,
  connectionId: string,
  userMessage: string
): Promise<ChatbotResponse> {
  const firstNode = flow.nodes[0];
  if (!firstNode) {
    return { shouldRespond: false };
  }

  // Create or update conversation
  await prisma.chatbotConversation.upsert({
    where: {
      id: `${connectionId}-${phoneNumber}`,
    },
    create: {
      id: `${connectionId}-${phoneNumber}`,
      connectionId,
      phoneNumber,
      currentFlowId: flow.id,
      currentNodeId: firstNode.id,
      context: JSON.stringify({ userMessage }),
      isActive: true,
    },
    update: {
      currentFlowId: flow.id,
      currentNodeId: firstNode.id,
      context: JSON.stringify({ userMessage }),
      isActive: true,
    },
  });

  if (firstNode.nodeType === "ai_response") {
    return await processAIResponse(flow, userMessage);
  }

  return {
    shouldRespond: true,
    response: firstNode.content,
    flowId: flow.id,
    nodeId: firstNode.id,
  };
}

async function continueFlow(
  conversation: { id: string; currentNodeId: string | null; context: string | null },
  flow: { id: string; nodes: { id: string; nodeType: string; content: string; nextNodeId: string | null; options: string | null }[] },
  userMessage: string
): Promise<ChatbotResponse> {
  const currentNode = flow.nodes.find(n => n.id === conversation.currentNodeId);
  if (!currentNode) {
    return { shouldRespond: false };
  }

  // Find next node
  const nextNode = currentNode.nextNodeId
    ? flow.nodes.find(n => n.id === currentNode.nextNodeId)
    : flow.nodes[flow.nodes.indexOf(currentNode) + 1];

  if (!nextNode) {
    // End of flow
    await prisma.chatbotConversation.update({
      where: { id: conversation.id },
      data: { isActive: false },
    });
    return { shouldRespond: false };
  }

  // Update conversation
  await prisma.chatbotConversation.update({
    where: { id: conversation.id },
    data: {
      currentNodeId: nextNode.id,
      context: JSON.stringify({
        ...(conversation.context ? JSON.parse(conversation.context) : {}),
        lastResponse: userMessage,
      }),
    },
  });

  if (nextNode.nodeType === "ai_response") {
    return await processAIResponse(flow, userMessage);
  }

  return {
    shouldRespond: true,
    response: nextNode.content,
    flowId: flow.id,
    nodeId: nextNode.id,
  };
}

async function processAIResponse(
  flow: { id: string; nodes: { nodeType: string; content: string }[] },
  userMessage: string
): Promise<ChatbotResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return { shouldRespond: false };
  }

  const aiNode = flow.nodes.find(n => n.nodeType === "ai_response");
  const systemPrompt = aiNode?.content || "Eres un asistente virtual amable y profesional.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (response) {
      return {
        shouldRespond: true,
        response,
        flowId: flow.id,
      };
    }
  } catch (error) {
    console.error("AI response error:", error);
  }

  return { shouldRespond: false };
}
