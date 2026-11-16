# Settings page: `settings/projects/index.tsx`

Part of the [projects worked example](../example.md). **Depends on**: `RequestError` from [types](types.md); the settings route and item in ["Settings pages" in `page.md`](../page.md#5-settings-pages).

Rules: guideline T4 (one `Card` per topic, each saving on its own; a toggle applies at once, a setting that needs input applies on Save), ["Field types" in `form.md`](../form.md#field-types). The page opens with `read` on the `project-settings` item; changing anything needs `update`, checked with `useCan`, and without it the page shows the values read-only. The endpoints are `GET /api/projectSettings` and `PATCH /api/projectSettings`, both returning `{ data: ProjectSettings }`.

```tsx
// client/pages/settings/projects/index.tsx
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { FeedbackForm } from '#components/feedback-form';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import { Checkbox } from '#components/ui/checkbox';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from '#components/ui/field';
import { RadioGroup, RadioGroupItem } from '#components/ui/radio-group';
import { Skeleton } from '#components/ui/skeleton';
import { Spinner } from '#components/ui/spinner';
import { Switch } from '#components/ui/switch';
import { Textarea } from '#components/ui/textarea';
import { announceDataChange } from '#hooks/use-data-changes';
import { useListData } from '#hooks/use-list-data';

import { RequestError } from '../../projects/request-error.js';

interface ProjectSettings {
  readonly publicByDefault: boolean;
  readonly defaultView: 'list' | 'board';
  readonly welcomeMessage: string;
  readonly notifyOwners: boolean;
}
type Settings = { data: ProjectSettings };
const SCOPE = 'projectSettings';

export default function ProjectSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const request = useListData<Settings>('projectSettings', { scopes: [SCOPE] });
  const update = useCan({
    resource: { type: 'settings', id: 'project-settings' },
    action: 'update',
  });
  const api = useApiClient();
  // Each card sends only its own fields; the confirmed result updates every view of the settings.
  async function save(changes: Partial<ProjectSettings>): Promise<void> {
    const result = await api.request<Settings>({
      path: 'projectSettings',
      method: 'PATCH',
      json: changes,
    });
    announceDataChange({ scopes: [SCOPE], results: { [SCOPE]: result } });
  }
  const settings = request.error ? undefined : request.data?.data;
  return (
    <PageContainer>
      <PageHeader
        title={t('projectSettings.title')}
        description={t('projectSettings.description')}
      />
      {/* A settings page holds forms, so its content width is limited (guideline L4). */}
      <div className='flex max-w-2xl flex-col gap-6'>
        {request.error || update.error ? (
          <RequestError
            error={request.error ?? update.error}
            retry={request.error ? request.reload : update.retry}
          />
        ) : !settings || update.isPending ? (
          // Wait for the permission too, so an editable card never turns read-only.
          <Skeleton
            role='status'
            aria-label={t('projectSettings.loading')}
            className='h-48 w-full'
          />
        ) : (
          <>
            <VisibilityCard
              settings={settings}
              editable={update.can}
              save={save}
            />
            <DefaultsCard
              // Only this card's own stored values remount it; a toggle saved next to it keeps its input.
              key={`${settings.defaultView}|${settings.notifyOwners}|${settings.welcomeMessage}`}
              settings={settings}
              editable={update.can}
              save={save}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
}

interface CardProps {
  readonly settings: ProjectSettings;
  readonly editable: boolean;
  readonly save: (changes: Partial<ProjectSettings>) => Promise<void>;
}

/** A toggle applies at once with a toast; on failure it shows the stored value again (T4.3). */
function VisibilityCard({ settings, editable, save }: CardProps): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();
  const [pending, setPending] = useState(false);
  async function toggle(checked: boolean): Promise<void> {
    setPending(true);
    try {
      await save({ publicByDefault: checked });
      toaster.show({ type: 'success', title: t('projectSettings.saved') });
    } catch {
      toaster.show({ type: 'error', title: t('projectSettings.saveFailed') });
    } finally {
      setPending(false);
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projectSettings.visibility.title')}</CardTitle>
        <CardDescription>
          {t('projectSettings.visibility.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Field orientation='horizontal'>
          <Switch
            id='project-public'
            checked={settings.publicByDefault}
            disabled={!editable || pending}
            onCheckedChange={(checked) => void toggle(checked)}
          />
          <FieldLabel htmlFor='project-public'>
            {t('projectSettings.publicByDefault')}
          </FieldLabel>
        </Field>
      </CardContent>
    </Card>
  );
}

/** Settings that need input apply on the card's own Save (T4.2). */
function DefaultsCard({ settings, editable, save }: CardProps): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();
  const [saved] = useState(() => ({
    defaultView: settings.defaultView,
    welcomeMessage: settings.welcomeMessage,
    notifyOwners: settings.notifyOwners,
  }));
  const form = useForm({ defaultValues: saved, shouldFocusError: false });
  const [error, setError] = useState<unknown>();
  const submitting = form.formState.isSubmitting;
  const submit = form.handleSubmit(async (values) => {
    setError(undefined);
    try {
      await save({ ...values, welcomeMessage: values.welcomeMessage.trim() });
      toaster.show({ type: 'success', title: t('projectSettings.saved') });
    } catch (caught: unknown) {
      setError(caught); // keep the input
    }
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projectSettings.defaults.title')}</CardTitle>
        <CardDescription>
          {t('projectSettings.defaults.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FeedbackForm
          id='project-defaults'
          values={form.getValues}
          savedValues={saved}
          submitting={submitting}
          error={error}
          errorContent={error ? <RequestError error={error} /> : undefined}
          onSubmit={submit}
        >
          <fieldset disabled={!editable || submitting}>
            <FieldGroup>
              <Controller
                control={form.control}
                name='defaultView'
                render={({ field }) => (
                  <FieldSet>
                    <FieldLegend variant='label'>
                      {t('projectSettings.defaultView')}
                    </FieldLegend>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      {(['list', 'board'] as const).map((view) => (
                        <Field key={view} orientation='horizontal'>
                          <RadioGroupItem
                            id={`project-view-${view}`}
                            value={view}
                          />
                          <FieldLabel htmlFor={`project-view-${view}`}>
                            {t(`projectSettings.view.${view}`)}
                          </FieldLabel>
                        </Field>
                      ))}
                    </RadioGroup>
                  </FieldSet>
                )}
              />
              <Field>
                <FieldLabel htmlFor='project-welcome'>
                  {t('projectSettings.welcomeMessage')}
                </FieldLabel>
                <Textarea
                  id='project-welcome'
                  rows={3}
                  {...form.register('welcomeMessage')}
                />
              </Field>
              <Controller
                control={form.control}
                name='notifyOwners'
                render={({ field }) => (
                  <Field orientation='horizontal'>
                    <Checkbox
                      id='project-notify'
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel htmlFor='project-notify'>
                      {t('projectSettings.notifyOwners')}
                    </FieldLabel>
                  </Field>
                )}
              />
            </FieldGroup>
          </fieldset>
        </FeedbackForm>
      </CardContent>
      {editable ? (
        <CardFooter className='justify-end'>
          <Button type='submit' form='project-defaults' disabled={submitting}>
            {submitting ? <Spinner data-icon='inline-start' /> : null}
            {t(submitting ? 'projectSettings.saving' : 'projectSettings.save')}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}
```

- **Read-only** is the same cards with their controls disabled and no Save; a user without `update` never sees a control that fails on use.
- **Keyed by its stored values**: after its save, or a change to its fields announced elsewhere, `DefaultsCard` remounts with the new values as its saved ones; the toggle's save leaves it alone.
- **Array fields** (a list of emails, of steps) follow ["Array fields" in `form.md`](../form.md#array-fields) inside the same kind of card.
