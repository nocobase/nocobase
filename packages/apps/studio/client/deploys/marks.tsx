/**
 * Deployment marks on issues: "Staging ✓ a1b2c3d", "Production ✓ 1.4.0", or "Withdrawn with 1.3.0" after a rollback,
 * in a list row, on a board card, in the issue page's meta line (`issues/issue-marks.tsx`) and under the pull request
 * that carried them (`issues/detail/code-section.tsx`). `use-marks.ts` reads them.
 */
import { PmTag } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { RocketIcon, Undo2Icon } from 'lucide-react';
import type { ReactElement } from 'react';

import type { DeployMark } from '../../shared/previews.js';
import { marksByEnvironment, useDeployMarks } from './use-marks.js';

/** Where a mark is drawn: a list row, a board card, or the issue page. */
export type IssueMarkPlacement = 'row' | 'card' | 'detail';

/** One mark, named after its environment. */
export function DeployMarkTag({
  mark,
  placement,
}: {
  readonly mark: DeployMark;
  readonly placement: IssueMarkPlacement;
}): ReactElement {
  const { t, i18n } = useTranslation();
  const role = mark.environmentName;
  const withdrawn = mark.status === 'withdrawn';
  const ref =
    mark.role === 'production' && mark.version
      ? mark.version
      : mark.sha.slice(0, 7);
  const title = withdrawn
    ? t('deploys.withdrawnTitle', {
        role,
        version: mark.withdrawnVersion ?? '—',
      })
    : t('deploys.markTitle', {
        role,
        app: mark.appId,
        version: mark.version ?? '—',
        sha: mark.sha.slice(0, 7),
        at: new Date(mark.deployedAt).toLocaleString(i18n.language),
      });
  return (
    <PmTag
      tone={withdrawn ? 'slate' : mark.role === 'production' ? 'green' : 'blue'}
      icon={withdrawn ? <Undo2Icon /> : <RocketIcon />}
      title={title}
      data-deploy-mark={`${mark.role}:${mark.status}`}
    >
      {withdrawn
        ? placement === 'detail'
          ? `${role} · ${t('deploys.markWithdrawn', {
              version: mark.withdrawnVersion ?? '—',
            })}`
          : `${role} ↩`
        : t('deploys.markDeployed', { role, ref })}
    </PmTag>
  );
}

export function DeployMarkTags({
  issue,
  placement,
}: {
  readonly issue: { readonly id: string };
  readonly placement: IssueMarkPlacement;
}): ReactElement | null {
  const marks = useDeployMarks(issue.id);
  const list = marks.data ?? [];
  if (list.length === 0) return null;
  return (
    <>
      {marksByEnvironment(list).map((mark) => (
        <DeployMarkTag key={mark.appId} mark={mark} placement={placement} />
      ))}
    </>
  );
}
