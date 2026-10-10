/**
 * An existing working directory's location, as its settings edit it: its kind is fixed, so a repository changes only
 * its URL (picked again through a connection, or typed) and default branch, and a directory its runner and path. A new
 * one is chosen with `CodeLocationFields` instead.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProjectDetailLabels } from '@/extensions/nocobase-project-detail/labels';
import type {
  ResourceFormErrors,
  ResourceFormValues,
  RunnerChoice,
} from '@/extensions/nocobase-project-detail/project-settings';

import type { GitConnectionChoice } from '../../../shared/git.js';
import {
  RepositoryPicker,
  type PickedRepository,
} from '../../git/repo-picker.js';

export interface WorkingDirectoryEditFieldsProps {
  readonly values: ResourceFormValues;
  readonly change: (patch: Partial<ResourceFormValues>) => void;
  readonly errors: ResourceFormErrors;
  /** The Git connections a repository may be picked through again; none leaves typing its URL. */
  readonly connections: readonly GitConnectionChoice[];
  readonly runners: {
    readonly options: readonly RunnerChoice[];
    readonly loading: boolean;
  };
  readonly labels: ProjectDetailLabels;
}

export function WorkingDirectoryEditFields(
  props: WorkingDirectoryEditFieldsProps,
): ReactElement {
  if (props.values.type === 'directory')
    return <RunnerDirectoryFields {...props} />;
  return props.connections.length > 0 && props.values.binding ? (
    <ConnectionRepositoryField {...props} />
  ) : (
    <RepositoryUrlFields {...props} />
  );
}

/** A repository picked through a connection: shown as chosen, and picked again to change it. */
function ConnectionRepositoryField({
  values,
  change,
  errors,
  connections,
  labels,
}: WorkingDirectoryEditFieldsProps): ReactElement {
  const { t } = useTranslation();
  const picked = values.binding?.fullName ?? (values.url || null);
  const onPick = (repo: PickedRepository | null) =>
    change(
      repo
        ? {
            url: repo.url,
            defaultRef: repo.defaultRef,
            binding: repo.binding,
          }
        : { url: '', defaultRef: '', binding: null },
    );
  return (
    <>
      <Field data-invalid={errors.url ? true : undefined}>
        <FieldLabel>{labels.resourceForm.url}</FieldLabel>
        <RepositoryPicker
          connections={connections}
          picked={picked}
          onPick={onPick}
        />
        {errors.url ? (
          <FieldError>{t('studioGit.picker.required')}</FieldError>
        ) : null}
      </Field>
      {picked ? (
        <DefaultRefField values={values} change={change} labels={labels} />
      ) : null}
    </>
  );
}

function DefaultRefField({
  values,
  change,
  labels,
}: Pick<
  WorkingDirectoryEditFieldsProps,
  'values' | 'change' | 'labels'
>): ReactElement {
  return (
    <Field>
      <FieldLabel htmlFor='project-resource-ref'>
        {labels.resourceForm.defaultRef}
      </FieldLabel>
      <Input
        id='project-resource-ref'
        value={values.defaultRef}
        placeholder='main'
        onChange={(event) => change({ defaultRef: event.target.value })}
      />
      <FieldDescription>{labels.resourceForm.defaultRefHint}</FieldDescription>
    </Field>
  );
}

/** The clone URL as typed. Changing it unlinks a repository picked through a connection. */
function RepositoryUrlFields({
  values,
  change,
  errors,
  labels,
}: WorkingDirectoryEditFieldsProps): ReactElement {
  const words = labels.resourceForm;
  return (
    <>
      <Field data-invalid={errors.url ? true : undefined}>
        <FieldLabel htmlFor='project-resource-url'>{words.url}</FieldLabel>
        <Input
          id='project-resource-url'
          value={values.url}
          placeholder='https://github.com/owner/repo.git'
          aria-invalid={errors.url ? true : undefined}
          onChange={(event) =>
            change({
              url: event.target.value,
              ...(values.binding ? { binding: null } : {}),
            })
          }
        />
        {errors.url ? (
          <FieldError>{errors.url}</FieldError>
        ) : (
          <FieldDescription>{words.urlHint}</FieldDescription>
        )}
      </Field>
      <DefaultRefField values={values} change={change} labels={labels} />
    </>
  );
}

/** The runner by name, with its machine and status, then the absolute path on it. */
function RunnerDirectoryFields({
  values,
  change,
  errors,
  runners,
  labels,
}: WorkingDirectoryEditFieldsProps): ReactElement {
  const words = labels.resourceForm;
  // A runner no longer listed (revoked) still shows by its id.
  const items = [
    ...runners.options,
    ...(values.runnerId &&
    !runners.options.some((option) => option.value === values.runnerId)
      ? [{ value: values.runnerId, label: values.runnerId }]
      : []),
  ];
  return (
    <>
      <Field data-invalid={errors.runnerId ? true : undefined}>
        <FieldLabel htmlFor='project-resource-runner'>
          {words.runner}
        </FieldLabel>
        <Select
          items={items}
          value={values.runnerId || null}
          onValueChange={(next: string | null) => {
            if (next) change({ runnerId: next });
          }}
        >
          <SelectTrigger
            id='project-resource-runner'
            className='w-full'
            aria-invalid={errors.runnerId ? true : undefined}
          >
            <SelectValue
              placeholder={
                runners.loading
                  ? words.loading
                  : runners.options.length === 0
                    ? words.noRunners
                    : words.runnerPlaceholder
              }
            />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                <span className='flex min-w-0 flex-col'>
                  <span>{item.label}</span>
                  {'description' in item && item.description ? (
                    <span className='text-xs text-muted-foreground'>
                      {item.description}
                    </span>
                  ) : null}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.runnerId ? (
          <FieldError>{errors.runnerId}</FieldError>
        ) : (
          <FieldDescription>{words.runnerHint}</FieldDescription>
        )}
      </Field>
      <Field data-invalid={errors.path ? true : undefined}>
        <FieldLabel htmlFor='project-resource-path'>{words.path}</FieldLabel>
        <Input
          id='project-resource-path'
          value={values.path}
          disabled={!values.runnerId}
          placeholder='/srv/app'
          className='font-mono'
          aria-invalid={errors.path ? true : undefined}
          onChange={(event) => change({ path: event.target.value })}
        />
        {errors.path ? (
          <FieldError>{errors.path}</FieldError>
        ) : (
          <FieldDescription>{words.pathHint}</FieldDescription>
        )}
      </Field>
    </>
  );
}
