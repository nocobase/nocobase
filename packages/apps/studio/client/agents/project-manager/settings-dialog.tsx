/**
 * `/agents/project-manager`: the project manager's settings, in a dialog over the Agent page. The agents it runs with
 * (a first choice among the enabled agents and an optional fallback, never the first choice), its allocation
 * principles (the built-in ones until someone edits them; "Restore built-in" puts them back, saved as `null`) and how
 * many runs agents' comments may start on an issue within 24 hours. Whoever may not manage agents reads them only.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { RotateCcwIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { RouteDialog } from '@/components/route-dialog';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useRouteOverlay } from '@/components/use-route-overlay';

import {
  COMMENT_RUN_LIMIT_MAX,
  COMMENT_RUN_WINDOW_HOURS,
  type ProjectManagerView,
} from '../../../shared/project-manager.js';
import { useNotify } from '../../access/notify.js';
import { useProjectManager, useUpdateProjectManager } from './api.js';
import {
  draftOf,
  limitOf,
  fallbackSecondsOf,
  delegationSecondsOf,
  patchOf,
  type Draft,
} from './draft.js';

const NO_FALLBACK = '';

export default function ProjectManagerSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const manager = useProjectManager();
  if (!manager.data)
    return (
      <RouteDialog
        title={t('projectManager.settingsPage.title')}
        description={t('projectManager.settingsPage.description')}
        className='sm:max-w-2xl'
      >
        {manager.isError ? (
          <p className='text-sm text-muted-foreground'>
            {t('projectManager.loadFailed')}
          </p>
        ) : (
          <Skeleton className='h-64 w-full' />
        )}
      </RouteDialog>
    );
  return <Settings view={manager.data} />;
}

function Settings({
  view,
}: {
  readonly view: ProjectManagerView;
}): ReactElement {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Draft>(() => draftOf(view));
  const readOnly = !view.canEdit;
  const limit = limitOf(draft.commentRunLimit);
  const set = (changes: Partial<Draft>) =>
    setDraft((current) => ({ ...current, ...changes }));
  const choiceItems = view.choices.map((choice) => ({
    value: choice.id,
    label: choice.name,
  }));
  const fallbackItems = [
    { value: NO_FALLBACK, label: t('projectManager.settingsPage.noFallback') },
    ...choiceItems.filter((item) => item.value !== draft.firstChoiceAgentId),
  ];
  return (
    <RouteDialog
      title={t('projectManager.settingsPage.title')}
      description={t('projectManager.settingsPage.description')}
      className='sm:max-w-2xl'
      footer={
        <Footer
          view={view}
          draft={draft}
          readOnly={readOnly}
          invalid={
            limit === null ||
            draft.name.trim().length === 0 ||
            draft.name.trim().length > 200 ||
            draft.description.length > 10_000 ||
            fallbackSecondsOf(draft.fallbackAfterSeconds) === null ||
            delegationSecondsOf(draft.delegationQueueTimeoutSeconds) === null
          }
        />
      }
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor='pm-name'>
            {t('projectManager.settingsPage.name')}
          </FieldLabel>
          <Input
            id='pm-name'
            value={draft.name}
            maxLength={200}
            readOnly={readOnly}
            onChange={(event) => set({ name: event.target.value })}
            aria-invalid={draft.name.trim() === ''}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor='pm-description'>
            {t('projectManager.settingsPage.identityDescription')}
          </FieldLabel>
          <Textarea
            id='pm-description'
            value={draft.description}
            maxLength={10_000}
            readOnly={readOnly}
            onChange={(event) => set({ description: event.target.value })}
          />
        </Field>
        {readOnly ? (
          <p className='rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground'>
            {t('projectManager.settingsPage.readOnly')}
          </p>
        ) : null}
        <FieldSet>
          <FieldLegend>{t('projectManager.settingsPage.agents')}</FieldLegend>
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field>
              <FieldLabel htmlFor='pm-first-choice'>
                {t('projectManager.settingsPage.firstChoice')}
              </FieldLabel>
              <Select
                items={choiceItems}
                value={draft.firstChoiceAgentId}
                disabled={readOnly}
                onValueChange={(next: string | null) =>
                  set({
                    firstChoiceAgentId: next,
                    ...(next !== null && next === draft.fallbackAgentId
                      ? { fallbackAgentId: null }
                      : {}),
                  })
                }
              >
                <SelectTrigger id='pm-first-choice' className='w-full'>
                  <SelectValue
                    placeholder={t('projectManager.settingsPage.choose')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {choiceItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor='pm-fallback'>
                {t('projectManager.settingsPage.fallback')}
              </FieldLabel>
              <Select
                items={fallbackItems}
                value={draft.fallbackAgentId ?? NO_FALLBACK}
                disabled={readOnly}
                onValueChange={(next: string | null) =>
                  set({
                    fallbackAgentId:
                      next === null || next === NO_FALLBACK ? null : next,
                  })
                }
              >
                <SelectTrigger id='pm-fallback' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fallbackItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <FieldDescription>
            {view.choices.length === 0
              ? t('projectManager.settingsPage.noChoices')
              : t('projectManager.settingsPage.agentsHint')}
          </FieldDescription>
        </FieldSet>
        <Field
          data-invalid={
            fallbackSecondsOf(draft.fallbackAfterSeconds) === null
              ? true
              : undefined
          }
        >
          <FieldLabel htmlFor='pm-fallback-after'>
            {t('projectManager.settingsPage.fallbackAfter')}
          </FieldLabel>
          <Input
            id='pm-fallback-after'
            type='number'
            min={1}
            max={3600}
            className='w-24'
            value={draft.fallbackAfterSeconds}
            readOnly={readOnly}
            aria-invalid={
              fallbackSecondsOf(draft.fallbackAfterSeconds) === null
                ? true
                : undefined
            }
            onChange={(event) =>
              set({ fallbackAfterSeconds: event.target.value })
            }
          />
          <FieldDescription>
            {t('projectManager.settingsPage.fallbackAfterHint')}
          </FieldDescription>
          {fallbackSecondsOf(draft.fallbackAfterSeconds) === null ? (
            <FieldError>
              {t('projectManager.settingsPage.fallbackAfterInvalid')}
            </FieldError>
          ) : null}
        </Field>
        <Field
          data-invalid={
            delegationSecondsOf(draft.delegationQueueTimeoutSeconds) === null ||
            undefined
          }
        >
          <FieldLabel htmlFor='pm-delegation-timeout'>
            {t('projectManager.settingsPage.delegationTimeout')}
          </FieldLabel>
          <Input
            id='pm-delegation-timeout'
            type='number'
            min={1}
            max={86400}
            className='w-24'
            value={draft.delegationQueueTimeoutSeconds}
            readOnly={readOnly}
            aria-invalid={
              delegationSecondsOf(draft.delegationQueueTimeoutSeconds) ===
                null || undefined
            }
            onChange={(event) =>
              set({ delegationQueueTimeoutSeconds: event.target.value })
            }
          />
          <FieldDescription>
            {t('projectManager.settingsPage.delegationTimeoutHint')}
          </FieldDescription>
          {delegationSecondsOf(draft.delegationQueueTimeoutSeconds) === null ? (
            <FieldError>
              {t('projectManager.settingsPage.delegationTimeoutInvalid')}
            </FieldError>
          ) : null}
        </Field>
        <Field>
          <div className='flex items-center justify-between gap-2'>
            <FieldLabel htmlFor='pm-principles'>
              {t('projectManager.settingsPage.principles')}
            </FieldLabel>
            {readOnly ? null : (
              <Button
                variant='ghost'
                size='sm'
                disabled={draft.principles === view.builtInPrinciples}
                onClick={() => set({ principles: view.builtInPrinciples })}
              >
                <RotateCcwIcon data-icon='inline-start' />
                {t('projectManager.settingsPage.restore')}
              </Button>
            )}
          </div>
          <Textarea
            id='pm-principles'
            rows={12}
            className='font-mono text-xs'
            value={draft.principles}
            readOnly={readOnly}
            onChange={(event) => set({ principles: event.target.value })}
          />
          <FieldDescription>
            {t('projectManager.settingsPage.principlesHint')}
          </FieldDescription>
        </Field>
        <Field data-invalid={limit === null ? true : undefined}>
          <FieldLabel htmlFor='pm-comment-run-limit'>
            {t('projectManager.settingsPage.limit')}
          </FieldLabel>
          <div className='flex flex-wrap items-center gap-2 text-sm'>
            <span>
              {t('projectManager.settingsPage.limitBefore', {
                hours: COMMENT_RUN_WINDOW_HOURS,
              })}
            </span>
            <Input
              id='pm-comment-run-limit'
              type='number'
              inputMode='numeric'
              min={1}
              max={COMMENT_RUN_LIMIT_MAX}
              className='w-24'
              value={draft.commentRunLimit}
              readOnly={readOnly}
              aria-invalid={limit === null ? true : undefined}
              onChange={(event) => set({ commentRunLimit: event.target.value })}
            />
            <span>{t('projectManager.settingsPage.limitAfter')}</span>
          </div>
          {limit === null ? (
            <FieldError>
              {t('projectManager.settingsPage.limitInvalid', {
                max: COMMENT_RUN_LIMIT_MAX,
              })}
            </FieldError>
          ) : null}
        </Field>
      </FieldGroup>
    </RouteDialog>
  );
}

function Footer({
  view,
  draft,
  readOnly,
  invalid,
}: {
  readonly view: ProjectManagerView;
  readonly draft: Draft;
  readonly readOnly: boolean;
  readonly invalid: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const overlay = useRouteOverlay();
  const update = useUpdateProjectManager();
  const notify = useNotify();
  if (readOnly)
    return (
      <Button variant='outline' onClick={() => void overlay.close()}>
        {t('projectManager.settingsPage.close')}
      </Button>
    );
  return (
    <>
      <Button
        variant='outline'
        disabled={update.isPending}
        onClick={() => void overlay.close()}
      >
        {t('projectManager.settingsPage.cancel')}
      </Button>
      <Button
        disabled={update.isPending || invalid}
        onClick={() =>
          update.mutate(patchOf(draft, view), {
            onSuccess: () => {
              notify.success(t('projectManager.settingsPage.saved'));
              void overlay.close();
            },
            onError: (error) =>
              notify.error(error, t('projectManager.settingsPage.saveFailed')),
          })
        }
      >
        {update.isPending ? <Spinner data-icon='inline-start' /> : null}
        {t('projectManager.settingsPage.save')}
      </Button>
    </>
  );
}
