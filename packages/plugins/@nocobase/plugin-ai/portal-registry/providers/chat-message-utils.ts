import type { AIChatMessage, AISubAgentConversation } from "./types";

export type AIToolPart = Extract<
  AIChatMessage["parts"][number],
  { type: `tool-${string}` | "dynamic-tool" }
>;

export type AISubAgentPart = Extract<
  AIChatMessage["parts"][number],
  { type: "data-subAgent" }
>;

export const isAIToolPart = (
  part: AIChatMessage["parts"][number]
): part is AIToolPart =>
  part.type === "dynamic-tool" || part.type.startsWith("tool-");

export const isAISubAgentPart = (
  part: AIChatMessage["parts"][number]
): part is AISubAgentPart => part.type === "data-subAgent";

export const getNocoBaseToolMetadata = (part: AIToolPart) => {
  if (!("callProviderMetadata" in part)) return undefined;
  const metadata = part.callProviderMetadata?.nocobase;
  return metadata && typeof metadata === "object"
    ? (metadata as { autoApprove?: unknown })
    : undefined;
};

const getMessageToolCallIds = (message: AIChatMessage) =>
  new Set(
    message.parts
      .filter(isAIToolPart)
      .map((part) => part.toolCallId)
      .filter(Boolean)
  );

const getMessageText = (message: AIChatMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");

const getSubAgentSessionIds = (message: AIChatMessage) =>
  new Set(
    message.parts
      .filter(isAISubAgentPart)
      .map((part) => part.data.sessionId)
      .filter(Boolean)
  );

const reconcileConversation = (
  current: AISubAgentConversation,
  refreshed: AISubAgentConversation
): AISubAgentConversation => ({
  ...refreshed,
  messages: reconcileRefreshedMessages(current.messages, refreshed.messages),
});

const reconcileSubAgents = (
  currentMessage: AIChatMessage,
  refreshedMessage: AIChatMessage
) => {
  const current = currentMessage.parts.filter(isAISubAgentPart);
  return refreshedMessage.parts.map((part) => {
    if (!isAISubAgentPart(part)) return part;
    const currentPart = current.find(
      (item) => item.data.sessionId === part.data.sessionId
    );
    return currentPart
      ? {
          ...part,
          data: reconcileConversation(currentPart.data, part.data),
        }
      : part;
  });
};

export const reconcileRefreshedMessages = (
  current: AIChatMessage[],
  refreshed: AIChatMessage[]
) => {
  const usedCurrentIds = new Set<string>();
  const byServerMessageId = new Map<string, AIChatMessage>();
  const bySubAgentSessionId = new Map<string, AIChatMessage[]>();
  const byToolCallId = new Map<string, AIChatMessage[]>();
  const byRoleAndText = new Map<string, AIChatMessage[]>();
  const addToIndex = (
    index: Map<string, AIChatMessage[]>,
    key: string,
    message: AIChatMessage
  ) => {
    const messages = index.get(key);
    if (messages) messages.push(message);
    else index.set(key, [message]);
  };
  for (const message of current) {
    const serverMessageId = message.metadata?.serverMessageId;
    if (serverMessageId) byServerMessageId.set(serverMessageId, message);
    for (const sessionId of getSubAgentSessionIds(message)) {
      addToIndex(bySubAgentSessionId, sessionId, message);
    }
    for (const toolCallId of getMessageToolCallIds(message)) {
      addToIndex(byToolCallId, toolCallId, message);
    }
    const text = getMessageText(message);
    if (text) addToIndex(byRoleAndText, `${message.role}\0${text}`, message);
  }
  const firstUnused = (messages: AIChatMessage[] | undefined) =>
    messages?.find((message) => !usedCurrentIds.has(message.id));

  return refreshed.map((serverMessage) => {
    const serverToolCallIds = getMessageToolCallIds(serverMessage);
    const serverMessageId = serverMessage.metadata?.serverMessageId;
    let match = serverMessageId
      ? byServerMessageId.get(serverMessageId)
      : undefined;
    if (match && usedCurrentIds.has(match.id)) match = undefined;
    const serverSubAgentSessionIds = getSubAgentSessionIds(serverMessage);
    if (!match && serverSubAgentSessionIds.size) {
      for (const sessionId of serverSubAgentSessionIds) {
        match = firstUnused(bySubAgentSessionId.get(sessionId));
        if (match?.role === serverMessage.role) break;
        match = undefined;
      }
    }
    if (!match && !serverSubAgentSessionIds.size && serverToolCallIds.size) {
      for (const toolCallId of serverToolCallIds) {
        match = firstUnused(byToolCallId.get(toolCallId));
        if (match?.role === serverMessage.role) break;
        match = undefined;
      }
    }
    if (!match && !serverSubAgentSessionIds.size && !serverToolCallIds.size) {
      const serverText = getMessageText(serverMessage);
      if (serverText) {
        match = firstUnused(
          byRoleAndText.get(`${serverMessage.role}\0${serverText}`)
        );
      }
    }
    if (!match) return serverMessage;
    usedCurrentIds.add(match.id);
    return {
      ...serverMessage,
      id: match.id,
      parts: reconcileSubAgents(match, serverMessage),
    };
  });
};

export type ResolvedChatMessage = {
  rootMessage: AIChatMessage;
  targetMessage: AIChatMessage;
  rootIndex: number;
};

export const findChatMessage = (
  messages: AIChatMessage[],
  messageId: string
): ResolvedChatMessage | undefined => {
  const findNestedMessage = (
    message: AIChatMessage
  ): AIChatMessage | undefined => {
    if (message.id === messageId) return message;
    for (const part of message.parts) {
      if (!isAISubAgentPart(part)) continue;
      for (const nestedMessage of part.data.messages) {
        const match = findNestedMessage(nestedMessage);
        if (match) return match;
      }
    }
    return undefined;
  };

  for (const [rootIndex, rootMessage] of messages.entries()) {
    const targetMessage = findNestedMessage(rootMessage);
    if (targetMessage) return { rootMessage, targetMessage, rootIndex };
  }
  return undefined;
};

export const getChatToolParts = (messages: AIChatMessage[]) => {
  const result: Array<{ message: AIChatMessage; part: AIToolPart }> = [];
  const visit = (items: AIChatMessage[]) => {
    for (const message of items) {
      for (const part of message.parts) {
        if (isAIToolPart(part)) {
          result.push({ message, part });
        } else if (isAISubAgentPart(part)) {
          visit(part.data.messages);
        }
      }
    }
  };
  visit(messages);
  return result;
};
