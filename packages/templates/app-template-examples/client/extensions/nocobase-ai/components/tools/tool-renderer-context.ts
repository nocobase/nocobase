import { createContext, useContext, type ComponentType } from 'react';
import type { ToolCallPart } from '../chat/tool-call-utils.js';
import { builtInToolRenderers } from './builtin-tool-renderers.js';

export type AIToolRendererProps = {
  part: ToolCallPart;
  disabled: boolean;
  onEdit: (input: unknown) => void | Promise<void>;
  onApprove: () => void | Promise<void>;
  onReject: (message?: string) => void | Promise<void>;
  onRevise: () => void;
};

export type AIToolRenderer = ComponentType<AIToolRendererProps>;
export type AIToolRendererDefinition = {
  component: AIToolRenderer;
  handlesApproval?: boolean;
  standalone?: boolean;
};
export type AIToolRendererEntry = AIToolRenderer | AIToolRendererDefinition;
export type AIToolRendererMap = Record<string, AIToolRendererEntry>;

export const AIToolRendererContext =
  createContext<AIToolRendererMap>(builtInToolRenderers);

export function useAIToolRenderer(
  toolName: string,
): AIToolRendererDefinition | undefined {
  const entry = useContext(AIToolRendererContext)[toolName];
  if (!entry) return undefined;
  return typeof entry === 'function' ? { component: entry } : entry;
}
