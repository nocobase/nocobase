/**
 * The team's default Agent, at the top of the Agent page: where a new conversation goes when its person chose no
 * default of their own. Only an enabled agent every member may chat with can be it. Readers see it; managers of agents
 * change it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import type { AgentView } from '../../../shared/agents.js';
import { chatKeys } from '../../chat/keys.js';
import { useChatApi } from '../../chat/use-chat.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.js';
import {
  Field,
  FieldDescription,
  FieldLabel,
} from '../../components/ui/field.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import { useSetting } from '../../hooks/use-access.js';
import { useNotify } from '../../hooks/use-notify.js';

const NONE = '__none__';

export function TeamDefaultAgent({
  agents,
}: {
  readonly agents: readonly AgentView[] | undefined;
}): ReactElement {
  const { t } = useTranslation();
  const api = useChatApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const canManage = useSetting('agents.agents', 'manage');
  const settings = useQuery({
    queryKey: chatKeys.settings,
    queryFn: () => api.settings(),
  });
  const save = useMutation({
    mutationFn: (defaultAgentId: string | null) =>
      api.updateSettings({ defaultAgentId }),
    onSuccess: (next) => {
      queryClient.setQueryData(chatKeys.settings, next);
      void queryClient.invalidateQueries({ queryKey: chatKeys.agents });
      notify.success(t('agents.teamDefault.saved'));
    },
    onError: (error) => notify.error(error),
  });
  if (!settings.data || !agents) return <Skeleton className='h-16' />;
  // Everyone's default: enabled, and open to every member.
  const eligible = agents.filter(
    (agent) => agent.status === 'enabled' && !agent.chatRoles?.length,
  );
  const current = settings.data.defaultAgentId ?? NONE;
  const items = [
    { value: NONE, label: t('agents.teamDefault.none') },
    ...eligible.map((agent) => ({ value: agent.id, label: agent.name })),
  ];
  return (
    <Field className='rounded-lg border p-4' data-testid='agents-team-default'>
      <FieldLabel htmlFor='agents-team-default'>
        {t('agents.teamDefault.label')}
      </FieldLabel>
      <Select
        items={items}
        value={current}
        disabled={!canManage || save.isPending}
        onValueChange={(next: string | null) => {
          const id = !next || next === NONE ? null : next;
          if (id !== settings.data?.defaultAgentId) save.mutate(id);
        }}
      >
        <SelectTrigger id='agents-team-default' className='w-full sm:w-80'>
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
      <FieldDescription>{t('agents.teamDefault.hint')}</FieldDescription>
    </Field>
  );
}
