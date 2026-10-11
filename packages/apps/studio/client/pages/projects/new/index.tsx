/**
 * Route `/projects/new`: "New project" on the Projects page, a three-step wizard in a route dialog (fixed header and
 * footer, the steps named at the top):
 *
 * 1. Basics: the project's name, description and workflow template;
 * 2. Code: its working directory, chosen as a project's settings choose one (`projects/code-location`: a new GitHub
 *    repository, an existing repository, a directory on a runner, or none, which is a blank project), with the optional
 *    initialization; without a repository the project is created from here;
 * 3. Deploy, for a repository: "Configure CI" (`releases/ci-setup/deploy-step.tsx`), the way and the applications it
 *    generates for, or "Skip" to configure it later in the project’s settings. A new repository that starts as a
 *    NocoBase application has no such step: Studio connects its preview CI with it.
 *
 * "Back" keeps what was entered. Who works on the project's issues is left to the workflow's status rules. Studio makes
 * everything in one request (`POST /api/projectSetups`), a new repository included, so cancelling leaves nothing
 * behind, and opens the project, whose Overview lists what is still to set up.
 */
import { useApiClient } from '@nocobase/app-client';
import { WorkflowSelect } from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { useQueryClient } from '@tanstack/react-query';
import { CheckIcon, Loader2Icon } from 'lucide-react';
import { useId, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router';

import { RouteDialog } from '@/components/route-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouteOverlay } from '@/components/use-route-overlay';
import { cn } from 'cn';

import type {
  NewProjectFormLabels,
  NewProjectMissing,
} from '../../../projects/code-location/parts/labels.js';
import type { NewProjectRequest } from '../../../../shared/project-init.js';
import { errorText, useNotify } from '../../../access/notify.js';
import { CodeLocationFields } from '../../../projects/code-location/code-location-fields.js';
import { useCodeLocation } from '../../../projects/code-location/use-code-location.js';
import { ProjectInitApi } from '../../../projects/init-api.js';
import { useNewProjectFormLabels } from '../../../projects/new-project-labels.js';
import { CiDeployStep } from '../../../releases/ci-setup/deploy-step.js';
import { useCiDraft } from '../../../releases/ci-setup/draft.js';
import {
  wizardSteps,
  type WizardStep,
} from '../../../projects/new-project-steps.js';

const STEP_KEYS: Readonly<Record<WizardStep, string>> = {
  1: 'basics',
  2: 'code',
  3: 'deploy',
};

function StepIndicator({
  steps,
  current,
}: {
  readonly steps: readonly WizardStep[];
  readonly current: WizardStep;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <ol
      className='flex flex-wrap items-center gap-2 text-sm'
      aria-label={t('projectPage.newProject.steps.label')}
      data-wizard-steps
    >
      {steps.map((step, index) => {
        const done = step < current;
        const active = step === current;
        return (
          <li
            key={step}
            className='flex items-center gap-2'
            aria-current={active ? 'step' : undefined}
            data-wizard-step={STEP_KEYS[step]}
          >
            {index > 0 ? (
              <span className='h-px w-6 bg-border' aria-hidden='true' />
            ) : null}
            <span
              className={cn(
                'flex size-6 items-center justify-center rounded-full border text-xs',
                active && 'border-primary bg-primary text-primary-foreground',
                done && 'border-primary text-primary',
              )}
              aria-hidden='true'
            >
              {done ? <CheckIcon className='size-3.5' /> : index + 1}
            </span>
            <span
              className={cn(
                'text-muted-foreground',
                active && 'font-medium text-foreground',
              )}
            >
              {t(`projectPage.newProject.steps.${STEP_KEYS[step]}`)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function NewProjectPage(): ReactElement {
  const { t } = useTranslation();
  const labels = useNewProjectFormLabels();
  const code = useCodeLocation('newProject');
  const [step, setStep] = useState<WizardStep>(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  // A NocoBase application's preview CI is connected with it: no Deploy step.
  const steps = wizardSteps(code.repository && !code.nocobaseInit);
  const defaultBranch =
    code.location === 'existingRepo'
      ? code.defaultBranch.trim() || code.picked?.defaultRef || 'main'
      : 'main';
  const draft = useCiDraft({
    repoName: code.repositoryName,
    connected: code.connected,
    defaultBranch,
  });

  const request = (withCi: boolean): NewProjectRequest => {
    // A way done by hand sends nothing: the person copies what the step shows.
    const ci = withCi && code.repository ? draft.request() : null;
    return {
      name: name.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      workflowId,
      ...code.request(),
      ...(ci ? { ci } : {}),
    };
  };

  return (
    <RouteDialog
      title={t('projectPage.newProject.title')}
      description={t('projectPage.newProject.description')}
      className='sm:max-w-2xl'
      footer={
        <Footer
          step={step}
          last={steps[steps.length - 1] === step}
          missing={
            step === 1
              ? name.trim()
                ? null
                : 'name'
              : step === 2
                ? code.missing
                : null
          }
          onBack={() => setStep((current) => (current - 1) as WizardStep)}
          onNext={() => {
            setTried(false);
            setStep((current) => (current + 1) as WizardStep);
          }}
          canCreate={step !== 3 || draft.valid}
          onInvalid={() => setTried(true)}
          request={request}
          labels={labels}
        />
      }
    >
      <div className='flex flex-col gap-6' data-new-project-form>
        <StepIndicator steps={steps} current={step} />
        {step === 1 ? (
          <FieldGroup data-new-project-step='basics'>
            <Field>
              <FieldLabel htmlFor='new-project-name'>
                {t('projectPage.newProject.name')}
              </FieldLabel>
              <Input
                id='new-project-name'
                value={name}
                autoFocus
                maxLength={100}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='new-project-description'>
                {t('projectPage.newProject.projectDescription')}
              </FieldLabel>
              <Textarea
                id='new-project-description'
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='new-project-workflow'>
                {t('projectPage.newProject.workflow')}
              </FieldLabel>
              <WorkflowSelect
                id='new-project-workflow'
                value={workflowId}
                onChange={setWorkflowId}
              />
            </Field>
          </FieldGroup>
        ) : step === 2 ? (
          <div data-new-project-step='code'>
            <CodeLocationFields state={code} labels={labels} />
          </div>
        ) : (
          <div data-new-project-step='deploy'>
            <CiDeployStep
              draft={draft}
              repoName={code.repositoryName}
              defaultBranch={defaultBranch}
              connected={code.connected}
              showErrors={tried}
            />
          </div>
        )}
      </div>
    </RouteDialog>
  );
}

/**
 * What is still missing, then Cancel or Back, and Next or Create project; on the last step of a repository, "Skip"
 * creates the project without connecting its CI.
 */
function Footer({
  step,
  last,
  missing,
  canCreate,
  onBack,
  onNext,
  onInvalid,
  request,
  labels,
}: {
  readonly step: WizardStep;
  readonly last: boolean;
  readonly missing: NewProjectMissing | null;
  readonly canCreate: boolean;
  readonly onBack: () => void;
  readonly onNext: () => void;
  readonly onInvalid: () => void;
  readonly request: (withCi: boolean) => NewProjectRequest;
  readonly labels: NewProjectFormLabels;
}): ReactElement {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  const navigate = useNavigate();
  const api = new ProjectInitApi(useApiClient());
  const notify = useNotify();
  const queryClient = useQueryClient();
  const reasonId = useId();
  const [busy, setBusy] = useState<'create' | 'skip' | null>(null);
  const reason = missing && !busy ? labels.incomplete[missing] : null;

  async function create(withCi: boolean): Promise<void> {
    setBusy(withCi ? 'create' : 'skip');
    try {
      const result = await api.create(request(withCi));
      notify.success(
        result.initIssueIdentifier
          ? t('projectPage.newProject.created', {
              identifier: result.initIssueIdentifier,
            })
          : t('projectPage.newProject.createdPlain'),
      );
      void queryClient.invalidateQueries({ queryKey: ['pm'] });
      void queryClient.invalidateQueries({ queryKey: ['studio', 'releases'] });
      void navigate(`/projects/${encodeURIComponent(result.projectId)}`, {
        replace: true,
      });
    } catch (error) {
      notify.error(error, errorText(t, error, t('common.requestFailed')));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {reason ? (
        <p
          id={reasonId}
          data-new-project-missing={missing}
          className='self-center text-sm text-muted-foreground'
        >
          {reason}
        </p>
      ) : null}
      {step === 1 ? (
        <Button
          type='button'
          variant='ghost'
          disabled={busy !== null}
          onClick={() => void close()}
        >
          {labels.cancel}
        </Button>
      ) : (
        <Button
          type='button'
          variant='outline'
          disabled={busy !== null}
          onClick={onBack}
        >
          {t('projectPage.newProject.back')}
        </Button>
      )}
      {step === 3 ? (
        <Button
          type='button'
          variant='outline'
          disabled={busy !== null}
          onClick={() => void create(false)}
          data-wizard-skip
        >
          {busy === 'skip' ? <Loader2Icon className='animate-spin' /> : null}
          {t('projectPage.newProject.skip')}
        </Button>
      ) : null}
      {last ? (
        <Button
          type='button'
          disabled={missing !== null || busy !== null}
          aria-describedby={reason ? reasonId : undefined}
          onClick={() => {
            if (!canCreate) {
              onInvalid();
              return;
            }
            void create(step === 3);
          }}
        >
          {busy === 'create' ? <Loader2Icon className='animate-spin' /> : null}
          {labels.create}
        </Button>
      ) : (
        <Button
          type='button'
          disabled={missing !== null}
          aria-describedby={reason ? reasonId : undefined}
          onClick={onNext}
        >
          {t('projectPage.newProject.next')}
        </Button>
      )}
    </>
  );
}
