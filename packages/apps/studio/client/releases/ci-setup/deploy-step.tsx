/**
 * New project › Deploy: "Configure CI" for a repository that does not exist yet (`configure-form.tsx`), inline in the
 * wizard's dialog rather than in a dialog of its own. It connects one application to one target, pull requests to the
 * Preview environment first; a way Studio carries out goes with the new project's request (`NewProjectRequest.ci`) and
 * runs once the repository is added; a way done by hand shows what to copy and sends nothing. Other targets are
 * configured again later from the project's settings.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';

import { CI_SECRET_NAME } from '../../../shared/ci-modes.js';
import { CiConfigureFields } from './configure-form.js';
import type { CiDraft } from './draft.js';

export function CiDeployStep({
  draft,
  repoName,
  defaultBranch,
  connected,
  showErrors,
}: {
  readonly draft: CiDraft;
  readonly repoName: string | null;
  readonly defaultBranch: string;
  readonly connected: boolean;
  readonly showErrors: boolean;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <FieldGroup data-ci-deploy-step className='min-w-0'>
      <FieldSet className='min-w-0'>
        <FieldLegend>{t('ciSetup.configure.title')}</FieldLegend>
        <FieldDescription>
          {t('ciSetup.configure.description')}
        </FieldDescription>
        <CiConfigureFields
          draft={draft}
          repoName={repoName}
          repo={repoName}
          defaultBranch={defaultBranch}
          connected={connected}
          secretName={CI_SECRET_NAME}
          showErrors={showErrors}
        />
      </FieldSet>
      <p className='text-sm text-muted-foreground' data-ci-later>
        {t('ciSetup.wizard.later')}
      </p>
    </FieldGroup>
  );
}
