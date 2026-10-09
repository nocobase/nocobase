# Array field card: `settings/projects/members-card.tsx`

Part of the [projects worked example](../example.md).

**Depends on**: [session alert](session-expired-alert.md), [copy](copy.md).

**Add first**: `yes n | pnpm exec shadcn add alert card field input-group`, then format the files it creates ([how](../shadcn.md#1-what-the-template-ships-and-how-to-add-the-rest)).

Rules: ["Array fields" in `form.md`](../form.md#array-fields).

```tsx
// client/pages/settings/projects/members-card.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon, PlusIcon, XIcon } from 'lucide-react';
import { type ReactElement, useMemo } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { SessionExpiredAlert } from '#components/session-expired-alert';
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
import { Field, FieldError, FieldGroup } from '#components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#components/ui/input-group';
import { Spinner } from '#components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';

const MAX_MEMBERS = 10;

export interface ProjectMembersCardProps {
  /** The latest list of member emails. */
  readonly members: readonly string[];
  /** Saves the member list (the caller calls the endpoint); throws an error on failure. */
  readonly onSave: (members: string[]) => Promise<void>;
}

export function ProjectMembersCard({
  members,
  onSave,
}: ProjectMembersCardProps): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();

  const schema = useMemo(
    () =>
      z.object({
        // useFieldArray only manages arrays of objects: each member is { email }, converted to an array of strings on submit.
        members: z
          .array(z.object({ email: z.email(t('projects.form.emailInvalid')) }))
          .min(1, t('projects.form.membersRequired'))
          .max(
            MAX_MEMBERS,
            t('projects.form.membersTooMany', { max: MAX_MEMBERS }),
          )
          // A rule on the whole array; its error is in errors.members.root.
          .refine(
            (list) =>
              new Set(list.map((member) => member.email.toLowerCase())).size ===
              list.length,
            t('projects.form.membersDuplicated'),
          ),
      }),
    [t],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      members:
        members.length > 0
          ? members.map((email) => ({ email }))
          : [{ email: '' }],
    },
  });
  const list = useFieldArray({ control: form.control, name: 'members' });
  const { isDirty, isSubmitting } = form.formState;
  const rootError = form.formState.errors.root;

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await onSave(values.members.map((member) => member.email));
    } catch (error: unknown) {
      // Without permission or a session a retry cannot succeed, so say which instead of "try again" (guideline S4).
      const status = error instanceof ApiClientError ? error.status : undefined;
      if (status === 401) {
        // The session ended. Keep the input and let the user choose to sign in again.
        form.setError('root', { type: 'sessionExpired' });
        return;
      }
      form.setError('root', {
        message:
          status === 403
            ? t('projects.error.forbidden')
            : t('projects.error.requestFailed'),
      });
      return;
    }
    // After saving, make the submitted values the new defaults: isDirty goes back to false, and "Discard changes" returns to them too.
    form.reset(values);
    toaster.show({ type: 'success', title: t('projects.members.saved') });
  });

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)}>
      <Card>
        <CardHeader>
          <CardTitle>{t('projects.members.title')}</CardTitle>
          <CardDescription>
            {t('projects.members.description', { max: MAX_MEMBERS })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {rootError?.type === 'sessionExpired' ? (
              <SessionExpiredAlert />
            ) : rootError ? (
              <Alert variant='destructive'>
                <AlertCircleIcon />
                <AlertDescription>{rootError.message}</AlertDescription>
              </Alert>
            ) : null}
            {list.fields.map((item, index) => (
              // Use item.id as the key, not index: removing an item in the middle does not shift the state of the other inputs.
              <Controller
                key={item.id}
                control={form.control}
                name={`members.${index}.email`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        type='email'
                        autoComplete='off'
                        aria-label={t('projects.form.memberEmail', {
                          index: index + 1,
                        })}
                        aria-invalid={fieldState.invalid}
                      />
                      {list.fields.length > 1 ? (
                        <InputGroupAddon align='inline-end'>
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <InputGroupButton
                                  size='icon-xs'
                                  aria-label={t('projects.form.removeMember', {
                                    index: index + 1,
                                  })}
                                  onClick={() => list.remove(index)}
                                />
                              }
                            >
                              <XIcon />
                            </TooltipTrigger>
                            <TooltipContent>
                              {t('projects.form.removeMember', {
                                index: index + 1,
                              })}
                            </TooltipContent>
                          </Tooltip>
                        </InputGroupAddon>
                      ) : null}
                    </InputGroup>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            ))}
            <div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={list.fields.length >= MAX_MEMBERS}
                onClick={() => list.append({ email: '' })}
              >
                <PlusIcon data-icon='inline-start' />
                {t('projects.form.addMember')}
              </Button>
            </div>
            <FieldError errors={[form.formState.errors.members?.root]} />
          </FieldGroup>
        </CardContent>
        {/* The buttons are inside the <form>, so no form attribute is needed; both are disabled while submitting. */}
        <CardFooter className='justify-end gap-2'>
          <Button
            type='button'
            variant='outline'
            disabled={!isDirty || isSubmitting}
            onClick={() => form.reset()}
          >
            {t('actions.discard')}
          </Button>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? <Spinner data-icon='inline-start' /> : null}
            {isSubmitting ? t('actions.saving') : t('actions.save')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
```
