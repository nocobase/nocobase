/**
 * An environment's driver settings as a form, rendered from the driver's form description (`driver-forms/`): its main
 * groups in order, its advanced groups collapsed under "Advanced settings", credentials as write-only inputs that say
 * whether one is set and never show it, and read-only facts of the application's configuration. Words come from the
 * description's namespace; the form's own words (buttons, errors) from this plugin's.
 *
 * `JsonSettings` is the fallback for a driver without a description: the settings and credentials as JSON.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronRightIcon } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import {
  getPath,
  isFieldShown,
  matches,
  pathTarget,
  type DriverFormState,
  type SecretInput,
} from '../driver-forms/mapping.js';
import type {
  DriverFormDescription,
  DriverFormField,
  DriverFormGroup,
} from '../driver-forms/types.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import { Checkbox } from './ui/checkbox.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible.js';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import { Textarea } from './ui/textarea.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface DriverSettingsProps {
  readonly form: DriverFormDescription;
  readonly state: DriverFormState;
  readonly onChange: (state: DriverFormState) => void;
  /** Names of the stored credentials. */
  readonly secretKeys: readonly string[];
  readonly facts: Readonly<Record<string, unknown>> | null;
  /** Error keys (`ui.driverForm.errors.*`) by field ID, after a save was refused. */
  readonly errors: Readonly<Record<string, string>>;
  /** `main` renders the groups that are not advanced, `advanced` the collapsed rest. */
  readonly part: 'main' | 'advanced';
  /** The driver's variants the application offers (`DriverSummary.variants`), for a choice of them. */
  readonly variants?: readonly string[] | null;
}

export function DriverSettings(
  props: DriverSettingsProps,
): ReactElement | null {
  const { form, state, part } = props;
  const { t: tDriver } = useTranslation(form.ns);
  const { t: tOwn } = useTranslation(ACCESS_NAMESPACE);
  const td = tDriver as unknown as Translate;
  const t = tOwn as unknown as Translate;
  const groups = form.groups.filter(
    (group) =>
      Boolean(group.advanced) === (part === 'advanced') &&
      matches(group.visibleWhen, state.values) &&
      // A group without fields only explains something, such as how a run mode connects.
      (group.toggle ||
        group.fields.length === 0 ||
        group.fields.some((field) => isFieldShown(group, field, state))),
  );
  if (groups.length === 0) return null;
  if (part === 'main')
    return (
      <>
        {groups.map((group) => (
          <GroupFields key={group.id} {...props} group={group} td={td} t={t} />
        ))}
      </>
    );
  return (
    <section className='flex flex-col gap-2' data-slot='driver-advanced'>
      <h3 className='text-sm font-medium'>{t('ui.driverForm.advanced')}</h3>
      <p className='text-sm text-muted-foreground'>
        {t('ui.driverForm.advancedHint')}
      </p>
      <div className='divide-y rounded-lg border'>
        {groups.map((group) => (
          <Collapsible key={group.id}>
            <CollapsibleTrigger className='group/trigger flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50'>
              <ChevronRightIcon className='size-4 shrink-0 text-muted-foreground transition-transform group-data-[panel-open]/trigger:rotate-90' />
              <span className='flex-1'>{td(group.title)}</span>
              {group.toggle ? (
                <Badge
                  variant={state.toggles[group.id] ? 'secondary' : 'outline'}
                >
                  {state.toggles[group.id]
                    ? t('ui.driverForm.on')
                    : t('ui.driverForm.off')}
                </Badge>
              ) : null}
            </CollapsibleTrigger>
            <CollapsibleContent className='px-3 pt-1 pb-4'>
              <GroupFields {...props} group={group} td={td} t={t} bare />
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </section>
  );
}

function GroupFields({
  group,
  state,
  onChange,
  secretKeys,
  facts,
  errors,
  variants,
  td,
  t,
  bare = false,
}: DriverSettingsProps & {
  readonly group: DriverFormGroup;
  readonly td: Translate;
  readonly t: Translate;
  readonly bare?: boolean;
}): ReactElement {
  const fields = group.fields.filter((field) =>
    isFieldShown(group, field, state),
  );
  const toggleId = `rel-driver-${group.id}-enabled`;
  const body = (
    <FieldGroup className='gap-4'>
      {group.description && bare ? (
        <FieldDescription>{td(group.description)}</FieldDescription>
      ) : null}
      {group.toggle ? (
        <Field orientation='horizontal'>
          <Checkbox
            id={toggleId}
            checked={state.toggles[group.id] === true}
            onCheckedChange={(checked) =>
              onChange({
                ...state,
                toggles: { ...state.toggles, [group.id]: checked === true },
              })
            }
          />
          <FieldContent>
            <FieldLabel htmlFor={toggleId}>{td(group.toggle.label)}</FieldLabel>
            {group.toggle.hint ? (
              <FieldDescription>{td(group.toggle.hint)}</FieldDescription>
            ) : null}
          </FieldContent>
        </Field>
      ) : null}
      {fields.length > 0 ? (
        <div className='grid gap-4 sm:grid-cols-2'>
          {fields.map((field) => (
            <FormField
              key={field.id}
              field={field}
              state={state}
              onChange={onChange}
              stored={
                field.type === 'secret' &&
                secretKeys.includes(pathTarget(field.path).key)
              }
              fact={
                field.type === 'fact' && facts
                  ? getPath(facts, pathTarget(field.path).key)
                  : undefined
              }
              variants={variants}
              error={errors[field.id]}
              td={td}
              t={t}
            />
          ))}
        </div>
      ) : null}
    </FieldGroup>
  );
  if (bare) return body;
  return (
    <FieldSet data-slot='driver-group' data-group={group.id}>
      <FieldLegend>{td(group.title)}</FieldLegend>
      {group.description ? (
        <FieldDescription>{td(group.description)}</FieldDescription>
      ) : null}
      {body}
    </FieldSet>
  );
}

/** Whether a field takes the whole row: radio cards, text areas and facts. */
function isWide(field: DriverFormField): boolean {
  return (
    field.wide === true ||
    (field.type === 'choice' && field.display === 'radio') ||
    (field.type === 'text' && field.multiline === true) ||
    field.type === 'list' ||
    field.type === 'map' ||
    field.type === 'command' ||
    (field.type === 'secret' &&
      field.format !== undefined &&
      field.format !== 'text') ||
    field.type === 'fact'
  );
}

function FormField({
  field,
  state,
  onChange,
  stored,
  fact,
  error,
  variants,
  td,
  t,
}: {
  readonly field: DriverFormField;
  readonly state: DriverFormState;
  readonly onChange: (state: DriverFormState) => void;
  readonly stored: boolean;
  readonly fact: unknown;
  readonly error: string | undefined;
  readonly variants?: readonly string[] | null | undefined;
  readonly td: Translate;
  readonly t: Translate;
}): ReactElement {
  const id = `rel-driver-${field.id}`;
  const value = state.values[field.id];
  const set = (next: string | boolean): void =>
    onChange({ ...state, values: { ...state.values, [field.id]: next } });
  const wide = isWide(field) ? 'sm:col-span-2' : undefined;
  const invalid = error ? true : undefined;
  const mono = field.mono ? 'font-mono' : undefined;
  const hint = (extra?: ReactNode): ReactElement | null =>
    error || field.hint || extra ? (
      <FieldDescription className={error ? 'text-destructive' : undefined}>
        {error
          ? t(`ui.driverForm.errors.${error}`)
          : field.hint
            ? td(field.hint)
            : null}
        {extra}
      </FieldDescription>
    ) : null;

  switch (field.type) {
    case 'switch':
      return (
        <Field orientation='horizontal' className='sm:col-span-2'>
          <Checkbox
            id={id}
            checked={value === true}
            onCheckedChange={(checked) => set(checked === true)}
          />
          <FieldContent>
            <FieldLabel htmlFor={id}>{td(field.label)}</FieldLabel>
            {hint()}
          </FieldContent>
        </Field>
      );
    case 'choice': {
      // A choice of the driver's variants shows only those the application offers.
      const options =
        field.variants && variants
          ? field.options.filter((option) => variants.includes(option.value))
          : field.options;
      if (field.display === 'radio')
        return (
          <Field className={wide} data-invalid={invalid}>
            <FieldLabel>{td(field.label)}</FieldLabel>
            <RadioGroup
              value={String(value ?? field.default)}
              onValueChange={(next) => set(String(next))}
              aria-label={td(field.label)}
              className='sm:grid-cols-2'
            >
              {options.map((option) => {
                const optionId = `${id}-${option.value}`;
                return (
                  <FieldLabel
                    key={option.value}
                    htmlFor={optionId}
                    className='cursor-pointer rounded-lg border p-3 has-data-checked:border-primary has-data-checked:bg-primary/5'
                  >
                    <Field orientation='horizontal' className='items-start'>
                      <RadioGroupItem
                        id={optionId}
                        value={option.value}
                        className='mt-0.5'
                      />
                      <FieldContent>
                        <span className='font-medium'>{td(option.label)}</span>
                        {option.hint ? (
                          <span className='text-xs leading-normal font-normal text-muted-foreground'>
                            {td(option.hint)}
                          </span>
                        ) : null}
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                );
              })}
            </RadioGroup>
            {hint()}
          </Field>
        );
      return (
        <Field className={wide} data-invalid={invalid}>
          <FieldLabel htmlFor={id}>{td(field.label)}</FieldLabel>
          <Select
            items={options.map((option) => ({
              value: option.value,
              label: td(option.label),
            }))}
            value={String(value ?? field.default)}
            onValueChange={(next: string | null) => set(next ?? field.default)}
          >
            <SelectTrigger id={id} className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {td(option.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hint()}
        </Field>
      );
    }
    case 'number':
      return (
        <Field className={wide} data-invalid={invalid}>
          <FieldLabel htmlFor={id}>{td(field.label)}</FieldLabel>
          <div className='flex items-center gap-2'>
            <Input
              id={id}
              type='number'
              inputMode='decimal'
              min={field.min}
              max={field.max}
              step={field.integer ? 1 : 'any'}
              placeholder={field.placeholder ?? t('ui.driverForm.noLimit')}
              aria-invalid={invalid}
              value={String(value ?? '')}
              onChange={(event) => set(event.target.value)}
            />
            {field.unit ? (
              <span className='shrink-0 text-sm text-muted-foreground'>
                {td(field.unit)}
              </span>
            ) : null}
          </div>
          {hint()}
        </Field>
      );
    case 'secret':
      return (
        <SecretField
          id={id}
          field={field}
          input={state.secrets[field.id] ?? { mode: 'keep', value: '' }}
          stored={stored}
          onChange={(input) =>
            onChange({
              ...state,
              secrets: { ...state.secrets, [field.id]: input },
            })
          }
          className={wide}
          invalid={invalid}
          hint={hint}
          td={td}
          t={t}
        />
      );
    case 'fact':
      return (
        <Field className={wide}>
          <FieldLabel>{td(field.label)}</FieldLabel>
          <FactValue
            value={fact}
            empty={field.empty ? td(field.empty) : '—'}
            emptyList={field.emptyList ? td(field.emptyList) : undefined}
          />
          {hint()}
        </Field>
      );
    default: {
      const multiline = field.type !== 'text' || field.multiline === true;
      return (
        <Field className={wide} data-invalid={invalid}>
          <FieldLabel htmlFor={id}>
            {td(field.label)}
            {field.required ? (
              <span className='text-destructive' aria-hidden>
                *
              </span>
            ) : null}
          </FieldLabel>
          {multiline ? (
            <Textarea
              id={id}
              rows={field.type === 'text' ? 6 : 3}
              className={mono ? `${mono} text-xs` : undefined}
              placeholder={field.placeholder}
              aria-invalid={invalid}
              value={String(value ?? '')}
              onChange={(event) => set(event.target.value)}
            />
          ) : (
            <Input
              id={id}
              className={mono}
              placeholder={field.placeholder}
              aria-invalid={invalid}
              value={String(value ?? '')}
              onChange={(event) => set(event.target.value)}
            />
          )}
          {hint()}
        </Field>
      );
    }
  }
}

/**
 * A write-only credential. Stored: "Set" with Replace and Clear, never the value. Replacing or new: an input that is
 * sent only when filled.
 */
function SecretField({
  id,
  field,
  input,
  stored,
  onChange,
  className,
  invalid,
  hint,
  td,
  t,
}: {
  readonly id: string;
  readonly field: Extract<DriverFormField, { type: 'secret' }>;
  readonly input: SecretInput;
  readonly stored: boolean;
  readonly onChange: (input: SecretInput) => void;
  readonly className: string | undefined;
  readonly invalid: true | undefined;
  readonly hint: (extra?: ReactNode) => ReactElement | null;
  readonly td: Translate;
  readonly t: Translate;
}): ReactElement {
  const editing = !stored || input.mode === 'replace';
  const multiline = field.format === 'multiline' || field.format === 'map';
  return (
    <Field className={className} data-invalid={invalid}>
      <FieldLabel htmlFor={editing ? id : undefined}>
        {td(field.label)}
        <span className='font-normal text-muted-foreground'>
          {t('ui.driverForm.writeOnly')}
        </span>
      </FieldLabel>
      {stored && input.mode === 'keep' ? (
        <div
          className='flex flex-wrap items-center gap-2'
          data-slot='secret-stored'
        >
          <Badge variant='secondary'>{t('ui.driverForm.secretSet')}</Badge>
          <Button
            type='button'
            size='sm'
            variant='outline'
            onClick={() => onChange({ mode: 'replace', value: '' })}
          >
            {t('ui.driverForm.replace')}
          </Button>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => onChange({ mode: 'clear', value: '' })}
          >
            {t('ui.driverForm.clear')}
          </Button>
        </div>
      ) : stored && input.mode === 'clear' ? (
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant='destructive'>
            {t('ui.driverForm.secretCleared')}
          </Badge>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => onChange({ mode: 'keep', value: '' })}
          >
            {t('ui.driverForm.undo')}
          </Button>
        </div>
      ) : (
        <div className='flex flex-col gap-2'>
          {multiline ? (
            <Textarea
              id={id}
              rows={field.format === 'map' ? 3 : 4}
              className='font-mono text-xs'
              autoComplete='off'
              spellCheck={false}
              placeholder={field.placeholder}
              aria-invalid={invalid}
              value={input.value}
              onChange={(event) =>
                onChange({ mode: 'replace', value: event.target.value })
              }
            />
          ) : (
            <Input
              id={id}
              type='password'
              autoComplete='new-password'
              placeholder={field.placeholder}
              aria-invalid={invalid}
              value={input.value}
              onChange={(event) =>
                onChange({ mode: 'replace', value: event.target.value })
              }
            />
          )}
          {stored ? (
            <Button
              type='button'
              size='sm'
              variant='ghost'
              className='self-start'
              onClick={() => onChange({ mode: 'keep', value: '' })}
            >
              {t('ui.driverForm.keepStored')}
            </Button>
          ) : null}
        </div>
      )}
      {hint()}
    </Field>
  );
}

function FactValue({
  value,
  empty,
  emptyList,
}: {
  readonly value: unknown;
  readonly empty: string;
  readonly emptyList: string | undefined;
}): ReactElement {
  if (Array.isArray(value) && value.length === 0)
    return (
      <p className='text-sm text-muted-foreground'>{emptyList ?? empty}</p>
    );
  if (value === undefined || value === null || value === '')
    return <p className='text-sm text-muted-foreground'>{empty}</p>;
  if (Array.isArray(value)) {
    // Keys from the items, counted, since a launch prefix may repeat one.
    const seen = new Map<string, number>();
    const items = value.map((item: unknown) => {
      const text = factText(item);
      const count = (seen.get(text) ?? 0) + 1;
      seen.set(text, count);
      return { text, key: `${text}#${count}` };
    });
    return (
      <p className='flex flex-wrap gap-1'>
        {items.map((item) => (
          <Badge key={item.key} variant='outline' className='font-mono'>
            {item.text}
          </Badge>
        ))}
      </p>
    );
  }
  return <p className='font-mono text-sm break-all'>{factText(value)}</p>;
}

function factText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean')
    return String(value);
  return JSON.stringify(value) ?? '';
}

/** The settings and credentials as JSON, for a driver without a form. */
export function JsonSettings({
  config,
  onConfig,
  secret,
  onSecret,
  hasSecret,
  invalid,
}: {
  readonly config: string;
  readonly onConfig: (value: string) => void;
  readonly secret: string;
  readonly onSecret: (value: string) => void;
  readonly hasSecret: boolean;
  readonly invalid: 'config' | 'secret' | null;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <FieldSet data-slot='driver-json'>
      <FieldLegend>{t('ui.driverForm.jsonTitle')}</FieldLegend>
      <FieldDescription>{t('ui.driverForm.jsonDescription')}</FieldDescription>
      <div className='grid gap-4 sm:grid-cols-2'>
        <Field data-invalid={invalid === 'config' ? true : undefined}>
          <FieldLabel htmlFor='rel-env-config'>
            {t('ui.environments.config')}
          </FieldLabel>
          <Textarea
            id='rel-env-config'
            rows={5}
            className='font-mono text-xs'
            aria-invalid={invalid === 'config' ? true : undefined}
            value={config}
            onChange={(event) => onConfig(event.target.value)}
          />
          <FieldDescription>
            {invalid === 'config'
              ? t('ui.environments.invalidJson')
              : t('ui.environments.configHint')}
          </FieldDescription>
        </Field>
        <Field data-invalid={invalid === 'secret' ? true : undefined}>
          <FieldLabel htmlFor='rel-env-secret'>
            {t('ui.environments.secret')}
          </FieldLabel>
          <Textarea
            id='rel-env-secret'
            rows={5}
            className='font-mono text-xs'
            aria-invalid={invalid === 'secret' ? true : undefined}
            placeholder={hasSecret ? t('ui.environments.secretStored') : '{}'}
            value={secret}
            onChange={(event) => onSecret(event.target.value)}
          />
          <FieldDescription>
            {invalid === 'secret'
              ? t('ui.environments.invalidJson')
              : t('ui.environments.secretHint')}
          </FieldDescription>
        </Field>
      </div>
    </FieldSet>
  );
}
