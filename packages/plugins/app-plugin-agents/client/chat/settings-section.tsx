/**
 * The system default chat agent, at the top of the agents page: new conversations go to it when a person has no
 * default of their own (and a conversation may switch to it while its agent is offline). Those who manage agents
 * change it with the agent picker as a form field (avatar with availability, the menu grouped by type, "None" first);
 * everyone else reads its name.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import type { ChatAgent } from '../../shared/conversations.js';
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
    mutationFn: (defaultAgentId: string | null) =>
      chat.updateSettings({ defaultAgentId }),
    onSuccess: (next) => {
      queryClient.setQueryData(chatKeys.settings, next);
      void queryClient.invalidateQueries({ queryKey: chatKeys.agents });
      notify.success(t('chat.settings.saved'));
    },
    onError: (error) => notify.error(error),
  });
  const id = 'ag-chat-default';
  const current = settings.data?.defaultAgentId ?? null;
  const labels = useAgentPickerLabels(t('chat.settings.title'));
  // The picker's agents, as the chat lists them.
  const options: ChatAgent[] = (agents.data ?? [])
    .filter((agent) => !agent.archivedAt)
    .map((agent) =>
      pickerAgentOf(agent, text.name(agent), agent.id === current),
    );
  const currentName =
    current === null
      ? t('chat.settings.none')
      : (options.find((option) => option.id === current)?.name ??
        t('chat.settings.unknown'));

  let control: ReactElement;
  if (!settings.data || !agents.data)
    control = <Skeleton className='h-8 w-full sm:w-80' />;
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
            if (current !== null) save.mutate(null);
          },
        }}
        onSelect={(agentId) => {
          if (agentId !== current) save.mutate(agentId);
        }}
        disabled={save.isPending}
        align='end'
        className='sm:w-80'
        data-testid='chat-default-agent'
      />
    );

  return (
    <section
      className='rounded-lg border p-4'
      aria-labelledby={`${id}-title`}
      data-testid='chat-settings'
    >
      <FieldGroup>
        <Field orientation='responsive'>
          <FieldContent>
            {canManage ? (
              <FieldLabel id={`${id}-title`} htmlFor={id}>
                {t('chat.settings.title')}
              </FieldLabel>
            ) : (
              <FieldTitle id={`${id}-title`}>
                {t('chat.settings.title')}
              </FieldTitle>
            )}
            <FieldDescription>
              {t('chat.settings.description')}
            </FieldDescription>
          </FieldContent>
          {control}
        </Field>
      </FieldGroup>
    </section>
  );
}
