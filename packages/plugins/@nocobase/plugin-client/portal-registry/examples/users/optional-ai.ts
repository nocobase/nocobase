import { useCallback, type RefCallback } from "react";

export type AIFormField = {
  name: string;
  title?: string;
  type?: string;
  description?: string;
  readonly?: boolean;
  required?: boolean;
  enum?: unknown;
  [key: string]: unknown;
};

type AIFormDescriptor = {
  id: string;
  title: string;
  fields: AIFormField[];
  getValues: () => unknown | Promise<unknown>;
  setValues: (values: Record<string, unknown>) => void | Promise<void>;
};

type AIPageElementDescriptor = {
  id: string;
  title: string;
  kind: string;
  getContext: () => unknown | Promise<unknown>;
};

type AIPageElementHandle = {
  ref: RefCallback<HTMLElement>;
  context: unknown;
};

type OptionalAIModule = {
  useAIForm?: (descriptor: AIFormDescriptor) => RefCallback<HTMLElement>;
  useAIPageElementHandle?: (
    descriptor: AIPageElementDescriptor
  ) => AIPageElementHandle;
};

const aiModules = import.meta.glob<OptionalAIModule>(
  "../../../nocobase-ai/index.ts",
  { eager: true }
);
const aiModule = Object.values(aiModules)[0];

function useFallbackAIForm(_descriptor: AIFormDescriptor) {
  return useCallback<RefCallback<HTMLElement>>(() => undefined, []);
}

function useFallbackAIPageElementHandle(
  descriptor: AIPageElementDescriptor
): AIPageElementHandle {
  const ref = useCallback<RefCallback<HTMLElement>>(() => undefined, []);
  return {
    ref,
    context: {
      id: descriptor.id,
      title: descriptor.title,
      kind: descriptor.kind,
    },
  };
}

export const useAIForm = aiModule?.useAIForm ?? useFallbackAIForm;
export const useAIPageElementHandle =
  aiModule?.useAIPageElementHandle ?? useFallbackAIPageElementHandle;
