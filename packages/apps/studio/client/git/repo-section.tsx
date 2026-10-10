/**
 * A repository's branch rules and GitHub settings, a card of the project's Settings › Branch rules (`projects/settings`),
 * shown only while the workspace has a Git connection: the connection Studio follows the repository through, its branch
 * rules (the first names the agents' branches), saved with the card's Save; its webhook (`webhook-section.tsx`); and
 * whether failing checks and conflicts wake the agent, which take effect as they are switched. Only the project's
 * managers open the page; the server checks it again.
 */
import { useUnsavedChanges } from '@nocobase/app-client';
import type { ProjectResource } from '@nocobase/app-plugin-projects/shared/projects';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import type { UpdateGitRepoRequest } from '../../shared/git.js';
import { useNotify } from '../access/notify.js';
import { SettingsCard } from '../projects/settings/settings-card.js';
import { relativeTime } from '@/extensions/nocobase-inbox/model';
import { gitKeys, useGitApi, useGitStatus, useRepoSettings } from './api.js';
import { WebhookSection } from './webhook-section.js';

const rulesOf = (text: string) =>
  text
    .split('\n')
    .map((rule) => rule.trim())
    .filter(Boolean);

export function GitRepoSection({
  resource,
}: {
  readonly resource: ProjectResource;
}): ReactElement | null {
  const { t, i18n } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const status = useGitStatus();
  const query = useRepoSettings(resource.id);
  const [rules, setRules] = useState<string | null>(null);
  const stored = query.data?.branchRules.join('\n') ?? '';
  const changed = rules !== null && rules !== stored;
  useUnsavedChanges(changed);
  const save = useMutation({
    mutationFn: (input: UpdateGitRepoRequest) =>
      api.updateRepo(resource.id, input),
    onSuccess: (settings) => {
      queryClient.setQueryData(gitKeys.repo(resource.id), settings);
      setRules(null);
      notify.success(t('studioGit.repo.saved'));
    },
    onError: (error) => notify.error(error),
  });
  // A switch applies at once, and leaves rules being typed alone.
  const toggle = useMutation({
    mutationFn: (input: UpdateGitRepoRequest) =>
      api.updateRepo(resource.id, input),
    onSuccess: (settings) => {
      queryClient.setQueryData(gitKeys.repo(resource.id), settings);
      notify.success(t('studioGit.repo.saved'));
    },
    onError: (error) => notify.error(error),
  });
  if (resource.type !== 'gitRepo' || !status.data?.enabled) return null;
  const title = t('studioGit.repo.branchRules');
  if (!query.data)
    return (
      <SettingsCard id='git' title={title}>
        <Skeleton className='h-24 w-full' />
      </SettingsCard>
    );
  const settings = query.data;
  if (!settings.repo || !settings.connection)
    return (
      <SettingsCard
        id='git'
        title={title}
        description={t('studioGit.repo.notLinked')}
      />
    );
  return (
    <SettingsCard
      id='git'
      title={title}
      description={t('studioGit.repo.description', {
        repo: settings.repo,
        connection: settings.connection.name,
      })}
      note={
        settings.pollError ? (
          <span className='text-destructive'>
            {t('studioGit.repo.pollError', { error: settings.pollError })}
          </span>
        ) : settings.polledAt ? (
          t('studioGit.repo.polled', {
            time: relativeTime(settings.polledAt, i18n.language),
          })
        ) : null
      }
      actions={
        <Button
          type='button'
          size='sm'
          disabled={save.isPending || !changed}
          onClick={() => save.mutate({ branchRules: rulesOf(rules ?? stored) })}
        >
          {save.isPending ? <Spinner data-icon='inline-start' /> : null}
          {t('studioGit.repo.saveRules')}
        </Button>
      }
    >
      <Field>
        <FieldLabel htmlFor={`git-rules-${resource.id}`} className='sr-only'>
          {t('studioGit.repo.branchRules')}
        </FieldLabel>
        <Textarea
          id={`git-rules-${resource.id}`}
          rows={2}
          className='font-mono text-xs'
          value={rules ?? stored}
          onChange={(event) => setRules(event.target.value)}
        />
        <FieldDescription>
          {t('studioGit.repo.branchRulesHint')}
        </FieldDescription>
      </Field>
      <Separator />
      <WebhookSection resourceId={resource.id} settings={settings} />
      <div className='flex flex-col gap-3'>
        {(['wakeOnChecks', 'wakeOnConflict'] as const).map((key) => (
          <Field key={key} orientation='horizontal'>
            <Switch
              id={`git-${key}-${resource.id}`}
              checked={settings[key]}
              disabled={toggle.isPending}
              onCheckedChange={(checked) => toggle.mutate({ [key]: checked })}
            />
            <FieldContent>
              <FieldLabel htmlFor={`git-${key}-${resource.id}`}>
                {t(`studioGit.repo.${key}`)}
              </FieldLabel>
            </FieldContent>
          </Field>
        ))}
      </div>
    </SettingsCard>
  );
}
