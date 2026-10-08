/**
 * The team's chat settings, at the top of the agents page: the system default chat agent, which new conversations go to
 * when a person has no default of their own (and a conversation may switch to it while its agent is offline), and the
 * online fallback agent, which answers in place of a runner agent that has no runner for the person. Those who manage
 * agents change each with the agent picker as a form field (avatar with availability, the menu grouped by type, "None"
 * first); everyone else reads its name.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import type {
  ChatAgent,
  ChatSettingsPatch,
} from '../../shared/conversations.js';
import { agentsKeys } from '../api/keys.js';
import { AgentPicker } from '../components/agent-picker.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '../components/ui/field.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { useAgentPickerLabels } from '../hooks/use-agent-picker-labels.js';
import { useAgentsApi } from '../hooks/use-agents-api.js';
import { useNotify } from '../hooks/use-notify.js';
import { useAgentText } from '../hooks/use-vocabulary.js';
import { pickerAgentOf } from '../lib/agents.js';
import { chatKeys } from './keys.js';
import { useChatApi } from './use-chat.js';

export function ChatSettingsSection({
  canManage,
}: {
  readonly canManage: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const text = useAgentText();
  const chat = useChatApi();
  const agentsApi = useAgentsApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const settings = useQuery({
    queryKey: chatKeys.settings,
    queryFn: () => chat.settings(),
  });
  const agents = useQuery({
    queryKey: agentsKeys.agents,
    queryFn: () => agentsApi.agents(),
  });
  const save = useMutation({
    mutationFn: (patch: ChatSettingsPatch) => chat.updateSettings(patch),
    onSuccess: (next, patch) => {
      queryClient.setQueryData(chatKeys.settings, next);
      void queryClient.invalidateQueries({ queryKey: chatKeys.agents });
      notify.success(
        t(
          patch.onlineFallbackAgentId !== undefined
            ? 'chat.settings.onlineFallback.saved'
            : 'chat.settings.saved',
        ),
      );
    },
    onError: (error) => notify.error(error),
  });
  const ready = Boolean(settings.data && agents.data);
  const live = (agents.data ?? []).filter((agent) => !agent.archivedAt);
  const defaultAgentId = settings.data?.defaultAgentId ?? null;
  const onlineFallbackAgentId = settings.data?.onlineFallbackAgentId ?? null;

  return (
    <section
      className='rounded-lg border p-4'
      aria-labelledby='ag-chat-default-title'
      data-testid='chat-settings'
    >
      <FieldGroup>
        <SettingField
          id='ag-chat-default'
          title={t('chat.settings.title')}
          description={t('chat.settings.description')}
          // The picker's agents, as the chat lists them.
          options={live.map((agent) =>
            pickerAgentOf(agent, text.name(agent), agent.id === defaultAgentId),
          )}
          current={defaultAgentId}
          ready={ready}
          canManage={canManage}
          saving={save.isPending}
          onChange={(agentId) => save.mutate({ defaultAgentId: agentId })}
          testId='chat-default-agent'
        />
        <SettingField
          id='ag-chat-online-fallback'
          title={t('chat.settings.onlineFallback.title')}
          description={t('chat.settings.onlineFallback.description')}
          options={live
            .filter((agent) => agent.type === 'online')
            .map((agent) =>
              pickerAgentOf(
                agent,
                text.name(agent),
                agent.id === defaultAgentId,
              ),
            )}
          current={onlineFallbackAgentId}
          ready={ready}
          canManage={canManage}
          saving={save.isPending}
          onChange={(agentId) =>
            save.mutate({ onlineFallbackAgentId: agentId })
          }
          testId='chat-online-fallback-agent'
        />
      </FieldGroup>
    </section>
  );
}

/** One agent setting: a picker for those who manage agents, its name for everyone else. */
function SettingField({
  id,
  title,
  description,
  options,
  current,
  ready,
  canManage,
  saving,
  onChange,
  testId,
}: {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly options: ChatAgent[];
  readonly current: string | null;
  readonly ready: boolean;
  readonly canManage: boolean;
  readonly saving: boolean;
  readonly onChange: (agentId: string | null) => void;
  readonly testId: string;
}): ReactElement {
  const { t } = useTranslation();
  const labels = useAgentPickerLabels(title);
  const currentName =
    current === null
      ? t('chat.settings.none')
      : (options.find((option) => option.id === current)?.name ??
        t('chat.settings.unknown'));

  let control: ReactElement;
  if (!ready) control = <Skeleton className='h-8 w-full sm:w-80' />;
  else if (!canManage)
    control = (
      <p className='text-sm font-medium sm:max-w-80 sm:text-right'>
        {currentName}
      </p>
    );
  else
    control = (
      <AgentPicker
        id={id}
        agents={options}
        // None, or an agent the list does not hold, reads as such.
        value={current}
        labels={{ ...labels, unknown: t('chat.settings.unknown') }}
        noneOption={{
          label: t('chat.settings.none'),
          onSelect: () => {
            if (current !== null) onChange(null);
          },
        }}
        onSelect={(agentId) => {
          if (agentId !== current) onChange(agentId);
        }}
        disabled={saving}
        align='end'
        className='sm:w-80'
        data-testid={testId}
      />
    );

  return (
    <Field orientation='responsive'>
      <FieldContent>
        {canManage ? (
          <FieldLabel id={`${id}-title`} htmlFor={id}>
            {title}
          </FieldLabel>
        ) : (
          <FieldTitle id={`${id}-title`}>{title}</FieldTitle>
        )}
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      {control}
    </Field>
  );
}
