import type { NocoBaseStreamEvent } from "./stream-parser";

export type NocoBaseToolCall = {
  id?: string;
  index?: number;
  name?: string;
  args?: unknown;
  input?: unknown;
  output?: unknown;
  content?: unknown;
  status?: string;
  invokeStatus?: string;
  invokeStartTime?: unknown;
  invokeEndTime?: unknown;
  messageId?: string;
  willInterrupt?: boolean;
  auto?: boolean;
  selectedSuggestion?: string;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export const toolCallsFromEvent = (event: NocoBaseStreamEvent) => {
  if (Array.isArray(event.body)) return event.body as NocoBaseToolCall[];
  if (!isRecord(event.body) || !Array.isArray(event.body.toolCalls)) return [];
  return event.body.toolCalls as NocoBaseToolCall[];
};

export const parseToolInput = (input: unknown) => {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return input;
  }
};

const completedToolStatus = new Set(["success", "done", "confirmed"]);
const failedToolStatus = new Set(["error", "failed", "rejected"]);
const pendingInvokeStatus = new Set([
  "interrupted",
  "waiting",
  "pending",
  "running",
]);

export const getToolCallState = (toolCall: NocoBaseToolCall) => {
  const invokeStatus = String(toolCall.invokeStatus ?? "").toLowerCase();
  const resultStatus = String(toolCall.status ?? "").toLowerCase();
  const failed =
    failedToolStatus.has(invokeStatus) || failedToolStatus.has(resultStatus);
  const completed =
    !failed &&
    (completedToolStatus.has(invokeStatus) ||
      (!invokeStatus && completedToolStatus.has(resultStatus)));
  return {
    invokeStatus,
    resultStatus,
    failed,
    completed,
    pending: !failed && !completed && pendingInvokeStatus.has(invokeStatus),
  };
};

export const getToolProviderMetadata = (toolCall: NocoBaseToolCall) => {
  const { invokeStatus, resultStatus } = getToolCallState(toolCall);
  return {
    nocobase: {
      requiresApproval:
        (invokeStatus === "interrupted" ||
          (!invokeStatus && toolCall.willInterrupt === true)) &&
        toolCall.auto !== true,
      autoApprove: invokeStatus === "interrupted" && toolCall.auto === true,
      invokeStatus,
      ...(typeof toolCall.selectedSuggestion === "string"
        ? { selectedSuggestion: toolCall.selectedSuggestion }
        : {}),
      status: resultStatus,
    },
  };
};
