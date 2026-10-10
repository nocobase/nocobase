/**
 * "Next steps" on a project's Overview: what is still to set up, each item a link to where it is done, and nothing at
 * all once everything is: a working directory when the project has none, the initialization while it runs (its
 * issue), and each repository whose preview CI is not connected yet (Settings › Deployment for it, saying where it
 * stands). Only those who manage the project see the settings it links to, so only they see the card.
 */
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronRightIcon, ListChecksIcon } from 'lucide-react';
import type { ReactElement } from 'react';
import { Link } from 'react-router';

import { Badge } from '@/components/ui/badge';

import { useCiConnections } from '../../releases/ci-setup/api.js';
import { useProjectInit } from '../init-query.js';
import { nextSteps, type NextStep } from './next-steps-model.js';

export function NextStepsCard({
  projectId,
  resources,
}: {
  readonly projectId: string;
  readonly resources: readonly ProjectResource[];
}): ReactElement | null {
  const { t } = useTranslation();
  const init = useProjectInit(projectId).data;
  const connections = useCiConnections(
    resources
      .filter((resource) => resource.type === 'gitRepo')
      .map((resource) => resource.id),
  );
  const steps = nextSteps(
    {
      projectId,
      resources,
      init,
      ci: Object.fromEntries(
        Object.entries(connections).map(([id, view]) => [id, view.connection]),
      ),
    },
    (key, values) => t(key, values),
  );
  return <Steps steps={steps} />;
}

/** The card, hidden when nothing is left. */
export function Steps({
  steps,
}: {
  readonly steps: readonly NextStep[];
}): ReactElement | null {
  const { t } = useTranslation();
  if (steps.length === 0) return null;
  return (
    <section
      className='flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground'
      aria-labelledby='studio-next-steps-heading'
      data-next-steps
    >
      <div className='flex flex-col gap-1'>
        <h2
          id='studio-next-steps-heading'
          className='flex items-center gap-2 text-base font-medium'
        >
          <ListChecksIcon className='size-4' aria-hidden />
          {t('projectPage.nextSteps.title')}
        </h2>
        <p className='text-sm text-muted-foreground'>
          {t('projectPage.nextSteps.description')}
        </p>
      </div>
      <ul className='flex flex-col divide-y'>
        {steps.map((step) => (
          <li key={step.key} data-next-step={step.key}>
            <Link
              to={step.to}
              className='flex items-center gap-2 py-2 text-sm hover:text-primary'
            >
              <span className='min-w-0 flex-1 truncate'>{step.title}</span>
              {step.state ? (
                <Badge variant='secondary'>{step.state}</Badge>
              ) : null}
              <ChevronRightIcon
                className='size-4 shrink-0 text-muted-foreground'
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
