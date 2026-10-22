/** Shared ACP process and session operations; no bridge polling, credentials or personal-session state. */
import * as acp from '@agentclientprotocol/sdk';
import { z } from 'zod';
import { AgentProcess, isAuthRequired } from './agent-process.js';
import type { AgentSpec } from './catalog.js';
import type { SessionChoice } from './protocol.js';

export { AgentProcess, errorMessage, isAuthRequired } from './agent-process.js';
export type {
  AgentClientHandlers,
  AgentProcessOptions,
} from './agent-process.js';
export { resolveAgent, findProgram } from './agents.js';
export type { ResolvedAgent } from './agents.js';
export { methods, RequestError } from '@agentclientprotocol/sdk';
export type {
  SessionNotification,
  RequestPermissionRequest,
  RequestPermissionResponse,
} from '@agentclientprotocol/sdk';

interface LegacyModels {
  currentModelId?: string;
  availableModels: { modelId: string; name?: string }[];
}
const legacyModels: z.ZodType<LegacyModels> = z.object({
  currentModelId: z.string().optional(),
  availableModels: z
    .array(
      z.object({
        modelId: z.string().min(1).max(256),
        name: z.string().max(256).optional(),
      }),
    )
    .max(256),
});
export type OpenedSession = Pick<
  acp.NewSessionResponse,
  'configOptions' | 'modes'
> & { models?: LegacyModels };

/** The SDK keeps extension response fields; validate the older models interface at this boundary. */
export function sessionModels(
  opened: OpenedSession,
): { id: string; name?: string }[] | undefined {
  const option = opened.configOptions?.find(
    (item) => item.type === 'select' && item.category === 'model',
  );
  if (option?.type === 'select')
    return option.options
      .flatMap((item) => ('group' in item ? item.options : [item]))
      .map((item) => ({ id: item.value, name: item.name }));
  const legacy = legacyModels.safeParse(opened.models);
  return legacy.success
    ? legacy.data.availableModels.map((item) => ({
        id: item.modelId,
        ...(item.name ? { name: item.name } : {}),
      }))
    : undefined;
}

export function sessionChoices(
  configOptions: readonly acp.SessionConfigOption[] | null | undefined,
  modes: acp.SessionModeState | null | undefined,
): SessionChoice[] {
  const choices: SessionChoice[] = (configOptions ?? []).flatMap((option) =>
    option.type === 'select'
      ? [
          {
            id: option.id,
            name: option.name,
            ...(option.category ? { category: option.category } : {}),
            currentValue: option.currentValue,
            options: option.options
              .flatMap((entry) => ('group' in entry ? entry.options : [entry]))
              .map((entry) => ({
                value: entry.value,
                name: entry.name,
                ...(entry.description
                  ? { description: entry.description }
                  : {}),
              })),
          },
        ]
      : [],
  );
  return choices.length || !modes
    ? choices
    : [
        {
          id: 'mode',
          name: 'Mode',
          category: 'mode',
          currentValue: modes.currentModeId,
          options: modes.availableModes.map((mode) => ({
            value: mode.id,
            name: mode.name,
            ...(mode.description ? { description: mode.description } : {}),
          })),
        },
      ];
}

/** Only an explicit missing session permits recovery. Authentication and transport errors must reach the caller. */
export function isSessionMissing(error: unknown): boolean {
  return error instanceof acp.RequestError && error.code === -32002;
}

export async function continueSession(
  process: AgentProcess,
  sessionId: string,
  cwd: string,
  replay: (active: boolean) => void,
): Promise<OpenedSession | undefined> {
  const capabilities = process.initialize.agentCapabilities;
  try {
    if (capabilities?.sessionCapabilities?.resume)
      return await process.agent.request(acp.methods.agent.session.resume, {
        sessionId,
        cwd,
        mcpServers: [],
      });
    if (capabilities?.loadSession) {
      replay(true);
      return (
        (await process.agent.request(acp.methods.agent.session.load, {
          sessionId,
          cwd,
          mcpServers: [],
        })) ?? {}
      );
    }
  } catch (error) {
    if (!isSessionMissing(error)) throw error;
  } finally {
    replay(false);
  }
  return undefined;
}

export class ModelSelectionError extends Error {}

/** Explicit models are applied or refused before the prompt; an absent model leaves the agent's default alone. */
export async function configureSession(
  process: AgentProcess,
  sessionId: string,
  opened: OpenedSession,
  spec: AgentSpec,
  model?: string,
): Promise<void> {
  let state = opened;
  // Apply access mode first: an agent may change its offered models when the mode changes.
  const mode = sessionChoices(state.configOptions, state.modes).find(
    (item) => item.category === 'mode',
  );
  const wanted = spec.modes?.find((value) =>
    mode?.options.some((item) => item.value === value),
  );
  if (mode && wanted && mode.currentValue !== wanted) {
    if (state.configOptions?.length) {
      const response = await process.agent.request(
        acp.methods.agent.session.setConfigOption,
        { sessionId, configId: mode.id, value: wanted },
      );
      state = { ...state, configOptions: response.configOptions };
    } else
      await process.agent.request(acp.methods.agent.session.setMode, {
        sessionId,
        modeId: wanted,
      });
  }
  if (!model) return;
  const option = state.configOptions?.find(
    (item) => item.type === 'select' && item.category === 'model',
  );
  if (!sessionModels(state)?.some((item) => item.id === model))
    throw new ModelSelectionError(
      'The agent does not offer the requested model.',
    );
  try {
    if (option?.type === 'select') {
      if (option.currentValue !== model) {
        const response = await process.agent.request(
          acp.methods.agent.session.setConfigOption,
          { sessionId, configId: option.id, value: model },
        );
        if (
          !response.configOptions?.some(
            (item) => item.id === option.id && item.currentValue === model,
          )
        )
          throw new ModelSelectionError(
            'The agent did not apply the requested model.',
          );
      }
    } else if (state.models?.currentModelId !== model) {
      await process.agent.request('session/set_model', {
        sessionId,
        modelId: model,
      });
    }
  } catch (error) {
    if (isAuthRequired(error)) throw error;
    throw new ModelSelectionError(
      'The agent could not apply the requested model.',
      { cause: error },
    );
  }
}
