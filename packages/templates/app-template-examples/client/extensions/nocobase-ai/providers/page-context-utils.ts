import type { AIEmployeeTask, AIWorkContextItem } from './types.js';

export function createAIPageContextReference({
  id,
  title,
  kind,
}: {
  id: string;
  title: string;
  kind?: string;
}): AIWorkContextItem {
  return {
    type: 'page-element',
    id,
    title,
    ...(kind ? { kind } : {}),
  };
}

const isFormContext = (item: AIWorkContextItem) => {
  if (item.kind === 'form') return true;
  if (!item.content || typeof item.content !== 'object') return false;
  const content = item.content as Record<string, unknown>;
  return typeof content.form === 'string' && Array.isArray(content.fields);
};

export function getAIWorkContextRequiredTools(
  items: AIWorkContextItem[],
): string[] {
  return items.some(isFormContext) ? ['formFiller'] : [];
}

export function getAIWorkContextToolScope(items: AIWorkContextItem[]): {
  allowedFrontendToolIds: string[];
  allowedFormIds: string[];
} {
  const frontendToolIds = new Set<string>();
  const formIds = new Set<string>();
  for (const item of items) {
    if (Array.isArray(item.frontendTools)) {
      for (const tool of item.frontendTools) {
        if (
          tool &&
          typeof tool === 'object' &&
          typeof (tool as { id?: unknown }).id === 'string'
        ) {
          frontendToolIds.add((tool as { id: string }).id);
        }
      }
    }
    if (isFormContext(item)) {
      const form = (item.content as { form?: unknown } | undefined)?.form;
      if (typeof form === 'string' && form) formIds.add(form);
    }
  }
  return {
    allowedFrontendToolIds: [...frontendToolIds],
    allowedFormIds: [...formIds],
  };
}

/**
 * Adds the tools a work context needs to a task's tool allowlist. The server
 * reads a non-empty `tools` list as the only tools the session may use, so
 * without an allowlist there is nothing to add to: the employee's tools are
 * all available already, and creating a list here would hide every other one.
 */
export function mergeAIRequiredTools(
  skillSettings: AIEmployeeTask['skillSettings'],
  requiredTools: string[],
): AIEmployeeTask['skillSettings'] {
  const tools = skillSettings?.tools;
  if (!requiredTools.length || !tools?.length) return skillSettings;
  return {
    ...skillSettings,
    tools: [...new Set([...tools, ...requiredTools])],
  };
}
