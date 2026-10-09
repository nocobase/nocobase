# Every other control: `project-settings-form.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [copy](copy.md).

**Add first**: `yes n | pnpm exec shadcn add checkbox field radio-group switch textarea`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

Rules: ["Field types" in `form.md`](../form.md#field-types). These fields are not part of the `Project` type; they only demonstrate the controls. Once validation passes, the form hands the cleaned-up values to the caller.

```tsx
// client/pages/projects/project-settings-form.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Checkbox } from '#components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '#components/ui/field';
import { RadioGroup, RadioGroupItem } from '#components/ui/radio-group';
import { Switch } from '#components/ui/switch';
import { Textarea } from '#components/ui/textarea';

const PRIORITIES = ['low', 'medium', 'high'] as const;
const NOTIFY_CHANNELS = ['email', 'inApp', 'sms'] as const;
type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];

/** The values handed to the caller: already validated and shaped the way the endpoint expects. */
export interface ProjectSettings {
  readonly description: string | null;
  readonly priority: (typeof PRIORITIES)[number];
  readonly isPublic: boolean;
  readonly allowGuests: boolean;
  readonly notifyChannels: readonly NotifyChannel[];
}

export interface ProjectSettingsFormProps {
  /** When editing, pass the latest values; when omitted, the defaults are used. */
  readonly settings?: ProjectSettings;
  readonly formId: string;
  /** Called once validation passes. See ProjectForm for calling the endpoint, the submitting state and server errors. */
  readonly onSubmit: (settings: ProjectSettings) => void;
}

export function ProjectSettingsForm({
  settings,
  formId,
  onSubmit,
}: ProjectSettingsFormProps): ReactElement {
  const { t } = useTranslation();

  const schema = useMemo(
    () =>
      z.object({
        description: z
          .string()
          .trim()
          .max(500, t('projects.form.descriptionTooLong', { max: 500 })),
        priority: z.enum(PRIORITIES),
        isPublic: z.boolean(),
        allowGuests: z.boolean(),
        notifyChannels: z
          .array(z.enum(NOTIFY_CHANNELS))
          .min(1, t('projects.form.notifyChannelsRequired')),
      }),
    [t],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      description: settings?.description ?? '',
      priority: settings?.priority ?? 'medium',
      isPublic: settings?.isPublic ?? false,
      allowGuests: settings?.allowGuests ?? false,
      // An array literal is inferred as string[]; satisfies keeps the literal type of its elements.
      notifyChannels: settings
        ? [...settings.notifyChannels]
        : (['email'] satisfies NotifyChannel[]),
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({ ...values, description: values.description || null });
  });

  return (
    <form id={formId} noValidate onSubmit={(event) => void handleSubmit(event)}>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>{t('projects.form.basics')}</FieldLegend>
          <FieldGroup>
            {/* Textarea: spread field, same as Input */}
            <Controller
              control={form.control}
              name='description'
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-description`}>
                    {t('projects.fields.description')}
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={`${formId}-description`}
                    rows={4}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    {t('projects.form.descriptionHint', {
                      length: field.value.length,
                      max: 500,
                    })}
                  </FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            {/* RadioGroup: value + onValueChange, wrapped in FieldSet + FieldLegend */}
            <Controller
              control={form.control}
              name='priority'
              render={({ field, fieldState }) => (
                <FieldSet data-invalid={fieldState.invalid}>
                  <FieldLegend variant='label'>
                    {t('projects.fields.priority')}
                  </FieldLegend>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                  >
                    {PRIORITIES.map((priority) => (
                      <Field
                        key={priority}
                        orientation='horizontal'
                        data-invalid={fieldState.invalid}
                      >
                        <RadioGroupItem
                          value={priority}
                          id={`${formId}-priority-${priority}`}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldLabel
                          htmlFor={`${formId}-priority-${priority}`}
                          className='font-normal'
                        >
                          {t(`projects.priority.${priority}`)}
                        </FieldLabel>
                      </Field>
                    ))}
                  </RadioGroup>
                  <FieldError errors={[fieldState.error]} />
                </FieldSet>
              )}
            />
          </FieldGroup>
        </FieldSet>
        <FieldSeparator />
        <FieldSet>
          <FieldLegend>{t('projects.form.collaboration')}</FieldLegend>
          <FieldDescription>
            {t('projects.form.collaborationHint')}
          </FieldDescription>
          <FieldGroup>
            {/* Switch: checked + onCheckedChange, control on the right */}
            <Controller
              control={form.control}
              name='isPublic'
              render={({ field, fieldState }) => (
                <Field
                  orientation='horizontal'
                  data-invalid={fieldState.invalid}
                >
                  <FieldContent>
                    <FieldLabel htmlFor={`${formId}-public`}>
                      {t('projects.fields.isPublic')}
                    </FieldLabel>
                    <FieldDescription>
                      {t('projects.form.isPublicHint')}
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                  <Switch
                    ref={field.ref}
                    id={`${formId}-public`}
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              )}
            />
            {/* Single Checkbox: checked + onCheckedChange, control to the left of the label */}
            <Controller
              control={form.control}
              name='allowGuests'
              render={({ field, fieldState }) => (
                <Field
                  orientation='horizontal'
                  data-invalid={fieldState.invalid}
                >
                  <Checkbox
                    ref={field.ref}
                    id={`${formId}-guests`}
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                    onBlur={field.onBlur}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldLabel
                    htmlFor={`${formId}-guests`}
                    className='font-normal'
                  >
                    {t('projects.fields.allowGuests')}
                  </FieldLabel>
                </Field>
              )}
            />
            {/* Checkbox group: the value is an array; each option computes the new array and passes it to field.onChange */}
            <Controller
              control={form.control}
              name='notifyChannels'
              render={({ field, fieldState }) => (
                <FieldSet data-invalid={fieldState.invalid}>
                  <FieldLegend variant='label'>
                    {t('projects.fields.notifyChannels')}
                  </FieldLegend>
                  <FieldGroup data-slot='checkbox-group'>
                    {NOTIFY_CHANNELS.map((channel, index) => (
                      <Field
                        key={channel}
                        orientation='horizontal'
                        data-invalid={fieldState.invalid}
                      >
                        <Checkbox
                          // On error, focus moves to the first option.
                          ref={index === 0 ? field.ref : undefined}
                          id={`${formId}-notify-${channel}`}
                          checked={field.value.includes(channel)}
                          onCheckedChange={(checked) => {
                            // Rebuild the array in option order: no duplicates, no reordering.
                            field.onChange(
                              NOTIFY_CHANNELS.filter((item) =>
                                item === channel
                                  ? checked
                                  : field.value.includes(item),
                              ),
                            );
                          }}
                          onBlur={field.onBlur}
                          aria-invalid={fieldState.invalid}
                        />
                        <FieldLabel
                          htmlFor={`${formId}-notify-${channel}`}
                          className='font-normal'
                        >
                          {t(`projects.notifyChannels.${channel}`)}
                        </FieldLabel>
                      </Field>
                    ))}
                  </FieldGroup>
                  <FieldError errors={[fieldState.error]} />
                </FieldSet>
              )}
            />
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  );
}
```
