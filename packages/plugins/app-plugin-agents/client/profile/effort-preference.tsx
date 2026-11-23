/**
 * "My reasoning effort", for the person's preferences: how hard the agent thinks in the conversations they start when
 * they choose nothing in the conversation (`ChatPreferences.effort`), or each agent's default. The server applies it
 * where the agent's coding tool offers it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { PREFERRED_EFFORTS } from '../../shared/agents.js';
import type { ChatPreferences } from '../../shared/conversations.js';
import { chatKeys } from '../chat/keys.js';
import { useChatApi } from '../chat/use-chat.js';
import { AgLoadError } from '../components/ag-states.js';
import { Field, FieldLabel } from '../components/ui/field.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { useNotify } from '../hooks/use-notify.js';

const DEFAULT = '__default__';

export function EffortPreference(): ReactElement {
  const { t } = useTranslation();
  const api = useChatApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const preferences = useQuery({
    queryKey: chatKeys.preferences,
    queryFn: () => api.preferences(),
    retry: false,
  });
  const save = useMutation({
    mutationFn: (effort: string | null) => api.updatePreferences({ effort }),
    onSuccess: (next: ChatPreferences) => {
      queryClient.setQueryData(chatKeys.preferences, next);
      notify.success(t('me.effort.saved'));
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.preferences });
      notify.error(error);
    },
  });
  if (preferences.isError)
    return (
      <AgLoadError
        title={t('chatProfile.loadFailed')}
        error={preferences.error}
        onRetry={() => void preferences.refetch()}
      />
    );
  if (!preferences.data)
    return (
      <Skeleton
        className='h-9 sm:w-64'
        role='status'
        aria-label={t('common.loading')}
      />
    );
  const current = preferences.data.effort ?? DEFAULT;
  const items = [
    { value: DEFAULT, label: t('me.effort.default') },
    ...PREFERRED_EFFORTS.map((value) => ({
      value,
      label: t(`agents.effort.${value}`, { defaultValue: value }),
    })),
  ];
  return (
    <Field data-testid='profile-effort'>
      <FieldLabel htmlFor='ag-profile-effort'>
        {t('me.effort.label')}
      </FieldLabel>
      <Select
        items={items}
        value={current}
        disabled={save.isPending}
        onValueChange={(next: string | null) => {
          const effort = !next || next === DEFAULT ? null : next;
          if (effort !== (preferences.data.effort ?? null)) save.mutate(effort);
        }}
      >
        <SelectTrigger
          id='ag-profile-effort'
          className='w-full sm:w-64'
          data-testid='profile-effort-select'
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
