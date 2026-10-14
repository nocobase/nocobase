/**
 * The body of "Configure CI" (`draft.ts`), the same inline in New project › Deploy and inside the settings' dialog
 * (`configure-dialog.tsx`), never a dialog of its own. A run connects one application: what starts its CI (a row of
 * three triggers), then the environment, the application's directory and its App ID on one row where they fit
 * (`target-fields.tsx`), then the way, as two rows of compact cards (`method-choice.tsx`). What the chosen way needs
 * besides shows right beneath its row, each generated thing collapsible with its Copy (`method-details.tsx`): the
 * executor of `agent`, the file to edit (`template`), the steps with the file and the nb-studio commands (`manual`, with
 * "Generate the repository's CI key" once the repository exists), or the prompt (`ownAgent`). None names the repository's ID: the CLI reads the repository and the commit from CI's
 * environment, so they read the same before the repository is added.
 *
 * The layout follows the form's own width (`@container/ci`), not the window's, so it fits the settings' wide dialog
 * and the wizard's narrower one alike.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { TriangleAlertIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FieldSeparator } from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { YamlEditor } from '@/components/yaml-editor';

import { ciWorkflowProblems } from '../../../shared/ci-modes.js';
import { ciCommands } from '../../../shared/ci-prompt.js';
import type { CiDraft } from './draft.js';
import { CiAgentField, CiMethodChoice } from './method-choice.js';
import {
  CiPreview,
  ManualSteps,
  OwnAgentPrompt,
  type ManualKeyTarget,
} from './method-details.js';
import { ownAgentPrompt } from './model.js';
import { useCiPromptWords, useStudioUrl } from './prompt-words.js';
import { CiTargetFields, CiTriggerField } from './target-fields.js';

export function CiConfigureFields({
  draft,
  repoName,
  repo,
  defaultBranch,
  connected,
  secretName,
  showErrors,
  keyTarget,
}: {
  readonly draft: CiDraft;
  /** The repository `manual` generates the CI key of; none before it exists (New project › Deploy). */
  readonly keyTarget?: ManualKeyTarget;
  /** Names the application. */
  readonly repoName: string | null;
  /** `owner/name`, or the clone URL, as the prompt names the repository. */
  readonly repo: string | null;
  readonly defaultBranch: string;
  readonly connected: boolean;
  readonly secretName: string;
  /** Problems show once the person tried to submit. */
  readonly showErrors: boolean;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <div
      className='@container/ci flex min-w-0 flex-col gap-5'
      data-ci-configure
    >
      <CiTriggerField draft={draft} showErrors={showErrors} />
      <CiTargetFields draft={draft} showErrors={showErrors} />
      <FieldSeparator />
      <CiMethodChoice
        value={draft.method}
        onChange={draft.setMethod}
        connected={connected}
        details={
          draft.method === 'agent' ? (
            <div className='flex flex-col gap-2'>
              <CiAgentField
                agentId={draft.agentId}
                onChange={draft.setAgentId}
                className='@md/ci:max-w-sm'
              />
              {showErrors && !draft.agentId ? (
                <p className='text-sm text-destructive'>
                  {t('ciSetup.agent.required')}
                </p>
              ) : null}
            </div>
          ) : (
            <MethodDetails
              draft={draft}
              repoName={repoName}
              repo={repo}
              defaultBranch={defaultBranch}
              secretName={secretName}
              keyTarget={keyTarget}
            />
          )
        }
      />
    </div>
  );
}

function MethodDetails({
  draft,
  repoName,
  repo,
  defaultBranch,
  secretName,
  keyTarget,
}: {
  readonly draft: CiDraft;
  readonly repoName: string | null;
  readonly repo: string | null;
  readonly defaultBranch: string;
  readonly secretName: string;
  readonly keyTarget?: ManualKeyTarget;
}): ReactElement | null {
  const { t } = useTranslation();
  const words = useCiPromptWords();
  const studioUrl = useStudioUrl();
  const { method, file } = draft;
  if (method !== 'template' && method !== 'manual' && method !== 'ownAgent')
    return null;
  let body: ReactNode;
  if (!draft.runValid)
    body = (
      <p className='text-sm text-muted-foreground'>
        {t('ciSetup.wizard.fixRun')}
      </p>
    );
  else if (draft.fileFailed)
    body = (
      <p className='text-sm text-destructive'>{t('common.requestFailed')}</p>
    );
  else if (!file || !draft.generated)
    body = (
      <Skeleton className='h-24 w-full' aria-label={t('ciSetup.loading')} />
    );
  else {
    if (method === 'template') {
      const problems = ciWorkflowProblems([file], secretName);
      const changed = draft.generated.content !== file.content;
      body = (
        <>
          <p className='text-sm text-muted-foreground'>
            {t('ciSetup.workflow.editHint', { secret: secretName })}
          </p>
          <CiPreview
            title={t('ciSetup.preview.workflow')}
            note={`${file.path} · ${
              changed
                ? t('ciSetup.workflow.changed')
                : t('ciSetup.workflow.unchanged')
            }`}
            copy={file.content}
            data-ci-preview='workflow'
          >
            <YamlEditor
              label={file.path}
              value={file.content}
              onChange={(content) => draft.edit(file.path, content)}
            />
          </CiPreview>
          {problems.length > 0 ? (
            <Alert data-ci-warnings>
              <TriangleAlertIcon />
              <AlertTitle>{t('ciSetup.workflow.warningsTitle')}</AlertTitle>
              <AlertDescription>
                <ul className='list-disc pl-5'>
                  {problems.map((problem) => (
                    <li key={`${problem.path}:${problem.problem}`}>
                      {t(`ciSetup.workflow.problems.${problem.problem}`, {
                        path: problem.path,
                        secret: secretName,
                      })}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}
        </>
      );
    } else if (method === 'manual') {
      const commands = ciCommands({
        appId: draft.app.appId,
        target: draft.target,
      });
      body = (
        <>
          <div data-ci-manual-file>
            <CiPreview
              title={t('ciSetup.preview.workflow')}
              note={file.path}
              copy={file.content}
              data-ci-preview='workflow'
            >
              <YamlEditor
                readOnly
                label={file.path}
                value={file.content}
                className='h-60'
              />
            </CiPreview>
          </div>
          <div data-ci-commands>
            <CiPreview
              title={t('ciSetup.manual.commands')}
              copy={commands}
              data-ci-preview='commands'
            >
              <pre className='overflow-x-auto rounded-md border bg-background p-3 font-mono text-xs leading-5'>
                {commands}
              </pre>
            </CiPreview>
          </div>
        </>
      );
    } else
      body = (
        <OwnAgentPrompt
          prompt={ownAgentPrompt(
            {
              studioUrl,
              repo: repo ?? repoName ?? '',
              defaultBranch,
              app: draft.app,
              target: draft.target,
              files: [file],
              secretName,
            },
            words,
          )}
        />
      );
  }
  return (
    <div
      className='flex min-w-0 flex-col gap-3 rounded-lg bg-muted/50 p-3'
      data-ci-method-details={method}
    >
      {method === 'manual' ? (
        <ManualSteps secretName={secretName} target={keyTarget} />
      ) : null}
      {body}
    </div>
  );
}
