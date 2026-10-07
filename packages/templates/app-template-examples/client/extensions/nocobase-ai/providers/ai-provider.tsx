import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import type { AIService } from '../services/index.js';
import { AIContext, type AIProviderValue } from './ai-context.js';
import { NocoBaseChatTransport } from './chat-transport.js';
import {
  useAIChatController,
  type AIChatController,
} from './chat-controller.js';
import { createFormFillerInvoker, useAIFormRegistry } from './form-registry.js';
import { AIFormRegistryProvider } from './form-registry-provider.js';
import {
  createFrontendToolInvokers,
  useAIFrontendToolRegistry,
} from './frontend-tool-registry.js';
import { AIFrontendToolRegistryProvider } from './frontend-tool-registry-provider.js';
import type {
  AIConfigurationStatus,
  AIEmployee,
  AIModel,
  AIToolCallInvocationContext,
  AIToolInvokerMap,
} from './types.js';

type AIRuntimeConfiguration = {
  employees: AIEmployee[];
  models: AIModel[];
  status: AIConfigurationStatus;
  error?: Error;
  modelError?: Error;
};

const UNCONFIGURED_MODEL: AIModel = {
  value: '__unconfigured__',
  label: 'No enabled model',
  configured: false,
};

const RESERVED_TOOL_INVOKER_NAMES = [
  'formFiller',
  'loadFrontendTool',
  'executeFrontendTool',
] as const;

export type AIProviderProps = PropsWithChildren<{
  employees?: AIEmployee[];
  models?: AIModel[];
  service: AIService;
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
  service,
  toolInvokers,
  globalController: providedGlobalController,
}: AIProviderProps) {
  const formRegistry = useAIFormRegistry();
  const frontendToolRegistry = useAIFrontendToolRegistry();
  const resolvedToolInvokers = useMemo<AIToolInvokerMap>(() => {
    const reservedToolCollision = RESERVED_TOOL_INVOKER_NAMES.find(
      (name) => toolInvokers?.[name],
    );
    if (reservedToolCollision) {
      throw new Error(
        `Tool invoker "${reservedToolCollision}" is built into AIProvider and cannot be overridden`,
      );
    }
    return {
      ...toolInvokers,
      ...createFrontendToolInvokers(frontendToolRegistry),
      formFiller: createFormFillerInvoker(formRegistry),
    };
  }, [formRegistry, frontendToolRegistry, toolInvokers]);
  // A caller that supplies both lists owns the configuration, so it is read
  // during render rather than copied into state by an effect.
  const providedConfiguration = useMemo<AIRuntimeConfiguration | undefined>(
    () =>
      providedEmployees && providedModels
        ? {
            employees: providedEmployees,
            models: providedModels.length
              ? providedModels
              : [UNCONFIGURED_MODEL],
            status: 'ready',
            modelError: providedModels.length
              ? undefined
              : new Error('No enabled AI models were provided.'),
          }
        : undefined,
    [providedEmployees, providedModels],
  );
  const [liveConfiguration, setLiveConfiguration] =
    useState<AIRuntimeConfiguration>({
      employees: [],
      models: [],
      status: 'loading',
    });
  const configuration = providedConfiguration ?? liveConfiguration;
  // A saved prompt applies on top of whichever configuration is in effect,
  // including one the caller supplied.
  const [savedPrompts, setSavedPrompts] = useState<Record<string, string>>({});
  const internalGlobalController = useAIChatController();
  const globalController = providedGlobalController ?? internalGlobalController;

  useEffect(() => {
    if (providedEmployees && providedModels) return;

    let active = true;

    void Promise.allSettled([
      providedEmployees ?? service.listEmployees(),
      providedModels ?? service.listModels(),
    ]).then(([employeesResult, modelsResult]) => {
      if (!active) return;
      if (employeesResult.status === 'rejected') {
        setLiveConfiguration({
          employees: [],
          models: [],
          status: 'error',
          error:
            employeesResult.reason instanceof Error
              ? employeesResult.reason
              : new Error('Unable to load NocoBase AI configuration.'),
        });
        return;
      }

      const employees = employeesResult.value;
      if (!employees.length) {
        setLiveConfiguration({
          employees: [],
          models: [],
          status: 'error',
          error: new Error(
            'No AI employees are available for the current NocoBase user.',
          ),
        });
        return;
      }

      const models =
        modelsResult.status === 'fulfilled' ? modelsResult.value : [];
      const modelError =
        modelsResult.status === 'rejected'
          ? modelsResult.reason instanceof Error
            ? modelsResult.reason
            : new Error('Unable to load enabled AI models from NocoBase.')
          : models.length
            ? undefined
            : new Error('No enabled AI models were returned by NocoBase.');
      setLiveConfiguration({
        employees,
        models: models.length ? models : [UNCONFIGURED_MODEL],
        status: 'ready',
        modelError,
      });
    });

    return () => {
      active = false;
    };
  }, [providedEmployees, providedModels, service]);

  const employees = useMemo(
    () =>
      configuration.employees.map((employee) => {
        const prompt = savedPrompts[employee.username];
        return prompt === undefined
          ? employee
          : { ...employee, userConfig: { ...employee.userConfig, prompt } };
      }),
    [configuration.employees, savedPrompts],
  );
  const models = configuration.models;
  const configurationStatus = configuration.status;
  const configurationError = configuration.error;
  const modelConfigurationError = configuration.modelError;
  const hasEnabledModels = models.some((model) => model.configured !== false);

  const updateEmployeeUserPrompt = useCallback(
    async (username: string, prompt: string) => {
      await service.updateEmployeeUserPrompt(username, prompt);
      setSavedPrompts((current) => ({ ...current, [username]: prompt }));
    },
    [service],
  );

  const invokeToolCall = useCallback(
    async (
      toolName: string,
      input: unknown,
      context: AIToolCallInvocationContext,
    ) => {
      const invoke = resolvedToolInvokers[toolName];
      if (!invoke) return { handled: false };
      return { handled: true, result: await invoke(input, context) };
    },
    [resolvedToolInvokers],
  );

  const canAutoApproveToolCall = useCallback(
    (
      toolName: string,
      input: unknown,
      context: AIToolCallInvocationContext,
    ) => {
      if (toolName === 'formFiller') return false;
      if (
        toolName !== 'loadFrontendTool' &&
        toolName !== 'executeFrontendTool'
      ) {
        return true;
      }
      const toolId =
        input && typeof input === 'object' && !Array.isArray(input)
          ? (input as { toolId?: unknown }).toolId
          : undefined;
      if (
        typeof toolId !== 'string' ||
        context.allowedFrontendToolIds?.includes(toolId) !== true
      ) {
        return false;
      }
      const manifest = frontendToolRegistry.getManifest(toolId);
      if (!manifest) return false;
      return toolName === 'loadFrontendTool' || manifest.permission === 'ALLOW';
    },
    [frontendToolRegistry],
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
    ],
  );

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}
