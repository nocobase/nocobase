# Settings page: `settings/projects/index.tsx`

Part of the [projects worked example](../example.md). **Depends on**: `RequestError` from [types](types.md); the settings route and item in ["Settings pages" in `page.md`](../page.md#5-settings-pages).

Rules: guideline T4 (one `Card` per topic, each saving on its own; a toggle applies at once, a setting that needs input applies on Save), ["Field types" in `form.md`](../form.md#field-types). The page opens with `read` on the `project-settings` item; changing anything needs `update`, checked with `useCan`, and without it the page shows the values read-only. The endpoints are `GET /api/projectSettings` and `PATCH /api/projectSettings`, both returning `{ data: ProjectSettings }`.

```tsx
// client/pages/settings/projects/index.tsx
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { FeedbackForm } from '#components/feedback-form';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Alert, AlertDescription } from '#components/ui/alert';
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
/** Every view of the settings takes a confirmed result at once ([data changes](../data-changes.md)). */
const publish = (result: Settings): void =>
  announceDataChange({ scopes: [SCOPE], results: { [SCOPE]: result } });

export default function ProjectSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const request = useListData<Settings>('projectSettings', { scopes: [SCOPE] });
  const update = useCan({
    resource: { type: 'settings', id: 'project-settings' },
    action: 'update',
  });
  const api = useApiClient();
  // Each card sends only its own fields and publishes the confirmed result itself.
  const save = (changes: Partial<ProjectSettings>): Promise<Settings> =>
    api.request<Settings>({
      path: 'projectSettings',
      method: 'PATCH',
      json: changes,
    });
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
              // One stable card: new stored values update its baseline and never remount the form.
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
  readonly save: (changes: Partial<ProjectSettings>) => Promise<Settings>;
}

/** A toggle applies at once with a toast; on failure it shows the stored value again (T4.3). */
function VisibilityCard({ settings, editable, save }: CardProps): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();
  const [pending, setPending] = useState(false);
  async function toggle(checked: boolean): Promise<void> {
    setPending(true);
    try {
      publish(await save({ publicByDefault: checked }));
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

type Defaults = Pick<
  ProjectSettings,
  'defaultView' | 'welcomeMessage' | 'notifyOwners'
>;
const defaultsOf = (settings: Defaults): Defaults => ({
  defaultView: settings.defaultView,
  welcomeMessage: settings.welcomeMessage,
  notifyOwners: settings.notifyOwners,
});
const sameDefaults = (a: Defaults, b: Defaults): boolean =>
  a.defaultView === b.defaultView &&
  a.welcomeMessage === b.welcomeMessage &&
  a.notifyOwners === b.notifyOwners;

/** Settings that need input apply on the card's own Save (T4.2). */
function DefaultsCard({ settings, editable, save }: CardProps): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();
  // What is stored for this card: the FeedbackForm's baseline, replaced by a save or a change made elsewhere.
  const [saved, setSaved] = useState(() => defaultsOf(settings));
  const form = useForm({ defaultValues: saved, shouldFocusError: false });
  const [changedElsewhere, setChangedElsewhere] = useState(false);
  const { defaultView, welcomeMessage, notifyOwners } = settings;
  useEffect(() => {
    const stored = { defaultView, welcomeMessage, notifyOwners };
    if (sameDefaults(stored, saved)) return;
    // Another view saved these settings. An untouched form shows them; typed input stays, saving replaces them,
    // and leaving still asks because the input differs from what is stored now.
    if (sameDefaults(form.getValues(), saved)) form.reset(stored);
    else setChangedElsewhere(true);
    setSaved(stored);
  }, [defaultView, welcomeMessage, notifyOwners, saved, form]);
  const [error, setError] = useState<unknown>();
  const submitting = form.formState.isSubmitting;
  const submit = form.handleSubmit(async (values) => {
    setError(undefined);
    try {
      const result = await save({
        ...values,
        welcomeMessage: values.welcomeMessage.trim(),
      });
      // The new baseline comes first, so publishing the result is not mistaken for a change made elsewhere.
      const next = defaultsOf(result.data);
      setSaved(next);
      form.reset(next);
      setChangedElsewhere(false);
      publish(result);
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
      <CardContent className='flex flex-col gap-4'>
        {changedElsewhere ? (
          <Alert>
            <AlertDescription>
              {t('projectSettings.changedElsewhere')}
            </AlertDescription>
          </Alert>
        ) : null}
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
- **One stable card, never remounted by data**: its own save makes the returned values the new baseline. A change to its fields saved elsewhere updates an untouched form; typed input stays, with the note "These settings were changed elsewhere. Saving replaces them with your input.", and leaving still asks. A toggle saved next to it never touches its input.
- **Array fields** (a list of emails, of steps) follow ["Array fields" in `form.md`](../form.md#array-fields) inside the same kind of card.
