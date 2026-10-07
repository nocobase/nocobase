/**
 * An environment's settings form: in a dialog when adding one (choosing its driver first), and on the environment's
 * Settings tab when editing it. Credentials are write-only (never shown again); the deployment policy names its
 * approvers through the application's people picker (`components/people-picker.tsx`). Image registries have no page
 * of their own: a Docker environment picks, adds or edits one here. Outcomes are toasts.
 */
import { useTranslation } from '@nocobase/i18n/client';
import {
  useState,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type {
  DriverSummary,
  EnvironmentCheckResult,
  EnvironmentInput,
  EnvironmentRecord,
  RegistryRecord,
} from '../../shared/releases.js';
import {
  decodeDriverForm,
  encodeDriverForm,
  type DriverFormState,
} from '../driver-forms/mapping.js';
import type {
  DriverFormDescription,
  DriverFormRegistry,
} from '../driver-forms/types.js';
import { useConnectionCheck } from '../hooks/use-connection-check.js';
import { useDriverForms } from '../hooks/use-driver-forms.js';
import { useNotify } from '../hooks/use-notify.js';
import { useRegistries } from '../hooks/use-registries.js';
import { useReleasesApi } from '../hooks/use-releases.js';
import { registryIdentity, registryInput } from '../lib/registry-draft.js';
import { cn } from 'cn';
import {
  ConnectionCheckButton,
  ConnectionCheckResult,
} from './connection-check.js';
import { DriverSettings, JsonSettings } from './driver-settings.js';
import { ImageSourceFields, type ImageSource } from './image-source-fields.js';
import { PeoplePicker } from './people-picker.js';
import { Button } from './ui/button.js';
import { Checkbox } from './ui/checkbox.js';
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from './ui/field.js';
import { Input } from './ui/input.js';
import { RadioGroup, RadioGroupItem } from './ui/radio-group.js';
import { Spinner } from './ui/spinner.js';

/** A JSON object typed in a textarea, or why it is not one. */
function parseObject(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text || '{}');
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Whether the driver's form has the public URL pattern itself; otherwise it is asked with the name. */
function formHasPublicUrl(form: DriverFormDescription | undefined): boolean {
  return Boolean(
    form?.groups.some((group) =>
      group.fields.some((field) => field.path === 'environment.publicUrl'),
    ),
  );
}

/** What the driver part of the dialog produces: settings, credential changes and the URL pattern. */
interface DriverPayload {
  readonly config: Record<string, unknown>;
  readonly secret?: Record<string, unknown>;
  readonly secretChanges?: Record<string, unknown>;
  readonly publicUrl?: string | null;
}

/** In a dialog the form scrolls between the dialog's header and footer. */
const DIALOG_BODY_CLASS =
  '-mx-4 min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-1';

/**
 * Adding an environment starts by choosing its driver, each with its title and one line on what it does; then its
 * name, the driver's form (or JSON for a driver without one) and the deployment policy. Editing skips the choice: an
 * environment keeps its driver. In a dialog it has the dialog's header and footer; on a page (`layout: 'page'`) the
 * page names it, and the footer discards changes instead of cancelling.
 */
export function EnvironmentForm({
  environment,
  drivers,
  driverName,
  onDone,
  onCancel,
  layout = 'dialog',
}: {
  readonly environment: EnvironmentRecord | undefined;
  readonly drivers: readonly DriverSummary[];
  readonly driverName: (kind: string) => string;
  readonly onDone: () => void;
  /** Closes the dialog, or on a page starts the form again from what is saved. */
  readonly onCancel: () => void;
  readonly layout?: 'dialog' | 'page';
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useReleasesApi();
  const notify = useNotify();
  const forms = useDriverForms();
  // With one driver there is nothing to choose: its form (the Host driver's run mode) opens at once.
  const [step, setStep] = useState<'driver' | 'settings'>(
    environment || drivers.length === 1 ? 'settings' : 'driver',
  );
  const [id, setId] = useState(environment?.id ?? '');
  const [name, setName] = useState(environment?.name ?? '');
  const [driver, setDriver] = useState<string | null>(
    environment?.driver ?? drivers[0]?.kind ?? null,
  );
  const form = driver ? forms.get(driver) : undefined;
  const summary = drivers.find((item) => item.kind === driver);
  const [driverState, setDriverState] = useState<DriverFormState | null>(() =>
    form
      ? decodeDriverForm(form, {
          config: environment?.config ?? {},
          secretKeys: environment?.secretKeys ?? [],
          publicUrl: environment?.publicUrl ?? null,
        })
      : null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [config, setConfig] = useState(
    JSON.stringify(environment?.config ?? {}, null, 2),
  );
  const [secret, setSecret] = useState('');
  const [publicUrl, setPublicUrl] = useState(environment?.publicUrl ?? '');
  const [isProtected, setIsProtected] = useState(
    environment?.protected ?? false,
  );
  const [approvers, setApprovers] = useState<readonly string[]>(
    environment?.approvers ?? [],
  );
  const [sampleData, setSampleData] = useState(
    environment?.sampleDataOnFirstDeploy ?? false,
  );
  // Limits and the runtime policy of the Apps created here without their own (empty: none).
  const [appLimits, setAppLimits] = useState(() => ({
    maxApps: numberText(environment?.maxApps),
    idle: numberText(environment?.defaultIdleStopMinutes),
    dormant: numberText(environment?.defaultDormantAfterHours),
  }));
  const [saving, setSaving] = useState(false);
  const [invalid, setInvalid] = useState<'config' | 'secret' | null>(null);
  const connection = useConnectionCheck();
  // Where release images come from, for a driver that runs images with the settings chosen (the Docker run mode).
  // An environment keeps its variant (the Host driver's run mode): editing offers only the one it has.
  const savedVariant =
    environment && summary?.variants
      ? environment.config[summary.variants.key]
      : undefined;
  const variants = summary?.variants
    ? typeof savedVariant === 'string'
      ? [savedVariant]
      : Object.keys(summary.variants.capabilities)
    : null;
  const variant =
    summary?.variants && driverState
      ? driverState.values[summary.variants.key]
      : undefined;
  const runsImages =
    (typeof variant === 'string'
      ? summary?.variants?.capabilities[variant]?.images
      : summary?.capabilities.images) === true;
  const registries = useRegistries(runsImages);
  const [imageSource, setImageSource] = useState<ImageSource>({
    registryId: environment?.registryId ?? null,
  });

  const chooseDriver = (kind: string): void => {
    setDriver(kind);
    const next = forms.get(kind);
    setDriverState(
      next ? decodeDriverForm(next, { config: {}, publicUrl: null }) : null,
    );
    setFieldErrors({});
    connection.reset();
  };

  /** The driver part as the API takes it, or null after marking what is wrong. */
  const driverPayload = (): DriverPayload | null => {
    if (form && driverState) {
      const output = encodeDriverForm(
        form,
        driverState,
        environment?.config ?? {},
      );
      setFieldErrors(output.errors);
      if (Object.keys(output.errors).length > 0) return null;
      return {
        config: output.config,
        ...(Object.keys(output.secretChanges).length > 0
          ? { secretChanges: output.secretChanges }
          : {}),
        publicUrl:
          output.publicUrl === undefined
            ? publicUrl.trim() || null
            : output.publicUrl,
      };
    }
    const parsedConfig = parseObject(config);
    if (!parsedConfig) {
      setInvalid('config');
      return null;
    }
    const parsedSecret = secret.trim() ? parseObject(secret) : undefined;
    if (parsedSecret === null) {
      setInvalid('secret');
      return null;
    }
    setInvalid(null);
    return {
      config: parsedConfig,
      ...(parsedSecret ? { secret: parsedSecret } : {}),
      publicUrl: publicUrl.trim() || null,
    };
  };

  const test = (): void => {
    const payload = driverPayload();
    if (!payload || !driver) return;
    void connection.run(() =>
      api.send<EnvironmentCheckResult>('POST', 'environments/check', {
        ...payload,
        ...(environment ? { id: environment.id } : {}),
        name: name.trim(),
        driver,
      }),
    );
  };

  const submit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    const payload = driverPayload();
    if (!payload) return;
    setSaving(true);
    try {
      let registryId = 'draft' in imageSource ? null : imageSource.registryId;
      // A new or edited registry is saved first; the environment then pulls from it, and a retry reuses it.
      if (runsImages && !('draft' in imageSource) && imageSource.edit) {
        const stored = registries.data?.find((item) => item.id === registryId);
        if (stored) {
          await api.send(
            'PATCH',
            `registries/${stored.id}`,
            registryInput(imageSource.edit, stored.name),
          );
          setImageSource({ registryId: stored.id });
          registries.reload();
        }
      }
      if (runsImages && 'draft' in imageSource) {
        const identity = registryIdentity(
          imageSource.draft,
          (registries.data ?? []).map((item) => item.id),
        );
        await api.send<RegistryRecord>('POST', 'registries', {
          ...registryInput(imageSource.draft, identity.name),
          id: identity.id,
        });
        registryId = identity.id;
        setImageSource({ registryId });
        registries.reload();
      }
      const input: EnvironmentInput = {
        name: name.trim(),
        ...payload,
        protected: isProtected,
        approvers,
        maxApps: numberOrNull(appLimits.maxApps),
        defaultIdleStopMinutes: numberOrNull(appLimits.idle),
        defaultDormantAfterHours: numberOrNull(appLimits.dormant),
        sampleDataOnFirstDeploy: sampleData,
        ...(runsImages ? { registryId } : {}),
      };
      if (environment)
        await api.send('PATCH', `environments/${environment.id}`, input);
      else
        await api.send('POST', 'environments', {
          ...input,
          id: id.trim(),
          driver,
        });
      notify.success(
        t(environment ? 'ui.environments.saved' : 'ui.environments.added', {
          name: name.trim(),
        }),
      );
      onDone();
    } catch (reason) {
      notify.error(reason);
    } finally {
      setSaving(false);
    }
  };

  const check = (
    fieldId: string,
    label: string,
    hint: string,
    value: boolean,
    set: (value: boolean) => void,
  ): ReactElement => (
    <Field orientation='horizontal'>
      <Checkbox
        id={fieldId}
        checked={value}
        onCheckedChange={(checked) => set(checked === true)}
      />
      <FieldContent>
        <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
        <FieldDescription>{hint}</FieldDescription>
      </FieldContent>
    </Field>
  );

  if (step === 'driver')
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t('ui.environments.add')}</DialogTitle>
          <DialogDescription>
            {t('ui.environments.pickDriver')}
          </DialogDescription>
        </DialogHeader>
        <div className={DIALOG_BODY_CLASS}>
          <DriverPicker
            drivers={drivers}
            forms={forms}
            value={driver}
            driverName={driverName}
            onChange={chooseDriver}
          />
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={onCancel}>
            {t('ui.environments.cancel')}
          </Button>
          <Button disabled={!driver} onClick={() => setStep('settings')}>
            {t('ui.environments.next')}
          </Button>
        </DialogFooter>
      </>
    );

  const showPublicUrl = !formHasPublicUrl(form);
  const inDialog = layout === 'dialog';
  const Footer = inDialog ? DialogFooter : PageFormFooter;
  return (
    <>
      {inDialog ? (
        <DialogHeader>
          <DialogTitle>
            {environment
              ? t('ui.environments.editTitle', { name: environment.name })
              : drivers.length > 1
                ? t('ui.environments.addWith', {
                    driver: driver ? driverName(driver) : '',
                  })
                : t('ui.environments.add')}
          </DialogTitle>
          <DialogDescription>
            {t('ui.environments.formDescription')}
          </DialogDescription>
        </DialogHeader>
      ) : null}
      <form
        id='rel-environment'
        className={inDialog ? DIALOG_BODY_CLASS : 'min-w-0'}
        onSubmit={(event) => void submit(event)}
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>{t('ui.environments.basics')}</FieldLegend>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field>
                <FieldLabel htmlFor='rel-env-name'>
                  {t('ui.environments.name')}
                </FieldLabel>
                <Input
                  id='rel-env-name'
                  value={name}
                  required
                  autoFocus
                  placeholder={t('ui.environments.namePlaceholder')}
                  onChange={(event) => setName(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='rel-env-id'>
                  {t('ui.environments.id')}
                </FieldLabel>
                <Input
                  id='rel-env-id'
                  value={id}
                  required
                  className='font-mono'
                  placeholder='staging'
                  disabled={Boolean(environment)}
                  onChange={(event) => setId(event.target.value)}
                />
                <FieldDescription>
                  {t('ui.environments.idHint')}
                </FieldDescription>
              </Field>
              {drivers.length > 1 ? (
                <Field>
                  <FieldLabel>{t('ui.environments.driver')}</FieldLabel>
                  <div className='flex min-h-8 items-center gap-2 text-sm'>
                    <span className='font-medium'>
                      {driver ? driverName(driver) : '—'}
                    </span>
                    {!environment ? (
                      <Button
                        type='button'
                        size='sm'
                        variant='link'
                        className='px-0'
                        onClick={() => setStep('driver')}
                      >
                        {t('ui.environments.changeDriver')}
                      </Button>
                    ) : null}
                  </div>
                </Field>
              ) : null}
              {showPublicUrl ? (
                <Field>
                  <FieldLabel htmlFor='rel-env-url'>
                    {t('ui.environments.publicUrl')}
                  </FieldLabel>
                  <Input
                    id='rel-env-url'
                    value={publicUrl}
                    className='font-mono'
                    placeholder='https://preview.example.com/{appId}/'
                    onChange={(event) => setPublicUrl(event.target.value)}
                  />
                </Field>
              ) : null}
            </div>
          </FieldSet>
          {form && driverState ? (
            <DriverSettings
              part='main'
              form={form}
              state={driverState}
              onChange={(next) => {
                setDriverState(next);
                connection.reset();
              }}
              secretKeys={environment?.secretKeys ?? []}
              facts={summary?.facts ?? null}
              errors={fieldErrors}
              variants={variants}
            />
          ) : (
            <JsonSettings
              config={config}
              onConfig={setConfig}
              secret={secret}
              onSecret={setSecret}
              hasSecret={environment?.hasSecret ?? false}
              invalid={invalid}
            />
          )}
          <FieldSet>
            <FieldLegend>{t('ui.environments.policy')}</FieldLegend>
            <FieldDescription>
              {t('ui.environments.policyDescription')}
            </FieldDescription>
            <FieldGroup className='gap-3'>
              {check(
                'rel-env-protected',
                t('ui.environments.protected'),
                t('ui.environments.protectedHint'),
                isProtected,
                setIsProtected,
              )}
              {isProtected ? (
                <Field className='pl-6'>
                  <FieldLabel htmlFor='rel-env-approvers'>
                    {t('ui.environments.approvers')}
                  </FieldLabel>
                  <PeoplePicker
                    id='rel-env-approvers'
                    value={approvers}
                    placeholder={t('ui.environments.approversPlaceholder')}
                    onChange={setApprovers}
                  />
                  <FieldDescription>
                    {t('ui.environments.approversHint')}
                  </FieldDescription>
                </Field>
              ) : null}
            </FieldGroup>
          </FieldSet>
          <FieldSet>
            <FieldLegend>{t('ui.environments.appDefaults')}</FieldLegend>
            <FieldDescription>
              {t('ui.environments.appDefaultsDescription')}
            </FieldDescription>
            <div className='grid gap-3 sm:grid-cols-3'>
              {(
                [
                  ['maxApps', 'rel-env-max-apps', 'ui.environments.maxApps'],
                  ['idle', 'rel-env-idle', 'ui.environments.defaultIdle'],
                  [
                    'dormant',
                    'rel-env-dormant',
                    'ui.environments.defaultDormant',
                  ],
                ] as const
              ).map(([key, htmlId, label]) => (
                <Field key={key}>
                  <FieldLabel htmlFor={htmlId}>{t(label)}</FieldLabel>
                  <Input
                    id={htmlId}
                    type='number'
                    min={key === 'dormant' ? 0 : 1}
                    step={key === 'dormant' ? 'any' : 1}
                    value={appLimits[key]}
                    onChange={(event) =>
                      setAppLimits((previous) => ({
                        ...previous,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </Field>
              ))}
            </div>
            {check(
              'rel-env-sample-data',
              t('ui.environments.sampleData'),
              t('ui.environments.sampleDataHint'),
              sampleData,
              setSampleData,
            )}
          </FieldSet>
          {runsImages ? (
            <ImageSourceFields
              registries={registries.data ?? []}
              value={imageSource}
              onChange={setImageSource}
            />
          ) : null}
          {form && driverState ? (
            <DriverSettings
              part='advanced'
              form={form}
              state={driverState}
              onChange={(next) => {
                setDriverState(next);
                connection.reset();
              }}
              secretKeys={environment?.secretKeys ?? []}
              facts={summary?.facts ?? null}
              errors={fieldErrors}
              variants={variants}
            />
          ) : null}
          {Object.keys(fieldErrors).length > 0 ? (
            <p role='alert' className='text-sm text-destructive'>
              {t('ui.driverForm.fixErrors')}
            </p>
          ) : null}
          <ConnectionCheckResult outcome={connection.outcome} form={form} />
        </FieldGroup>
      </form>
      <Footer className='sm:justify-between'>
        <ConnectionCheckButton
          outcome={connection.outcome}
          disabled={saving || !driver}
          onClick={test}
        />
        <div className='flex flex-col-reverse gap-2 sm:flex-row'>
          <Button variant='outline' disabled={saving} onClick={onCancel}>
            {inDialog
              ? t('ui.environments.cancel')
              : t('ui.environments.discard')}
          </Button>
          <Button
            type='submit'
            form='rel-environment'
            disabled={saving || !name.trim() || !id.trim() || !driver}
          >
            {saving ? <Spinner data-icon='inline-start' /> : null}
            {t('ui.environments.save')}
          </Button>
        </div>
      </Footer>
    </>
  );
}

/** The footer of the form on a page: under a rule, the connection test on the left and the buttons on the right. */
function PageFormFooter({
  className,
  children,
}: {
  readonly className?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** The drivers as cards: their title and what each does, in the driver's own words. */
function DriverPicker({
  drivers,
  forms,
  value,
  driverName,
  onChange,
}: {
  readonly drivers: readonly DriverSummary[];
  readonly forms: DriverFormRegistry;
  readonly value: string | null;
  readonly driverName: (kind: string) => string;
  readonly onChange: (kind: string) => void;
}): ReactElement {
  const namespaces = [
    ...new Set([
      ACCESS_NAMESPACE,
      ...drivers.map((item) => forms.get(item.kind)?.ns ?? item.title.ns),
    ]),
  ];
  const { t } = useTranslation(namespaces);
  return (
    <RadioGroup
      value={value ?? ''}
      onValueChange={(next) => onChange(String(next))}
      aria-label={t('ui.environments.driver', { ns: ACCESS_NAMESPACE })}
      data-slot='driver-picker'
    >
      {drivers.map((item) => {
        const form = forms.get(item.kind);
        const optionId = `rel-env-driver-${item.kind}`;
        return (
          <FieldLabel
            key={item.kind}
            htmlFor={optionId}
            className='cursor-pointer rounded-lg border p-4 has-data-checked:border-primary has-data-checked:bg-primary/5'
          >
            <Field orientation='horizontal' className='items-start'>
              <RadioGroupItem
                id={optionId}
                value={item.kind}
                className='mt-0.5'
              />
              <FieldContent>
                <span className='font-medium'>{driverName(item.kind)}</span>
                <span className='text-sm font-normal text-muted-foreground'>
                  {form
                    ? t(form.description, { ns: form.ns })
                    : t('ui.environments.noForm', {
                        ns: ACCESS_NAMESPACE,
                        kind: item.kind,
                      })}
                </span>
              </FieldContent>
            </Field>
          </FieldLabel>
        );
      })}
    </RadioGroup>
  );
}

/** A stored number as a form value; empty for none. */
function numberText(value: number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}

/** A form value as the API takes it: null when empty, the number otherwise (the server checks its range). */
function numberOrNull(value: string): number | null {
  return value.trim() === '' ? null : Number(value);
}
