/**
 * Commit attribution: who an agent's commits name besides the person who asked for the work. The person's own choice is
 * a user preference (`git.attribution`, Account settings › Preferences: the project's default, me with the agent as
 * co-author, or me only); a project's managers set the project's default on its Settings tab. The server applies them
 * when a run is handed out (`server/git/run-git.ts`).
 */
import { useUserPreference } from '@nocobase/app-plugin-users/client/preferences';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '@/components/ui/field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';

import {
  ATTRIBUTION_PREFERENCE,
  COMMIT_ATTRIBUTIONS,
  type CommitAttribution,
} from '../../shared/git.js';
import { useNotify } from '../access/notify.js';
import { gitKeys, useGitApi, useGitProjectSettings } from './api.js';

const parseAttribution = (value: unknown): CommitAttribution | null =>
  (COMMIT_ATTRIBUTIONS as readonly unknown[]).includes(value)
    ? (value as CommitAttribution)
    : null;

/** The person's own choice, in their preferences; `default` leaves it to each project. */
export function AttributionPreferenceField(): ReactElement {
  const { t } = useTranslation();
  const [value, setValue] = useUserPreference<CommitAttribution | null>(
    ATTRIBUTION_PREFERENCE,
    { defaultValue: null, parse: parseAttribution },
  );
  return (
    <Field orientation='horizontal'>
      <FieldContent>
        <FieldLabel htmlFor='git-attribution'>
          {t('studioGit.attribution.title')}
        </FieldLabel>
        <FieldDescription>
          {t('studioGit.attribution.description')}
        </FieldDescription>
      </FieldContent>
      <NativeSelect
        id='git-attribution'
        value={value ?? 'default'}
        onChange={(event) => setValue(parseAttribution(event.target.value))}
      >
        <NativeSelectOption value='default'>
          {t('studioGit.attribution.projectDefault')}
        </NativeSelectOption>
        {COMMIT_ATTRIBUTIONS.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {t(`studioGit.attribution.${option}`)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

/** A project's default, on its Settings tab; only its managers change it. */
export function ProjectAttributionCard({
  projectId,
  canEdit,
}: {
  readonly projectId: string;
  readonly canEdit: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  const api = useGitApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const query = useGitProjectSettings(projectId);
  const save = useMutation({
    mutationFn: (attribution: CommitAttribution) =>
      api.saveProjectSettings(projectId, { attribution }),
    onSuccess: (settings) => {
      queryClient.setQueryData(gitKeys.project(projectId), settings);
      notify.success(t('studioGit.attribution.saved'));
    },
    onError: (error) => notify.error(error),
  });
  if (!query.data) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('studioGit.attribution.projectTitle')}</CardTitle>
        <CardDescription>
          {t('studioGit.attribution.projectDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <NativeSelect
          aria-label={t('studioGit.attribution.projectTitle')}
          value={query.data.attribution}
          disabled={!canEdit || save.isPending}
          onChange={(event) => {
            const next = parseAttribution(event.target.value);
            if (next) save.mutate(next);
          }}
        >
          {COMMIT_ATTRIBUTIONS.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {t(`studioGit.attribution.${option}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </CardContent>
    </Card>
  );
}
