import type { AIChatMessage } from '../../providers/index.js';

export type ToolCallPart = Extract<
  AIChatMessage['parts'][number],
  { type: `tool-${string}` | 'dynamic-tool' }
>;

export function isToolCallPart(
  part: AIChatMessage['parts'][number],
): part is ToolCallPart {
  return part.type === 'dynamic-tool' || part.type.startsWith('tool-');
}

export const getToolCallName = (part: ToolCallPart) =>
  part.type === 'dynamic-tool' ? part.toolName : part.type.slice(5);

export type NocoBaseToolCallMetadata = {
  autoApprove?: boolean;
  invokeStatus?: string;
  messageId?: string;
  requiresApproval?: boolean;
  selectedSuggestion?: string;
  status?: string;
};

export const getNocoBaseToolCallMetadata = (part: ToolCallPart) => {
  if (!('callProviderMetadata' in part)) return undefined;
  const metadata = part.callProviderMetadata?.nocobase;
  return metadata && typeof metadata === 'object'
    ? (metadata as NocoBaseToolCallMetadata)
    : undefined;
};
