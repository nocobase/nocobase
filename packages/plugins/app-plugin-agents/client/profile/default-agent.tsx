/**
 * "My default chat agent", for the person's preferences: which agent their new conversations go to (any agent they may
 * chat with, or the system default), chosen with the agent picker as a form field. The application places the field
 * (for example, its Preferences page); copying an agent for oneself is on the agent's own page.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import type {
  ChatAgent,
  ChatPreferences,
  ChatPreferencesPatch,
} from '../../shared/conversations.js';
import { AvailabilityDot } from '../components/availability-dot.js';
import { chatKeys } from '../chat/keys.js';
import { useChatAgents, useChatApi } from '../chat/use-chat.js';
import { AgLoadError } from '../components/ag-states.js';
import { AgTag } from '../components/ag-tag.js';
import { AgentPicker } from '../components/agent-picker.js';
import { AgentTypeTag } from '../components/agent-type.js';
import { Field, FieldDescription, FieldLabel } from '../components/ui/field.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { useAgentPickerLabels } from '../hooks/use-agent-picker-labels.js';
import { useNotify } from '../hooks/use-notify.js';
import { useAgentText } from '../hooks/use-vocabulary.js';

export function DefaultAgentPreference(): ReactElement {
  const { t } = useTranslation();
  const api = useChatApi();
  const preferences = useQuery({
    queryKey: chatKeys.preferences,
    queryFn: () => api.preferences(),
    retry: false,
  });
  const agents = useChatAgents();
  if (preferences.isError || agents.isError)
    return (
      <AgLoadError
        title={t('chatProfile.loadFailed')}
        error={preferences.error ?? agents.error}
        onRetry={() => {
          void preferences.refetch();
          void agents.refetch();
        }}
      />
    );
  if (!preferences.data || !agents.data)
    return (
      <Skeleton
        className='h-16'
        role='status'
        aria-label={t('common.loading')}
      />
    );
  return (
    <DefaultAgentField preferences={preferences.data} agents={agents.data} />
  );
}

function DefaultAgentField({
  preferences,
  agents,
}: {
  readonly preferences: ChatPreferences;
  readonly agents: readonly ChatAgent[];
}): ReactElement {
  const { t } = useTranslation();
  const text = useAgentText();
  const api = useChatApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const save = useMutation({
    mutationFn: (patch: ChatPreferencesPatch) => api.updatePreferences(patch),
    onSuccess: (next) => {
      queryClient.setQueryData(chatKeys.preferences, next);
      void queryClient.invalidateQueries({ queryKey: chatKeys.agents });
      notify.success(t('chatProfile.saved'));
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.preferences });
      notify.error(error);
    },
  });
  const labels = useAgentPickerLabels(t('chatProfile.defaultAgent'));
  const system = agents.find((agent) => agent.isSystemDefault) ?? null;
  const systemLabel = system
    ? t('chatProfile.systemDefaultNamed', { name: text.name(system) })
    : t('chatProfile.systemDefault');
  // An agent the list no longer holds reads as the system default, which is what the person gets.
  const current =
    preferences.defaultAgentId &&
    agents.some((agent) => agent.id === preferences.defaultAgentId)
      ? preferences.defaultAgentId
      : null;
  const chosen = agents.find((agent) => agent.id === current) ?? system;

  return (
    <Field data-testid='profile-agent'>
      <FieldLabel htmlFor='ag-profile-default-agent'>
        {t('chatProfile.defaultAgent')}
      </FieldLabel>
      <AgentPicker
        id='ag-profile-default-agent'
        agents={agents}
        value={current}
        // The system default: no agent of the person's own.
        {...(current === null
          ? {
              shown: {
                name: null,
                availability: system?.availability ?? null,
                mode: system?.type ?? null,
              },
            }
          : {})}
        agentName={(agent) => text.name(agent)}
        labels={{ ...labels, none: systemLabel }}
        noneOption={{
          label: systemLabel,
          onSelect: () => {
            if (preferences.defaultAgentId !== null)
              save.mutate({ defaultAgentId: null });
          },
        }}
        onSelect={(agentId) => {
          if (agentId !== preferences.defaultAgentId)
            save.mutate({ defaultAgentId: agentId });
        }}
        disabled={save.isPending}
        className='sm:w-64'
        data-testid='profile-default-agent'
      />
      <FieldDescription className='flex flex-wrap items-center gap-1.5'>
        {chosen ? (
          <>
            <AvailabilityDot availability={chosen.availability} />
            {chosen.availability.online
              ? t('chat.availability.online')
              : t(
                  `chat.availability.${chosen.availability.reason ?? 'noRunner'}`,
                )}
            <AgentTypeTag type={chosen.type} />
            {chosen.personal ? (
              <AgTag tone='violet'>{t('chat.agents.personal')}</AgTag>
            ) : null}
          </>
        ) : (
          t('chatProfile.noDefault')
        )}
      </FieldDescription>
    </Field>
  );
}
