import type { InferUIMessageChunk } from "ai";
import { parseNocoBaseSSE, type NocoBaseStreamEvent } from "./stream-parser";
import { StreamCoalescer } from "./stream-coalescer";
import {
  getToolCallState,
  getToolProviderMetadata,
  isRecord,
  parseToolInput,
  toolCallsFromEvent,
  type NocoBaseToolCall,
} from "./stream-event-utils";
import { SubAgentStreamAccumulator } from "./sub-agent-stream";
import type { AIChatMessage } from "./types";

const VISUAL_DELTA_FLUSH_INTERVAL = 50;
const VISUAL_DELTA_FLUSH_SIZE = 768;
const TOOL_INPUT_FLUSH_INTERVAL = 50;
const TOOL_INPUT_FLUSH_SIZE = 2048;

type AIChatChunk = InferUIMessageChunk<AIChatMessage>;

type BufferedVisualDelta = {
  type: "text-delta" | "reasoning-delta";
  id: string;
  delta: string;
};

type BufferedSubAgentEvent = {
  event: NocoBaseStreamEvent;
  content: string;
};

type BufferedSubAgentToolEvent = {
  event: NocoBaseStreamEvent;
  chunks: NocoBaseToolCall[];
  size: number;
};

const reasoningContent = (event: NocoBaseStreamEvent) => {
  if (typeof event.body === "object" && event.body) {
    const content = (event.body as { content?: unknown }).content;
    return typeof content === "string" ? content : "";
  }
  return "";
};

const mergeToolCallChunks = (
  current: BufferedSubAgentToolEvent,
  incoming: BufferedSubAgentToolEvent
) => {
  const chunks = current.chunks.map((chunk) => ({ ...chunk }));
  for (const chunk of incoming.chunks) {
    const last = chunks.at(-1);
    if (
      last &&
      !chunk.name &&
      (chunk.id === undefined || chunk.id === last.id) &&
      (chunk.index === undefined || chunk.index === last.index) &&
      typeof chunk.args === "string"
    ) {
      last.args = `${typeof last.args === "string" ? last.args : ""}${
        chunk.args
      }`;
    } else {
      chunks.push({ ...chunk });
    }
  }
  return {
    event: incoming.event,
    chunks,
    size: current.size + incoming.size,
  };
};

export function createNocoBaseUIMessageStream(
  stream: ReadableStream<Uint8Array>,
  messageId: string | null = `assistant-${crypto.randomUUID()}`,
  options: { waitForNewMessage?: boolean; seedMessage?: AIChatMessage } = {}
): ReadableStream<AIChatChunk> {
  return new ReadableStream<AIChatChunk>({
    async start(controller) {
      let textId = `text-${crypto.randomUUID()}`;
      let reasoningId = `reasoning-${crypto.randomUUID()}`;
      let textStarted = false;
      let reasoningStarted = false;
      let currentToolCallId: string | undefined;
      let responseStarted = options.waitForNewMessage !== true;
      const announcedToolCalls = new Set<string>();
      const toolCallNames = new Map<string, string>();
      const toolCallInputs = new Map<string, unknown>();
      const subAgents = new SubAgentStreamAccumulator(options.seedMessage);
      controller.enqueue(
        messageId === null ? { type: "start" } : { type: "start", messageId }
      );

      const visualDeltas = new StreamCoalescer<string, BufferedVisualDelta>({
        interval: VISUAL_DELTA_FLUSH_INTERVAL,
        maxSize: VISUAL_DELTA_FLUSH_SIZE,
        getSize: (value) => value.delta.length,
        merge: (current, incoming) => ({
          ...incoming,
          delta: `${current.delta}${incoming.delta}`,
        }),
        onFlush: (_, value) => controller.enqueue(value),
      });

      const toolInputDeltas = new StreamCoalescer<string, string>({
        interval: TOOL_INPUT_FLUSH_INTERVAL,
        maxSize: TOOL_INPUT_FLUSH_SIZE,
        getSize: (value) => value.length,
        merge: (current, incoming) => `${current}${incoming}`,
        onFlush: (toolCallId, inputTextDelta) => {
          controller.enqueue({
            type: "tool-input-delta",
            toolCallId,
            inputTextDelta,
          });
        },
      });

      const subAgentToolEvents = new StreamCoalescer<
        string,
        BufferedSubAgentToolEvent
      >({
        interval: TOOL_INPUT_FLUSH_INTERVAL,
        maxSize: TOOL_INPUT_FLUSH_SIZE,
        getSize: (value) => value.size,
        merge: mergeToolCallChunks,
        onFlush: (_, value) => {
          for (const chunk of subAgents.process({
            ...value.event,
            body: value.chunks,
          })) {
            controller.enqueue(chunk);
          }
        },
      });

      const enqueueSubAgentToolEvent = (event: NocoBaseStreamEvent) => {
        const sessionId = event.sessionId;
        if (!sessionId) return;
        const chunks = toolCallsFromEvent(event);
        subAgentToolEvents.push(sessionId, {
          event,
          chunks,
          size: chunks.reduce(
            (size, chunk) =>
              size + (typeof chunk.args === "string" ? chunk.args.length : 0),
            0
          ),
        });
      };

      const enqueueVisualDelta = (chunk: BufferedVisualDelta) => {
        visualDeltas.push(`${chunk.type}:${chunk.id}`, chunk);
      };

      const subAgentNarrativeEvents = new StreamCoalescer<
        string,
        BufferedSubAgentEvent
      >({
        interval: VISUAL_DELTA_FLUSH_INTERVAL,
        maxSize: VISUAL_DELTA_FLUSH_SIZE,
        getSize: (value) => value.content.length,
        merge: (current, incoming) => ({
          event: incoming.event,
          content: `${current.content}${incoming.content}`,
        }),
        onFlush: (_, pending) => {
          const body =
            pending.event.type === "reasoning" && isRecord(pending.event.body)
              ? { ...pending.event.body, content: pending.content }
              : pending.content;
          for (const chunk of subAgents.process({ ...pending.event, body })) {
            controller.enqueue(chunk);
          }
        },
      });

      const subAgentNarrativeKey = (sessionId: string, type: string) =>
        `${sessionId}:${type}`;

      const flushSubAgentNarrativeEvents = (sessionId?: string) => {
        if (!sessionId) {
          subAgentNarrativeEvents.flushAll();
          return;
        }
        subAgentNarrativeEvents.flush(
          subAgentNarrativeKey(sessionId, "reasoning")
        );
        subAgentNarrativeEvents.flush(
          subAgentNarrativeKey(sessionId, "content")
        );
      };

      const enqueueSubAgentNarrativeEvent = (event: NocoBaseStreamEvent) => {
        const sessionId = event.sessionId;
        if (!sessionId) return;
        const content =
          event.type === "content" && typeof event.body === "string"
            ? event.body
            : event.type === "reasoning" && isRecord(event.body)
            ? typeof event.body.content === "string"
              ? event.body.content
              : ""
            : "";
        if (!content) return;
        const otherType = event.type === "content" ? "reasoning" : "content";
        subAgentNarrativeEvents.flush(
          subAgentNarrativeKey(sessionId, otherType)
        );
        subAgentNarrativeEvents.push(
          subAgentNarrativeKey(sessionId, event.type),
          { event, content }
        );
      };

      const finishActiveText = () => {
        if (!textStarted) return;
        visualDeltas.flush(`text-delta:${textId}`);
        controller.enqueue({ type: "text-end", id: textId });
        textStarted = false;
        textId = `text-${crypto.randomUUID()}`;
      };

      const finishActiveReasoning = () => {
        if (!reasoningStarted) return;
        visualDeltas.flush(`reasoning-delta:${reasoningId}`);
        controller.enqueue({ type: "reasoning-end", id: reasoningId });
        reasoningStarted = false;
        reasoningId = `reasoning-${crypto.randomUUID()}`;
      };

      const finishActiveNarrative = () => {
        finishActiveReasoning();
        finishActiveText();
      };

      try {
        for await (const event of parseNocoBaseSSE(stream)) {
          if (event.type !== "tool_call_chunks") {
            toolInputDeltas.flushAll();
          }
          if (event.from === "sub-agent") {
            finishActiveNarrative();
            if (event.type === "content" || event.type === "reasoning") {
              if (event.sessionId) subAgentToolEvents.flush(event.sessionId);
              enqueueSubAgentNarrativeEvent(event);
              continue;
            }
            flushSubAgentNarrativeEvents(event.sessionId);
            if (event.type === "tool_call_chunks") {
              enqueueSubAgentToolEvent(event);
              continue;
            }
            if (event.sessionId) subAgentToolEvents.flush(event.sessionId);
            for (const chunk of subAgents.process(event)) {
              controller.enqueue(chunk);
            }
            continue;
          }

          flushSubAgentNarrativeEvents();
          subAgentToolEvents.flushAll();

          if (event.type === "new_message") {
            responseStarted = true;
            continue;
          }

          if (!responseStarted && event.type !== "error") {
            continue;
          }

          if (event.type === "content" && typeof event.body === "string") {
            finishActiveReasoning();
            if (!textStarted) {
              controller.enqueue({ type: "text-start", id: textId });
              textStarted = true;
            }
            enqueueVisualDelta({
              type: "text-delta",
              id: textId,
              delta: event.body,
            });
          }

          if (event.type === "reasoning") {
            finishActiveText();
            const delta = reasoningContent(event);
            if (delta && !reasoningStarted) {
              controller.enqueue({
                type: "reasoning-start",
                id: reasoningId,
              });
              reasoningStarted = true;
            }
            if (delta) {
              enqueueVisualDelta({
                type: "reasoning-delta",
                id: reasoningId,
                delta,
              });
            }
          }

          if (event.type === "tool_call_chunks") {
            finishActiveNarrative();
            for (const chunk of toolCallsFromEvent(event)) {
              const toolCallId = chunk.id ?? currentToolCallId;
              if (!toolCallId) continue;
              currentToolCallId = toolCallId;
              if (chunk.name && !announcedToolCalls.has(toolCallId)) {
                toolCallNames.set(toolCallId, chunk.name);
                controller.enqueue({
                  type: "tool-input-start",
                  toolCallId,
                  toolName: chunk.name,
                  dynamic: true,
                });
                announcedToolCalls.add(toolCallId);
              }
              if (typeof chunk.args === "string" && chunk.args) {
                const previousInput = toolCallInputs.get(toolCallId);
                toolCallInputs.set(
                  toolCallId,
                  `${typeof previousInput === "string" ? previousInput : ""}${
                    chunk.args
                  }`
                );
                toolInputDeltas.push(toolCallId, chunk.args);
              }
            }
          }

          if (event.type === "tool_calls") {
            finishActiveNarrative();
            for (const toolCall of toolCallsFromEvent(event)) {
              const toolCallId = toolCall.id ?? `tool-${crypto.randomUUID()}`;
              const toolName = toolCall.name ?? "tool";
              const toolState = getToolCallState(toolCall);
              const { invokeStatus, resultStatus } = toolState;
              const toolInput = parseToolInput(
                toolCall.args ?? toolCall.input ?? {}
              );
              toolCallNames.set(toolCallId, toolName);
              toolCallInputs.set(toolCallId, toolInput);
              controller.enqueue({
                type: "tool-input-available",
                toolCallId,
                toolName,
                input: toolInput,
                providerMetadata: getToolProviderMetadata(toolCall),
                dynamic: true,
              });
              announcedToolCalls.add(toolCallId);

              if (toolState.failed) {
                controller.enqueue({
                  type: "tool-output-error",
                  toolCallId,
                  errorText: String(
                    toolCall.content ?? toolCall.output ?? "Tool call failed"
                  ),
                  dynamic: true,
                });
              } else if (toolState.completed) {
                controller.enqueue({
                  type: "tool-output-available",
                  toolCallId,
                  output: toolCall.output ??
                    toolCall.content ?? {
                      status: invokeStatus || resultStatus,
                    },
                  dynamic: true,
                });
              }
            }
          }

          if (event.type === "tool_call_status" && isRecord(event.body)) {
            finishActiveNarrative();
            const toolCall = isRecord(event.body.toolCall)
              ? (event.body.toolCall as NocoBaseToolCall)
              : undefined;
            const toolCallId = toolCall?.id;
            if (toolCallId) {
              const mergedToolCall = {
                ...toolCall,
                invokeStatus:
                  typeof event.body.invokeStatus === "string"
                    ? event.body.invokeStatus
                    : toolCall.invokeStatus,
                status:
                  typeof event.body.status === "string"
                    ? event.body.status
                    : toolCall.status,
                content: event.body.content ?? toolCall.content,
              } satisfies NocoBaseToolCall;
              const toolState = getToolCallState(mergedToolCall);
              const { invokeStatus, resultStatus } = toolState;
              const toolName =
                toolCall.name ?? toolCallNames.get(toolCallId) ?? "tool";
              const toolInput =
                toolCall.args !== undefined || toolCall.input !== undefined
                  ? parseToolInput(toolCall.args ?? toolCall.input)
                  : parseToolInput(toolCallInputs.get(toolCallId) ?? {});
              toolCallNames.set(toolCallId, toolName);
              toolCallInputs.set(toolCallId, toolInput);
              controller.enqueue({
                type: "tool-input-available",
                toolCallId,
                toolName,
                input: toolInput,
                providerMetadata: getToolProviderMetadata(mergedToolCall),
                dynamic: true,
              });
              announcedToolCalls.add(toolCallId);
              if (toolState.failed) {
                controller.enqueue({
                  type: "tool-output-error",
                  toolCallId,
                  errorText: String(event.body.content ?? "Tool call failed"),
                  dynamic: true,
                });
              } else if (toolState.completed) {
                controller.enqueue({
                  type: "tool-output-available",
                  toolCallId,
                  output: event.body.content ?? {
                    status: invokeStatus || resultStatus,
                  },
                  dynamic: true,
                });
              }
            }
          }

          if (event.type === "error") {
            controller.enqueue({
              type: "error",
              errorText: String(event.body ?? "AI response failed"),
            });
          }
        }

        toolInputDeltas.flushAll();
        visualDeltas.flushAll();
        flushSubAgentNarrativeEvents();
        subAgentToolEvents.flushAll();
        finishActiveNarrative();
        controller.enqueue({ type: "finish" });
        controller.close();
      } catch (error) {
        toolInputDeltas.clear();
        visualDeltas.clear();
        subAgentNarrativeEvents.clear();
        subAgentToolEvents.clear();
        controller.error(error);
      }
    },
  });
}
