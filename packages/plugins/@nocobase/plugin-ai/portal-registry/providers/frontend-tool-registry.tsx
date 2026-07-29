import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import type { AIToolCallInvocationContext, AIToolInvokerMap } from "./types";

export type AIFrontendToolPermission = "ASK" | "ALLOW";

export type AIFrontendToolRegistration<
  TArgs = unknown,
  TResult = unknown,
> = {
  name: string;
  title?: string;
  description: string;
  permission?: AIFrontendToolPermission;
  inputSchema?: Record<string, unknown>;
  execute: (args: TArgs) => TResult | Promise<TResult>;
};

export type AIFrontendToolManifest = {
  id: string;
  blockUid: string;
  name: string;
  title?: string;
  description: string;
  permission: AIFrontendToolPermission;
  inputSchema: Record<string, unknown>;
};

type AIFrontendToolEntry = {
  token: symbol;
  manifest: AIFrontendToolManifest;
  execute: (args: unknown) => unknown | Promise<unknown>;
};

const TOOL_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

const cloneManifest = (
  manifest: AIFrontendToolManifest
): AIFrontendToolManifest => structuredClone(manifest);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

export function defineAIFrontendTool<TArgs, TResult>(
  registration: AIFrontendToolRegistration<TArgs, TResult>
) {
  return registration;
}

export class AIFrontendToolRegistry {
  private readonly tools = new Map<string, AIFrontendToolEntry>();

  register(contextId: string, registration: AIFrontendToolRegistration) {
    if (!contextId.trim()) {
      throw new Error("Frontend Tool context id is required");
    }
    if (!TOOL_NAME_PATTERN.test(registration.name)) {
      throw new Error(
        "Frontend Tool name must start with a letter and contain only letters, numbers, underscores, or hyphens"
      );
    }
    if (!registration.description.trim()) {
      throw new Error("Frontend Tool description is required");
    }
    if (typeof registration.execute !== "function") {
      throw new Error("Frontend Tool execute must be a function");
    }
    if (
      registration.inputSchema !== undefined &&
      !isRecord(registration.inputSchema)
    ) {
      throw new Error("Frontend Tool inputSchema must be an object");
    }
    if (
      registration.permission !== undefined &&
      registration.permission !== "ASK" &&
      registration.permission !== "ALLOW"
    ) {
      throw new Error("Frontend Tool permission must be ASK or ALLOW");
    }

    const id = `${contextId}:${registration.name}`;
    if (this.tools.has(id)) {
      throw new Error(
        `Frontend Tool "${registration.name}" is already registered for context "${contextId}"`
      );
    }
    const token = Symbol(id);
    let inputSchema: Record<string, unknown>;
    try {
      inputSchema = structuredClone(
        registration.inputSchema ?? { type: "object", properties: {} }
      );
    } catch {
      throw new Error("Frontend Tool inputSchema must be serializable");
    }
    const manifest: AIFrontendToolManifest = {
      id,
      blockUid: contextId,
      name: registration.name,
      title: registration.title,
      description: registration.description,
      permission: registration.permission ?? "ASK",
      inputSchema,
    };
    this.tools.set(id, {
      token,
      manifest,
      execute: registration.execute as (
        args: unknown
      ) => unknown | Promise<unknown>,
    });
    return () => {
      if (this.tools.get(id)?.token === token) this.tools.delete(id);
    };
  }

  list(contextId: string) {
    return [...this.tools.values()]
      .filter((entry) => entry.manifest.blockUid === contextId)
      .map((entry) => cloneManifest(entry.manifest));
  }

  getManifest(toolId: string) {
    const manifest = this.tools.get(toolId)?.manifest;
    return manifest ? cloneManifest(manifest) : undefined;
  }

  async execute(toolId: string, args: unknown) {
    const entry = this.tools.get(toolId);
    if (!entry) throw new Error(`Frontend Tool "${toolId}" is unavailable`);
    const result = await entry.execute(args);
    try {
      structuredClone(result);
      JSON.stringify(result);
    } catch {
      throw new Error(
        `Frontend Tool "${toolId}" returned a non-serializable result`
      );
    }
    return result;
  }
}

const AIFrontendToolRegistryContext =
  createContext<AIFrontendToolRegistry | null>(null);

export function AIFrontendToolRegistryProvider({
  children,
}: PropsWithChildren) {
  const registry = useMemo(() => new AIFrontendToolRegistry(), []);
  return (
    <AIFrontendToolRegistryContext.Provider value={registry}>
      {children}
    </AIFrontendToolRegistryContext.Provider>
  );
}

export function useAIFrontendToolRegistry() {
  const registry = useContext(AIFrontendToolRegistryContext);
  if (!registry) {
    throw new Error(
      "useAIFrontendToolRegistry must be used inside AIFrontendToolRegistryProvider"
    );
  }
  return registry;
}

export function useOptionalAIFrontendToolRegistry() {
  return useContext(AIFrontendToolRegistryContext);
}

const errorResult = (error: unknown) => ({
  status: "error" as const,
  content: error instanceof Error ? error.message : String(error),
});

const getToolId = (input: unknown) =>
  input && typeof input === "object" && !Array.isArray(input)
    ? (input as { toolId?: unknown }).toolId
    : undefined;

const isToolAllowed = (
  toolId: string,
  context: AIToolCallInvocationContext
) => context.allowedFrontendToolIds?.includes(toolId) === true;

export function createFrontendToolInvokers(
  registry: AIFrontendToolRegistry
): AIToolInvokerMap {
  return {
    loadFrontendTool: async (input, context) => {
      const toolId = getToolId(input);
      if (typeof toolId !== "string" || !toolId) {
        return errorResult("Frontend Tool id is required");
      }
      if (!isToolAllowed(toolId, context)) {
        return errorResult(
          `Frontend Tool "${toolId}" is not available in this conversation context`
        );
      }
      return (
        registry.getManifest(toolId) ??
        errorResult(`Frontend Tool "${toolId}" is unavailable`)
      );
    },
    executeFrontendTool: async (input, context) => {
      const params =
        input && typeof input === "object" && !Array.isArray(input)
          ? (input as { toolId?: unknown; args?: unknown })
          : {};
      if (typeof params.toolId !== "string" || !params.toolId) {
        return errorResult("Frontend Tool id is required");
      }
      if (!isToolAllowed(params.toolId, context)) {
        return errorResult(
          `Frontend Tool "${params.toolId}" is not available in this conversation context`
        );
      }
      try {
        return await registry.execute(params.toolId, params.args ?? {});
      } catch (error) {
        return errorResult(error);
      }
    },
  };
}
