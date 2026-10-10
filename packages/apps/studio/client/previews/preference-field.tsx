/** Immediate-save issue preference, sharing the preview query with the Code section. */
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { PropertyRow } from '@/components/property-fields';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useNotify } from '../access/notify.js';
import { setPreviewPreference } from './api.js';
import { useIssuePreviews } from './use-issue-previews.js';

export function PreviewPreferenceField({
  issueId,
}: {
  readonly issueId: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const notify = useNotify();
  const { query, replace } = useIssuePreviews(issueId);
  const mutation = useMutation({
    mutationFn: (notRequired: boolean) =>
      setPreviewPreference(api, issueId, notRequired),
    onSuccess: (next) => {
      // The preference response omits passwords; keep credentials already read by this viewer.
      replace({
        ...next,
        previews: next.previews.map((preview) => ({
          ...preview,
          admin:
            next.canEdit && preview.admin
              ? (query.data?.previews.find(
                  (previous) => previous.id === preview.id,
                )?.admin ?? preview.admin)
              : preview.admin,
        })),
      });
      notify.success(t('previews.preference.saved'));
    },
    onError: (error) => notify.error(error),
  });
  const canRetry = !(
    query.error instanceof ApiClientError &&
    [403, 404].includes(query.error.status)
  );
  return (
    <PropertyRow
      label={t('previews.preference.label')}
      htmlFor='preview-not-required'
    >
      <div className='space-y-1'>
        {query.isError ? (
          <span className='text-xs text-muted-foreground'>
            {t('previews.preference.loadFailed')}
            {canRetry ? (
              <Button
                variant='ghost'
                size='sm'
                disabled={query.isFetching}
                onClick={() => {
                  void query.refetch();
                }}
              >
                {t('previews.preference.retry')}
              </Button>
            ) : null}
          </span>
        ) : query.data && !query.data.canEdit ? (
          <span className='text-sm'>
            {t(
              query.data.notRequired
                ? 'previews.preference.on'
                : 'previews.preference.off',
            )}
          </span>
        ) : (
          <Switch
            id='preview-not-required'
            aria-label={t('previews.preference.label')}
            checked={query.data?.notRequired ?? false}
            disabled={!query.data || mutation.isPending}
            onCheckedChange={(value) => mutation.mutate(value)}
          />
        )}
        <p className='text-xs text-muted-foreground'>
          {t('previews.preference.hint')}
        </p>
        {query.data?.labels?.some((label) => label.failed) ? (
          <p role='status' className='text-xs text-muted-foreground'>
            {t('previews.preference.syncFailed')}
          </p>
        ) : null}
      </div>
    </PropertyRow>
  );
}
