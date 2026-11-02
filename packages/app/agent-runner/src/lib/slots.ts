import { AGENT_TOOLS, type ToolSlots } from '../protocol/index.ts';

/** `claude=2, codex=1`, in the protocol's order; empty for no limits per tool. */
export function formatToolSlots(toolSlots: ToolSlots | undefined): string {
  return AGENT_TOOLS.filter((tool) => toolSlots?.[tool] !== undefined)
    .map((tool) => `${tool}=${toolSlots?.[tool]}`)
    .join(', ');
}
