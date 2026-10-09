// How many runs this machine takes at once: a total across every application, and optionally a limit per coding tool
// beside it (`claude=2,codex=1`), for tools whose subscription or rate limits allow fewer sessions than the machine.
import {
  AGENT_TOOLS,
  type AgentTool,
  type ToolSlots,
} from '../protocol/index.ts';
import { UsageError } from './command.ts';

/** The most runs at once `--slots` accepts, in total and per tool. */
export const MAX_SLOTS = 32;

/** What `--slots` says: a total, limits per tool, or both. */
export interface SlotsFlag {
  slots?: number;
  toolSlots?: ToolSlots;
}

function count(text: string, what: string): number {
  const value = Number(text);
  if (!/^\d+$/u.test(text) || value < 1 || value > MAX_SLOTS)
    throw new UsageError(
      `--slots: ${what} must be a whole number from 1 to ${MAX_SLOTS}; got ${text || 'nothing'}.`,
    );
  return value;
}

/** `3`, `claude=2,codex=1` or `3,claude=2,codex=1`. */
export function parseSlotsFlag(value: string): SlotsFlag {
  const result: SlotsFlag = {};
  const tools: Partial<Record<AgentTool, number>> = {};
  for (const part of value.split(',').map((item) => item.trim())) {
    const equals = part.indexOf('=');
    if (equals < 0) {
      if (result.slots !== undefined)
        throw new UsageError(`--slots names the total twice: ${value}.`);
      result.slots = count(part, 'the total');
      continue;
    }
    const tool = part.slice(0, equals).trim();
    if (!(AGENT_TOOLS as readonly string[]).includes(tool))
      throw new UsageError(
        `--slots: ${tool || 'nothing'} is not a coding tool; use one of ${AGENT_TOOLS.join(', ')}.`,
      );
    if (tools[tool as AgentTool] !== undefined)
      throw new UsageError(`--slots names ${tool} twice: ${value}.`);
    tools[tool as AgentTool] = count(part.slice(equals + 1).trim(), tool);
  }
  if (Object.keys(tools).length > 0) result.toolSlots = tools;
  return result;
}

/** `claude=2, codex=1`, in the protocol's order; empty for no limits per tool. */
export function formatToolSlots(toolSlots: ToolSlots | undefined): string {
  return AGENT_TOOLS.filter((tool) => toolSlots?.[tool] !== undefined)
    .map((tool) => `${tool}=${toolSlots?.[tool]}`)
    .join(', ');
}
