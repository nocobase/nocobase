import type { InferUIMessageChunk } from "ai";
import type { AIChatMessage, AISubAgentConversation } from "./types";
import type { NocoBaseStreamEvent } from "./stream-parser";
import {
  getToolCallState,
  getToolProviderMetadata,
  isRecord,
  parseToolInput,
  toolCallsFromEvent,
  type NocoBaseToolCall,
} from "./stream-event-utils";

type AIChatChunk = InferUIMessageChunk<AIChatMessage>;

const createMessage = (username: string): AIChatMessage => ({
  id: `sub-agent-${crypto.randomUUID()}`,
  role: "assistant",
  metadata: {
    createdAt: new Date().toISOString(),
    employeeUsername: username,
  },
  parts: [],
});

const updateLastMessage = (
  conversation: AISubAgentConversation,
  updater: (message: AIChatMessage) => AIChatMessage
) => {
  const messages = conversation.messages.length
    ? [...conversation.messages]
    : [createMessage(conversation.username)];
  messages[messages.length - 1] = updater(messages[messages.length - 1]);
  return { ...conversation, messages };
};

const appendNarrative = (
  message: AIChatMessage,
  type: "text" | "reasoning",
  delta: string
): AIChatMessage => {
  const parts = [...message.parts];
  const last = parts.at(-1);
  if (last?.type === type) {
    parts[parts.length - 1] = {
      ...last,
      text: `${last.text}${delta}`,
      state: "streaming",
    };
  } else {
    parts.push({ type, text: delta, state: "streaming" });
  }
  return { ...message, parts };
};

const toToolPart = (
  toolCall: NocoBaseToolCall
): AIChatMessage["parts"][number] => {
  const toolCallId = toolCall.id ?? `tool-${crypto.randomUUID()}`;
  const toolName = toolCall.name ?? "tool";
  const input = parseToolInput(toolCall.args ?? toolCall.input ?? {});
  const state = getToolCallState(toolCall);
  const callProviderMetadata = getToolProviderMetadata(toolCall);
  if (state.failed) {
    return {
      type: "dynamic-tool",
      toolCallId,
      toolName,
      state: "output-error",
      input,
      errorText: String(
        toolCall.content ?? toolCall.output ?? "Tool call failed"
      ),
      callProviderMetadata,
    };
  }
  if (state.completed) {
    return {
      type: "dynamic-tool",
      toolCallId,
      toolName,
      state: "output-available",
      input,
      output: toolCall.output ?? toolCall.content ?? { status: "completed" },
      callProviderMetadata,
    };
  }
  return {
    type: "dynamic-tool",
    toolCallId,
    toolName,
    state: "input-available",
    input,
    callProviderMetadata,
  };
};

const updateToolCalls = (
  message: AIChatMessage,
  toolCalls: NocoBaseToolCall[]
) => {
  const parts = [...message.parts];
  for (const toolCall of toolCalls) {
    const nextPart = toToolPart(toolCall);
    if (nextPart.type !== "dynamic-tool") continue;
    const index = parts.findIndex(
      (part) =>
        part.type === "dynamic-tool" && part.toolCallId === nextPart.toolCallId
    );
    if (index >= 0) parts[index] = nextPart;
    else parts.push(nextPart);
  }
  return { ...message, parts };
};

const finishMessages = (messages: AIChatMessage[]) =>
  messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) =>
      part.type === "text" || part.type === "reasoning"
        ? { ...part, state: "done" as const }
        : part
    ),
  }));

export class SubAgentStreamAccumulator {
  private readonly conversations = new Map<string, AISubAgentConversation>();
  private readonly toolStreams = new Map<
    string,
    {
      currentId?: string;
      idsByIndex: Map<number, string>;
      names: Map<string, string>;
      inputs: Map<string, unknown>;
    }
  >();

  constructor(seedMessage?: AIChatMessage) {
    if (!seedMessage) return;
    const seed = (messages: AIChatMessage[]) => {
      for (const message of messages) {
        for (const part of message.parts) {
          if (part.type !== "data-subAgent") continue;
          this.conversations.set(part.data.sessionId, structuredClone(part.data));
          seed(part.data.messages);
        }
      }
    };
    seed([seedMessage]);
  }

  private getToolStream(sessionId: string) {
    const existing = this.toolStreams.get(sessionId);
    if (existing) return existing;
    const created = {
      currentId: undefined,
      idsByIndex: new Map<number, string>(),
      names: new Map<string, string>(),
      inputs: new Map<string, unknown>(),
    };
    this.toolStreams.set(sessionId, created);
    return created;
  }

  private normalizeToolChunk(
    sessionId: string,
    chunk: NocoBaseToolCall
  ): NocoBaseToolCall | undefined {
    const stream = this.getToolStream(sessionId);
    const indexedId =
      typeof chunk.index === "number"
        ? stream.idsByIndex.get(chunk.index)
        : undefined;
    const toolCallId = chunk.id ?? indexedId ?? stream.currentId;
    if (!toolCallId) return undefined;

    stream.currentId = toolCallId;
    if (typeof chunk.index === "number") {
      stream.idsByIndex.set(chunk.index, toolCallId);
    }
    if (chunk.name) stream.names.set(toolCallId, chunk.name);

    if (typeof chunk.args === "string") {
      const previous = stream.inputs.get(toolCallId);
      stream.inputs.set(
        toolCallId,
        `${typeof previous === "string" ? previous : ""}${chunk.args}`
      );
    } else if (chunk.args !== undefined) {
      stream.inputs.set(toolCallId, chunk.args);
    } else if (chunk.input !== undefined) {
      stream.inputs.set(toolCallId, chunk.input);
    }

    return {
      ...chunk,
      id: toolCallId,
      name: chunk.name ?? stream.names.get(toolCallId) ?? "tool",
      args: stream.inputs.get(toolCallId),
    };
  }

  private normalizeToolCall(
    sessionId: string,
    toolCall: NocoBaseToolCall
  ): NocoBaseToolCall {
    const stream = this.getToolStream(sessionId);
    const toolCallId =
      toolCall.id ?? stream.currentId ?? `tool-${crypto.randomUUID()}`;
    stream.currentId = toolCallId;
    if (typeof toolCall.index === "number") {
      stream.idsByIndex.set(toolCall.index, toolCallId);
    }
    const toolName = toolCall.name ?? stream.names.get(toolCallId) ?? "tool";
    stream.names.set(toolCallId, toolName);
    const input = toolCall.args ?? toolCall.input;
    if (input !== undefined) stream.inputs.set(toolCallId, input);
    return {
      ...toolCall,
      id: toolCallId,
      name: toolName,
      args: input ?? stream.inputs.get(toolCallId),
    };
  }

  process(event: NocoBaseStreamEvent): AIChatChunk[] {
    if (event.from !== "sub-agent" || !event.sessionId) return [];
    const username = event.username || "sub-agent";
    let conversation = this.conversations.get(event.sessionId) ?? {
      sessionId: event.sessionId,
      username,
      status: "pending" as const,
      messages: [],
    };

    if (event.type === "new_message") {
      this.getToolStream(event.sessionId).currentId = undefined;
      conversation = {
        ...conversation,
        username,
        messages: [...conversation.messages, createMessage(username)],
      };
    } else if (event.type === "content" && typeof event.body === "string") {
      conversation = updateLastMessage(conversation, (message) =>
        appendNarrative(message, "text", event.body as string)
      );
    } else if (event.type === "reasoning" && isRecord(event.body)) {
      const content = event.body.content;
      if (typeof content === "string" && content) {
        conversation = updateLastMessage(conversation, (message) =>
          appendNarrative(message, "reasoning", content)
        );
      }
    } else if (event.type === "tool_call_chunks") {
      const toolCalls = toolCallsFromEvent(event).flatMap((toolCall) => {
        const normalized = this.normalizeToolChunk(event.sessionId!, toolCall);
        return normalized ? [normalized] : [];
      });
      if (toolCalls.length) {
        conversation = updateLastMessage(conversation, (message) =>
          updateToolCalls(message, toolCalls)
        );
      }
    } else if (event.type === "tool_calls") {
      const toolCalls = toolCallsFromEvent(event).map((toolCall) =>
        this.normalizeToolCall(event.sessionId!, toolCall)
      );
      if (toolCalls.length) {
        conversation = updateLastMessage(conversation, (message) =>
          updateToolCalls(message, toolCalls)
        );
      }
    } else if (event.type === "tool_call_status" && isRecord(event.body)) {
      const rawToolCall = isRecord(event.body.toolCall)
        ? ({
            ...event.body.toolCall,
            invokeStatus:
              event.body.invokeStatus ?? event.body.toolCall.invokeStatus,
            status: event.body.status ?? event.body.toolCall.status,
            content: event.body.content ?? event.body.toolCall.content,
          } as NocoBaseToolCall)
        : undefined;
      const toolCall = rawToolCall
        ? this.normalizeToolCall(event.sessionId, rawToolCall)
        : undefined;
      if (toolCall) {
        conversation = updateLastMessage(conversation, (message) => {
          const updated = updateToolCalls(message, [toolCall]);
          return toolCall.messageId
            ? {
                ...updated,
                metadata: {
                  ...updated.metadata,
                  serverMessageId: String(toolCall.messageId),
                },
              }
            : updated;
        });
      }
    } else if (event.type === "sub_agent_completed") {
      conversation = {
        ...conversation,
        status: "completed",
        messages: finishMessages(conversation.messages),
      };
    }

    this.conversations.set(event.sessionId, conversation);
    return [
      {
        type: "data-subAgent",
        id: event.sessionId,
        data: conversation,
      },
    ];
  }
}
