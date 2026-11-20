import { useToaster } from '@nocobase/app-client';
import {
  agentsQueryClient,
  chatKeys,
  useChatApi,
} from '@nocobase/app-plugin-agents/client/chat';
import { DefaultAgentPreference } from '@nocobase/app-plugin-agents/client/profile';
import {
  RUNNER_PREFERENCES,
  type RunnerPreference,
} from '@nocobase/app-plugin-agents/shared/conversations';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '#components/ui/button';
import { Field, FieldLabel } from '#components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Spinner } from '#components/ui/spinner';

export default function AgentPreferences() {
  const api = useChatApi();
  const cache = agentsQueryClient();
  const { t } = useTranslation();
  const toaster = useToaster();
  const preferences = useQuery(
    { queryKey: chatKeys.preferences, queryFn: () => api.preferences() },
    cache,
  );
  const save = useMutation(
    {
      mutationFn: (runnerPreference: RunnerPreference) =>
        api.updatePreferences({ runnerPreference }),
      onSuccess(next) {
        cache.setQueryData(chatKeys.preferences, next);
      },
      onError() {
        toaster.show({
          type: 'error',
          title: t('onlineAgent.preferenceFailed'),
        });
      },
    },
    cache,
  );
  const options = RUNNER_PREFERENCES.map((value) => ({
    value,
    label: t('onlineAgent.runner.' + value),
  }));
  return (
    <>
      <DefaultAgentPreference />
      <Field>
        <FieldLabel htmlFor='agent-runner-preference'>
          {t('onlineAgent.runner.title')}
        </FieldLabel>
        {preferences.isError ? (
          <Button onClick={() => void preferences.refetch()}>
            {t('onlineAgent.retry')}
          </Button>
        ) : !preferences.data ? (
          <Spinner />
        ) : (
          <Select
            items={options}
            value={preferences.data.runnerPreference}
            disabled={save.isPending}
            onValueChange={(value) => {
              if (value !== null) save.mutate(value);
            }}
          >
            <SelectTrigger id='agent-runner-preference'>
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
      </Field>
    </>
  );
}
