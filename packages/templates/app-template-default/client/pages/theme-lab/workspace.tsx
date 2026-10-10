import { useTranslation } from '@nocobase/i18n/client';
import { useToaster } from '@nocobase/app-client';
import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Switch } from '#components/ui/switch';
import { Button } from '#components/ui/button';
import { PreviewSelect } from './orders/shared';
import { saveWorkspace, setWorkspaceSwitch, useWorkspace } from './orders/data';
export default function WorkspacePage() {
  const { t } = useTranslation();
  const toaster = useToaster();
  const id = useId();
  const workspace = useWorkspace();
  const schema = z.object({
    business: z.string().trim().min(1, t('businessPreview.required')),
    email: z
      .string()
      .trim()
      .min(1, t('businessPreview.required'))
      .refine(
        (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        t('businessPreview.invalidEmail'),
      ),
    region: z.enum(['CN', 'US', 'SG']),
    note: z.string(),
  });
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      ...workspace.profile,
      region: workspace.profile.region as 'CN' | 'US' | 'SG',
    },
  });
  return (
    <PageContainer className='mx-auto max-w-3xl'>
      <PageHeader
        title={t('businessPreview.workspace')}
        description={t('businessPreview.workspaceHint')}
      />
      <p className='text-sm text-muted-foreground'>
        {t('businessPreview.preview')}
      </p>
      <Card>
        <CardHeader>
          <CardTitle>{t('businessPreview.profile')}</CardTitle>
          <CardDescription>{t('businessPreview.profileHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id={id}
            noValidate
            onSubmit={(event) =>
              void form.handleSubmit((values) => {
                saveWorkspace(values);
                form.reset(values);
                toaster.show({
                  type: 'success',
                  title: t('businessPreview.profileSaved'),
                });
              })(event)
            }
          >
            <FieldGroup>
              {(['business', 'email'] as const).map((name) => (
                <Controller
                  key={name}
                  name={name}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`${id}-${name}`}>
                        {t(`businessPreview.${name}`)} *
                      </FieldLabel>
                      <Input
                        {...field}
                        id={`${id}-${name}`}
                        type={name === 'email' ? 'email' : 'text'}
                        required
                        aria-invalid={fieldState.invalid}
                        aria-describedby={
                          fieldState.error ? `${id}-${name}-error` : undefined
                        }
                      />
                      <FieldError
                        id={`${id}-${name}-error`}
                        errors={[fieldState.error]}
                      />
                    </Field>
                  )}
                />
              ))}
              <Controller
                name='region'
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={`${id}-region`}>
                      {t('businessPreview.region')}
                    </FieldLabel>
                    <PreviewSelect
                      id={`${id}-region`}
                      label={t('businessPreview.region')}
                      value={field.value}
                      onChange={field.onChange}
                      options={['CN', 'US', 'SG'].map((value) => ({
                        value,
                        label: t(`businessPreview.${value}`),
                      }))}
                    />
                  </Field>
                )}
              />
              <Field>
                <FieldLabel htmlFor={`${id}-note`}>
                  {t('businessPreview.note')}
                </FieldLabel>
                <Textarea {...form.register('note')} id={`${id}-note`} />
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className='flex flex-wrap items-center justify-between gap-3'>
          <p className='text-xs text-muted-foreground'>
            {t(
              form.formState.isDirty
                ? 'businessPreview.unsaved'
                : 'businessPreview.upToDate',
            )}
          </p>
          <Button type='submit' form={id} disabled={!form.formState.isDirty}>
            {t('businessPreview.save')}
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('businessPreview.notifications')}</CardTitle>
          <CardDescription>
            {t('businessPreview.notificationsHint')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {(['emailUpdates', 'reminders'] as const).map((name) => (
              <Field key={name} orientation='horizontal'>
                <div className='flex-1'>
                  <FieldLabel htmlFor={`${id}-${name}`}>
                    {t(`businessPreview.${name}`)}
                  </FieldLabel>
                  <FieldDescription>
                    {t(`businessPreview.${name}Hint`)}
                  </FieldDescription>
                </div>
                <Switch
                  id={`${id}-${name}`}
                  checked={workspace[name]}
                  onCheckedChange={(checked) => {
                    setWorkspaceSwitch(name, checked);
                    toaster.show({
                      type: 'success',
                      title: t('businessPreview.preferenceSaved'),
                    });
                  }}
                />
              </Field>
            ))}
          </FieldGroup>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
