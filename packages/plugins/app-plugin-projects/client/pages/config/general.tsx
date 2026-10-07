import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, type ReactElement, useState } from 'react';

import {
  ISSUE_PREFIX_PATTERN,
  type WorkspaceSettings,
} from '../../../shared/settings.js';
import { pmKeys } from '../../api/keys.js';
import { PmListSkeleton, PmLoadError } from '../../components/pm-states.js';
import { Button } from '../../components/ui/button.js';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import { Spinner } from '../../components/ui/spinner.js';
import { useNotify } from '../../hooks/use-notify.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { useViewer } from '../../hooks/use-viewer.js';
import { canUseSetting } from '../../lib/permissions.js';
import { SectionHeading } from './section-heading.js';

/**
 * The issue identifiers section of `/config/general` (the application draws the page's heading): the prefix of new
 * issue identifiers (`PM-12`). Existing identifiers keep the prefix they were created with. Read-only without
 * `pm.general/update`.
 */
export default function GeneralSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const viewer = useViewer();
  const settings = useQuery({
    queryKey: pmKeys.settings,
    queryFn: () => api.settings(),
  });
  const canEdit = canUseSetting(viewer, 'pm.general', 'update');

  let content: ReactElement;
  if (settings.isError && !settings.data)
    content = (
      <PmLoadError
        title={t('settingsPage.loadFailed')}
        error={settings.error}
        onRetry={() => void settings.refetch()}
      />
    );
  else if (!settings.data || !viewer) content = <PmListSkeleton rows={2} />;
  else content = <PrefixForm settings={settings.data} canEdit={canEdit} />;

  return (
    <section className='space-y-4' aria-labelledby='pm-config-general-heading'>
      <SectionHeading
        id='pm-config-general-heading'
        title={t('settingsPage.general.title')}
      />
      {content}
    </section>
  );
}

function PrefixForm({
  settings,
  canEdit,
}: {
  readonly settings: WorkspaceSettings;
  readonly canEdit: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [prefix, setPrefix] = useState(settings.issuePrefix);
  const valid = ISSUE_PREFIX_PATTERN.test(prefix);
  const changed = prefix !== settings.issuePrefix;
  const save = useMutation({
    mutationFn: (issuePrefix: string) => api.updateSettings({ issuePrefix }),
    onSuccess: (next) => {
      queryClient.setQueryData(pmKeys.settings, next);
      notify.success(t('settingsPage.general.saved'));
    },
    onError: (error) => notify.error(error),
  });

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (valid && changed) save.mutate(prefix);
  };

  return (
    <form onSubmit={submit} className='max-w-md space-y-4'>
      <Field data-invalid={!valid || undefined}>
        <FieldLabel htmlFor='pm-issue-prefix'>
          {t('settingsPage.general.prefix')}
        </FieldLabel>
        <Input
          id='pm-issue-prefix'
          value={prefix}
          maxLength={10}
          disabled={!canEdit || save.isPending}
          aria-invalid={!valid || undefined}
          className='w-40 font-mono uppercase'
          onChange={(event) => setPrefix(event.target.value.toUpperCase())}
        />
        {valid ? (
          <FieldDescription>
            {t('settingsPage.general.prefixHint', {
              example: `${prefix}-12`,
            })}
          </FieldDescription>
        ) : (
          <FieldError>{t('errors.INVALID_PREFIX')}</FieldError>
        )}
      </Field>
      {canEdit ? (
        <Button type='submit' disabled={!valid || !changed || save.isPending}>
          {save.isPending ? <Spinner data-icon='inline-start' /> : null}
          {t('actions.save')}
        </Button>
      ) : null}
    </form>
  );
}
