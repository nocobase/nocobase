import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { nocobaseAIService, type AIService } from "../services";
import { NocoBaseChatTransport } from "./chat-transport";
import { useAIChatController, type AIChatController } from "./chat-controller";
import {
  AIFormRegistryProvider,
  createFormFillerInvoker,
  useAIFormRegistry,
} from "./form-registry";
import {
  AIFrontendToolRegistryProvider,
  createFrontendToolInvokers,
  useAIFrontendToolRegistry,
} from "./frontend-tool-registry";
import type {
  AIConfigurationStatus,
  AIConversation,
  AIEmployee,
  AIModel,
  AIToolCallInvocationContext,
  AIToolInvokerMap,
  AITransportFactory,
} from "./types";

const UNCONFIGURED_MODEL: AIModel = {
  value: "__unconfigured__",
  label: "No enabled model",
  configured: false,
};

const RESERVED_TOOL_INVOKER_NAMES = [
  "formFiller",
  "loadFrontendTool",
  "executeFrontendTool",
] as const;

type AIProviderValue = {
  configurationStatus: AIConfigurationStatus;
  configurationError?: Error;
  modelConfigurationError?: Error;
  hasEnabledModels: boolean;
  employees: AIEmployee[];
  models: AIModel[];
  globalController: AIChatController;
  createTransport: AITransportFactory;
  uploadFile: AIService["uploadFile"];
  updateEmployeeUserPrompt: (username: string, prompt: string) => Promise<void>;
  listConversations: (keyword?: string) => Promise<AIConversation[]>;
  getConversationMessages: AIService["getConversationMessages"];
  getConversationActiveState: AIService["getConversationActiveState"];
  updateConversationTitle: (sessionId: string, title: string) => Promise<void>;
  destroyConversation: (sessionId: string) => Promise<void>;
  updateToolCallDecision: AIService["updateToolCallDecision"];
  invokeToolCall: (
    toolName: string,
    input: unknown,
    context: AIToolCallInvocationContext
  ) => Promise<{ handled: boolean; result?: unknown }>;
  canAutoApproveToolCall: (
    toolName: string,
    input: unknown,
    context: AIToolCallInvocationContext
  ) => boolean;
};

const AIContext = createContext<AIProviderValue | null>(null);

export type AIProviderProps = PropsWithChildren<{
  employees?: AIEmployee[];
  models?: AIModel[];
  service?: AIService;
  toolInvokers?: AIToolInvokerMap;
  globalController?: AIChatController;
}>;

export function AIProvider(props: AIProviderProps) {
  return (
    <AIFormRegistryProvider>
      <AIFrontendToolRegistryProvider>
        <AIProviderRuntime {...props} />
      </AIFrontendToolRegistryProvider>
    </AIFormRegistryProvider>
  );
}

function AIProviderRuntime({
  children,
  employees: providedEmployees,
  models: providedModels,
  service = nocobaseAIService,
  toolInvokers,
  globalController: providedGlobalController,
}: AIProviderProps) {
  const formRegistry = useAIFormRegistry();
  const frontendToolRegistry = useAIFrontendToolRegistry();
  const resolvedToolInvokers = useMemo<AIToolInvokerMap>(
    () => {
      const reservedToolCollision = RESERVED_TOOL_INVOKER_NAMES.find(
        (name) => toolInvokers?.[name]
      );
      if (reservedToolCollision) {
        throw new Error(
          `Tool invoker "${reservedToolCollision}" is built into AIProvider and cannot be overridden`
        );
      }
      return {
        ...toolInvokers,
        ...createFrontendToolInvokers(frontendToolRegistry),
        formFiller: createFormFillerInvoker(formRegistry),
      };
    },
    [formRegistry, frontendToolRegistry, toolInvokers]
  );
  const [liveConfiguration, setLiveConfiguration] = useState<{
    employees: AIEmployee[];
    models: AIModel[];
    status: AIConfigurationStatus;
    error?: Error;
    modelError?: Error;
  }>({ employees: [], models: [], status: "loading" });
  const internalGlobalController = useAIChatController();
  const globalController = providedGlobalController ?? internalGlobalController;

  useEffect(() => {
    if (providedEmployees && providedModels) {
      setLiveConfiguration({
        employees: providedEmployees,
        models: providedModels.length ? providedModels : [UNCONFIGURED_MODEL],
        status: "ready",
        modelError: providedModels.length
          ? undefined
          : new Error("No enabled AI models were provided."),
      });
      return;
    }

    let active = true;
    setLiveConfiguration((current) => ({
      ...current,
      status: "loading",
      error: undefined,
    }));

    void Promise.allSettled([
      providedEmployees ?? service.listEmployees(),
      providedModels ?? service.listModels(),
    ]).then(([employeesResult, modelsResult]) => {
      if (!active) return;
      if (employeesResult.status === "rejected") {
        setLiveConfiguration({
          employees: [],
          models: [],
          status: "error",
          error:
            employeesResult.reason instanceof Error
              ? employeesResult.reason
              : new Error("Unable to load NocoBase AI configuration."),
        });
        return;
      }

      const employees = employeesResult.value;
      if (!employees.length) {
        setLiveConfiguration({
          employees: [],
          models: [],
          status: "error",
          error: new Error(
            "No AI employees are available for the current NocoBase user."
          ),
        });
        return;
      }

      const models =
        modelsResult.status === "fulfilled" ? modelsResult.value : [];
      const modelError =
        modelsResult.status === "rejected"
          ? modelsResult.reason instanceof Error
            ? modelsResult.reason
            : new Error("Unable to load enabled AI models from NocoBase.")
          : models.length
          ? undefined
          : new Error("No enabled AI models were returned by NocoBase.");
      setLiveConfiguration({
        employees,
        models: models.length ? models : [UNCONFIGURED_MODEL],
        status: "ready",
        modelError,
      });
    });

    return () => {
      active = false;
    };
  }, [providedEmployees, providedModels, service]);

  const employees = liveConfiguration.employees;
  const models = liveConfiguration.models;
  const configurationStatus = liveConfiguration.status;
  const configurationError = liveConfiguration.error;
  const modelConfigurationError = liveConfiguration.modelError;
  const hasEnabledModels = models.some((model) => model.configured !== false);

  const updateEmployeeUserPrompt = useCallback(
    async (username: string, prompt: string) => {
      await service.updateEmployeeUserPrompt(username, prompt);
      setLiveConfiguration((current) => ({
        ...current,
        employees: current.employees.map((employee) =>
          employee.username === username
            ? {
                ...employee,
                userConfig: { ...employee.userConfig, prompt },
              }
            : employee
        ),
      }));
    },
    [service]
  );

  const invokeToolCall = useCallback(
    async (
      toolName: string,
      input: unknown,
      context: AIToolCallInvocationContext
    ) => {
      const invoke = resolvedToolInvokers[toolName];
      if (!invoke) return { handled: false };
      return { handled: true, result: await invoke(input, context) };
    },
    [resolvedToolInvokers]
  );

  const canAutoApproveToolCall = useCallback(
    (
      toolName: string,
      input: unknown,
      context: AIToolCallInvocationContext
    ) => {
      if (toolName === "formFiller") return false;
      if (
        toolName !== "loadFrontendTool" &&
        toolName !== "executeFrontendTool"
      ) {
        return true;
      }
      const toolId =
        input && typeof input === "object" && !Array.isArray(input)
          ? (input as { toolId?: unknown }).toolId
          : undefined;
      if (
        typeof toolId !== "string" ||
        context.allowedFrontendToolIds?.includes(toolId) !== true
      ) {
        return false;
      }
      const manifest = frontendToolRegistry.getManifest(toolId);
      if (!manifest) return false;
      return toolName === "loadFrontendTool" || manifest.permission === "ALLOW";
    },
    [frontendToolRegistry]
  );

  const value = useMemo<AIProviderValue>(
    () => ({
      configurationStatus,
      configurationError,
      modelConfigurationError,
      hasEnabledModels,
      employees,
      models,
      globalController,
      uploadFile: service.uploadFile.bind(service),
      updateEmployeeUserPrompt,
      listConversations: service.listConversations.bind(service),
      getConversationMessages: service.getConversationMessages.bind(service),
      getConversationActiveState:
        service.getConversationActiveState.bind(service),
      updateConversationTitle: service.updateConversationTitle.bind(service),
      destroyConversation: service.destroyConversation.bind(service),
      updateToolCallDecision: service.updateToolCallDecision.bind(service),
      invokeToolCall,
      canAutoApproveToolCall,
      createTransport: (options) =>
        new NocoBaseChatTransport({ service, ...options }),
    }),
    [
      configurationError,
      canAutoApproveToolCall,
      configurationStatus,
      employees,
      globalController,
      hasEnabledModels,
      invokeToolCall,
      modelConfigurationError,
      models,
      service,
      updateEmployeeUserPrompt,
    ]
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI() {
  const value = useContext(AIContext);
  if (!value) throw new Error("useAI must be used inside AIProvider");
  return value;
}

export function useGlobalAIChatController() {
  return useAI().globalController;
}
