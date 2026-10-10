/**
 * One plan as the UI Library's plan card (`extensions/nocobase-plan-card`), a covering page, at two addresses:
 *
 * - `<issue page>/plans/:planId`, opened from an issue page (its related plans, a timeline entry "via ‹Agent›'s
 *   plan"), over that page, wherever the issue is opened (`/issues/:issueId`, under `/my-issues` or a project): the
 *   trail's issue and Back return to it as it was left;
 * - `/issues/plans/:planId`, opened anywhere else (the inbox, a chat's plan card), over the issues page. It takes the
 *   place of the projects plugin's own plan page (`issueChildRoutes`' `pm-plan`).
 *
 * Either way the header's trail is the issue's, `<list> › <issue> › <plan>` (`issue-trail.ts`), by the issue it was
 * opened from, else the first it is about (`planIssues`), and the card links every issue the plan is about, that one
 * first. A plan about no issue keeps `<list> › <plan>`.
 */
import { ApiClientError, usePageBreadcrumb } from '@nocobase/app-client';
import {
  PmDetailSkeleton,
  PmLoadError,
  usePageContextSource,
  usePlanIssue,
  usePlanQuery,
  usePlanWording,
} from '@nocobase/app-plugin-projects/client/kit';
import type { IssueDetail } from '@nocobase/app-plugin-projects/shared/issues';
import { ACCESS_NAMESPACE as PROJECTS_NS } from '@nocobase/app-plugin-projects/shared/access';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { Link, useLocation, useParams, type To } from 'react-router';

import { PageContainer } from '@/components/page-container';
import { RouteChildPage } from '@/components/route-child-page';
import { Button } from '@/components/ui/button';
import { PlanCard } from '@/extensions/nocobase-plan-card/plan-card';
import {
  defaultPlanIssueHref,
  planIssues,
  type PlanIssueHref,
} from '@/extensions/nocobase-plan-card/plan-issues';

import { useIssueParent } from '../../issues/detail/issue-parent.js';
import { issueTrailLevels } from '../../issues/detail/issue-trail.js';
import { issueBeneathPlan } from '../../issues/detail/plan-links.js';

export default function PlanPage(): ReactElement {
  const { planId = '' } = useParams();
  return (
    <RouteChildPage>
      <PlanView key={planId} planId={planId} />
    </RouteChildPage>
  );
}

/**
 * The header's trail: the issue's with the plan last, the issue leading to `issueTo`; without an issue, the list's
 * trail and the plan, the list leading back to where the person left it.
 */
function usePlanTrail(
  title: string,
  issue: IssueDetail | undefined,
  issueTo: To | undefined,
): void {
  const parent = useIssueParent();
  usePageBreadcrumb(
    issue
      ? issueTrailLevels(issue, parent, {
          current: title,
          ...(issueTo ? { issueTo } : {}),
        })
      : [...parent.levels, { label: title }],
  );
}

function PlanView({ planId }: { readonly planId: string }): ReactElement {
  const { t } = useTranslation(PROJECTS_NS);
  const parent = useIssueParent();
  // The issue page the plan was opened over, which the trail and the issue's link return to as it was left.
  const { issueId: openedFrom } = useParams();
  const beneath = issueBeneathPlan(useLocation()) ?? undefined;
  const plan = usePlanQuery(planId);
  const wording = usePlanWording();
  const title = plan.data ? wording(plan.data).title : null;
  const issue = usePlanIssue(
    openedFrom ?? (plan.data ? (planIssues(plan.data)[0]?.id ?? null) : null),
  ).data;
  const issueHref: PlanIssueHref = (linked) =>
    beneath && linked.id === issue?.id ? beneath : defaultPlanIssueHref(linked);
  usePlanTrail(
    title ?? plan.data?.title ?? t('plans.breadcrumb'),
    issue,
    beneath,
  );
  usePageContextSource(
    plan.data && title
      ? { kind: 'plan', id: plan.data.id, label: title }
      : null,
  );
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
          {...(missing && !beneath
            ? {
                action: (
                  <Button
                    variant='outline'
                    size='sm'
                    nativeButton={false}
                    render={
                      <Link
                        to={{ pathname: parent.path, search: parent.search }}
                      />
                    }
                  >
                    {t('plans.backToList')}
                  </Button>
                ),
              }
            : {})}
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
        firstIssueId={issue?.id ?? openedFrom ?? null}
        issueHref={issueHref}
      />
    </PageContainer>
  );
}
