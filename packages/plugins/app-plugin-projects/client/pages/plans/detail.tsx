import { ApiClientError, usePageBreadcrumb } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link, useParams } from 'react-router';

import { PageContainer } from '../../components/page-container.js';
import { PmDetailSkeleton, PmLoadError } from '../../components/pm-states.js';
import { RouteChildPage } from '../../components/route-child-page.js';
import { Button } from '../../components/ui/button.js';
import { usePageContextSource } from '../../kit/page-context.js';
import { PlanCard } from '../../kit/plans/plan-card.js';
import { usePlanWording } from '../../kit/plans/plan-text.js';
import { usePlanQuery } from '../../kit/plans/use-plan.js';

/**
 * Route `/issues/plans/:planId`: one plan as its card, covering the page underneath. Plans are decided in the
 * conversation that proposed them; timeline entries "via ‹Agent›'s plan" link here, to see what one did.
 */
export default function PlanDetailPage(): ReactElement {
  const { planId = '' } = useParams();
  return (
    <RouteChildPage>
      <PlanDetailView key={planId} planId={planId} />
    </RouteChildPage>
  );
}

function PlanDetailView({ planId }: { readonly planId: string }): ReactElement {
  const { t } = useTranslation();
  const plan = usePlanQuery(planId);
  const wording = usePlanWording();
  const title = plan.data ? wording(plan.data).title : null;
  usePageContextSource(
    plan.data && title
      ? { kind: 'plan', id: plan.data.id, label: title }
      : null,
  );
  // The header's trail (the shell renders it): the issues, then this plan.
  usePageBreadcrumb([
    { label: t('issues.title'), to: '/issues' },
    { label: title ?? plan.data?.title ?? t('plans.breadcrumb') },
  ]);
  if (plan.isError && !plan.data) {
    const missing =
      plan.error instanceof ApiClientError &&
      [403, 404].includes(plan.error.status);
    return (
      <PageContainer className='max-w-4xl'>
        <PmLoadError
          title={t('plans.loadFailed')}
          error={plan.error}
          notFound={t('plans.notFound')}
          onRetry={() => void plan.refetch()}
          action={
            missing ? (
              <Button
                variant='outline'
                size='sm'
                nativeButton={false}
                render={<Link to='/issues' />}
              >
                {t('plans.backToList')}
              </Button>
            ) : undefined
          }
        />
      </PageContainer>
    );
  }
  if (!plan.data) return <PmDetailSkeleton />;
  return (
    <PageContainer className='max-w-4xl'>
      <PlanCard
        planId={plan.data.id}
        plan={plan.data}
        defaultExpanded
        linkTitle={false}
      />
    </PageContainer>
  );
}
