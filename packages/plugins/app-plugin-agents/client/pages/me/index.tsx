/**
 * Personal settings › Preferences › Agent (`/me/agent`, route `agentPreferences`): what one signed-in person sets for
 * themselves — the agent their new conversations go to (among those they may chat with), the runtimes they added, and
 * what their own runs used — followed by the sections other plugins register (`agents.preferenceSections.add`), such as
 * a computer the person connected. It needs only a signed-in person.
 */
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';

import { agentsKeys } from '../../api/keys.js';
import { AgLoadError } from '../../components/ag-states.js';
import { AvailabilityDot } from '../../components/availability-dot.js';
import { PageContainer } from '../../components/page-container.js';
import { PageHeader } from '../../components/page-header.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.js';
import { Skeleton } from '../../components/ui/skeleton.js';
import { useAgentsApi } from '../../hooks/use-agents-api.js';
import { DefaultAgentPreference } from '../../profile/default-agent.js';
import { usePreferenceSections } from '../../ui-registry.js';
import { formatCost, formatTokens } from '../usage/model.js';

function Section({
  title,
  description,
  children,
  testId,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
  readonly testId: string;
}): ReactElement {
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** The runtimes the person added, which only their own work runs on. */
function MyRuntimes({ userId }: { readonly userId: string }): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const runners = useQuery({
    queryKey: agentsKeys.runners,
    queryFn: () => api.runners(),
  });
  if (runners.isError)
    return (
      <AgLoadError
        title={t('me.runtimes.loadFailed')}
        error={runners.error}
        onRetry={() => void runners.refetch()}
      />
    );
  if (!runners.data) return <Skeleton className='h-12' />;
  const mine = runners.data.filter(
    (runner) => runner.ownerUserId === userId && runner.trust !== 'team',
  );
  if (!mine.length)
    return (
      <p className='text-sm text-muted-foreground'>{t('me.runtimes.none')}</p>
    );
  return (
    <ul className='divide-y rounded-md border'>
      {mine.map((runner) => (
        <li
          key={runner.id}
          className='flex items-center gap-3 px-3 py-2 text-sm'
          data-testid='me-runtime'
        >
          <AvailabilityDot
            availability={{
              online: runner.status === 'online',
              reason: runner.status === 'online' ? null : 'noRunner',
              onlineRunners: runner.status === 'online' ? 1 : 0,
            }}
          />
          <span className='min-w-0 flex-1 truncate font-medium'>
            {runner.name}
          </span>
          <span className='text-muted-foreground'>
            {t(`me.runtimes.status.${runner.status}`, {
              defaultValue: runner.status,
            })}
          </span>
          {runner.version ? (
            <span className='text-muted-foreground tabular-nums'>
              {runner.version}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** What the person's own runs used over the last 30 days. */
function MyUsage({ userId }: { readonly userId: string }): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const { locale } = useLocale();
  const query = { groupBy: 'agent' as const, userId };
  const usage = useQuery({
    queryKey: agentsKeys.usage(query),
    queryFn: () => api.usage(query),
  });
  if (usage.isError)
    return (
      <AgLoadError
        title={t('me.usage.loadFailed')}
        error={usage.error}
        onRetry={() => void usage.refetch()}
      />
    );
  if (!usage.data) return <Skeleton className='h-12' />;
  const { totals } = usage.data;
  const figures: readonly (readonly [string, string])[] = [
    [t('me.usage.runs'), new Intl.NumberFormat(locale).format(totals.runs)],
    [
      t('me.usage.tokens'),
      formatTokens(totals.inputTokens + totals.outputTokens, locale),
    ],
    [t('me.usage.cost'), formatCost(totals.cost, locale)],
  ];
  return (
    <dl className='grid grid-cols-3 gap-3' data-testid='me-usage'>
      {figures.map(([label, value]) => (
        <div key={label} className='rounded-md border px-3 py-2'>
          <dt className='text-xs text-muted-foreground'>{label}</dt>
          <dd className='text-lg font-semibold tabular-nums'>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AgentPreferencesPage(): ReactElement {
  const { t } = useTranslation();
  const { session } = useAuthentication();
  const userId = session?.user.id ?? null;
  const sections = usePreferenceSections();
  return (
    <PageContainer>
      <PageHeader title={t('me.title')} description={t('me.description')} />
      <div className='flex flex-col gap-4'>
        <Section testId='me-default-agent' title={t('me.defaultAgent.title')}>
          <DefaultAgentPreference />
        </Section>
        {userId ? (
          <>
            <Section
              testId='me-runtimes'
              title={t('me.runtimes.title')}
              description={t('me.runtimes.description')}
            >
              <MyRuntimes userId={userId} />
            </Section>
            <Section
              testId='me-usage-section'
              title={t('me.usage.title')}
              description={t('me.usage.description')}
            >
              <MyUsage userId={userId} />
            </Section>
          </>
        ) : null}
        {sections.map(({ key, component: Registered }) => (
          <Registered key={key} />
        ))}
      </div>
    </PageContainer>
  );
}
