import { useToaster } from '@nocobase/app-client';
import {
  agentsQueryClient,
  chatKeys,
  useChatAgents,
  useChatApi,
  useAgentText,
} from '@nocobase/app-plugin-agents/client/chat';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';

export default function TeamAgentSettings() {
  const { t } = useTranslation();
  const api = useChatApi();
  const cache = agentsQueryClient();
  const agents = useChatAgents();
  const agentText = useAgentText();
  const toaster = useToaster();
  const settings = useQuery(
    { queryKey: chatKeys.settings, queryFn: () => api.settings() },
    cache,
  );
  const save = useMutation(
    {
      mutationFn: (defaultAgentId: string | null) =>
        api.updateSettings({ defaultAgentId }),
      onSuccess(next) {
        cache.setQueryData(chatKeys.settings, next);
        void cache.invalidateQueries({ queryKey: chatKeys.agents });
        void cache.invalidateQueries({ queryKey: chatKeys.preferences });
      },
      onError() {
        toaster.show({ type: 'error', title: t('onlineAgent.saveFailed') });
      },
    },
    cache,
  );
  const options = [
    { value: '', label: t('onlineAgent.noDefault') },
    ...(agents.data ?? []).map((agent) => ({
      value: agent.id,
      label: agentText.name(agent),
    })),
  ];
  return (
    <PageContainer>
      <PageHeader
        title={t('onlineAgent.teamDefault')}
        description={t('onlineAgent.teamDescription')}
      />
      {settings.isError || agents.isError ? (
        <Button
          onClick={() => {
            void settings.refetch();
            void agents.refetch();
          }}
        >
          {t('onlineAgent.retry')}
        </Button>
      ) : !settings.data || !agents.data ? (
        <Spinner />
      ) : (
        <Select
          items={options}
          value={settings.data.defaultAgentId ?? ''}
          disabled={save.isPending}
          onValueChange={(value) => {
            if (value !== null) save.mutate(value || null);
          }}
        >
          <SelectTrigger aria-label={t('onlineAgent.teamDefault')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </PageContainer>
  );
}
