/* Rows contain controlled inputs only; positional keys preserve focus while names and dates change. */
/* eslint-disable @eslint-react/no-array-index-key */
import {
  useEffect,
  useRef,
  useId,
  useState,
  useImperativeHandle,
  type Ref,
} from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  officePeople,
  type OfficeWorkflowParameters,
  type OfficeWorkflowValues,
} from '@nocobase/app-plugin-office-flows-example/client';
import { Button } from '#components/ui/button';
import { Checkbox } from '#components/ui/checkbox';
import { Input } from '#components/ui/input';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '#components/ui/alert-dialog';

export function OfficePeoplePicker({
  label,
  value,
  update,
  busy,
}: {
  label: string;
  value: string[];
  update: (value: string[]) => void;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const id = useId();
  const candidates = search.trim()
    ? officePeople.filter(
        (person) =>
          !value.includes(person.id) &&
          `${person.name} ${person.title}`
            .toLocaleLowerCase()
            .includes(search.trim().toLocaleLowerCase()),
      )
    : [];
  const personCheckbox = (person: (typeof officePeople)[number]) => (
    <label key={person.id} className='flex items-start gap-2 text-sm'>
      <Checkbox
        disabled={busy}
        checked={value.includes(person.id)}
        onCheckedChange={(checked) => {
          document.getElementById(id)?.focus();
          update(
            checked
              ? [...value, person.id]
              : value.filter((item) => item !== person.id),
          );
        }}
      />
      <span>
        {person.name}
        <span className='block text-xs text-muted-foreground'>
          {person.title}
        </span>
      </span>
    </label>
  );
  return (
    <fieldset className='space-y-2'>
      <legend className='text-sm font-medium'>{label}</legend>
      <div className='grid gap-2 sm:grid-cols-2'>
        {officePeople
          .filter((person) => value.includes(person.id))
          .map(personCheckbox)}
      </div>
      <label htmlFor={id} className='text-xs text-muted-foreground'>
        {t('workflows.officeRules.searchPeople', { role: label })}
      </label>
      <Input
        id={id}
        value={search}
        disabled={busy}
        onChange={(event) => setSearch(event.target.value)}
      />
      {search.trim() && (
        <div className='grid max-h-60 gap-2 overflow-y-auto sm:grid-cols-2'>
          {candidates.map(personCheckbox)}
          {!candidates.length && (
            <p role='status' className='text-sm text-muted-foreground'>
              {t('workflows.officeRules.noPeople')}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}

export function OfficeParameterEditor({
  saveRef,
  disabled = false,
  configuration,
  path,
  onBusyChange,
  onDirtyChange,
  onSaved,
}: {
  disabled?: boolean;
  saveRef?: Ref<{ save: () => Promise<boolean> }>;
  configuration: OfficeWorkflowParameters;
  path: string;
  onBusyChange: (value: boolean) => void;
  onDirtyChange: (value: boolean) => void;
  onSaved?: (configuration: OfficeWorkflowParameters) => void;
}) {
  const { t } = useTranslation();
  const client = useApiClient();
  const id = useId();
  const sharedRef = useRef<HTMLDetailsElement>(null);
  const [saved, setSaved] = useState(configuration);
  const [draft, setDraft] = useState(configuration.values);
  const [organization, setOrganization] = useState(configuration.organization);
  const [busy, setBusy] = useState(false);
  const locked = busy || disabled;
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showOrganizationErrors, setShowOrganizationErrors] = useState(false);
  const departmentNames =
    organization?.departments.map((row) => row.name.trim()) ?? [];
  const invalidNames = departmentNames.map(
    (name) =>
      !name ||
      name.length > 100 ||
      departmentNames.filter((other) => other === name).length > 1,
  );
  const invalidDepartmentIndex =
    organization?.departments.findIndex(
      (row, index) => invalidNames[index] || !row.clerks.length,
    ) ?? -1;

  const [confirmation, setConfirmation] = useState<{
    message: string;
    title: string;
    action: string;
    run: () => void;
  }>();
  const organizationDirty =
    JSON.stringify(saved.organization?.departments) !==
    JSON.stringify(organization?.departments);
  const dirty =
    JSON.stringify(saved.values) !== JSON.stringify(draft) || organizationDirty;
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  const change = (values: OfficeWorkflowValues) => {
    setDraft(values);
    setSuccess(false);
  };
  const save = async (): Promise<boolean> => {
    if (disabled || busy) return false;
    if (!dirty) return true;
    if (invalidDepartmentIndex >= 0) {
      setShowOrganizationErrors(true);
      setError(t('workflows.officeRules.invalidOrganization'));
      if (sharedRef.current) {
        sharedRef.current.open = true;
        const row = sharedRef.current.querySelector(
          `[data-department-index="${invalidDepartmentIndex}"]`,
        );
        row
          ?.querySelector<HTMLInputElement>(
            invalidNames[invalidDepartmentIndex]
              ? 'input'
              : '[data-role="clerks"] input',
          )
          ?.focus();
      }
      return false;
    }
    setBusy(true);
    onBusyChange(true);
    setError('');
    setSuccess(false);
    return client
      .request<{ data: OfficeWorkflowParameters }>({
        path,
        method: 'PUT',
        json: {
          kind: 'office',
          values: draft,
          expectedRevision: saved.revision,
          ...(organization
            ? {
                organization: {
                  expectedRevision: organization.revision,
                  departments: organization.departments,
                },
              }
            : {}),
        },
      })
      .then(({ data }) => {
        setSaved(data);
        onSaved?.(data);
        setDraft(data.values);
        setOrganization(data.organization);
        setSuccess(true);
        return true;
      })
      .catch((error: unknown) => {
        setConflict(
          Boolean(
            error &&
            typeof error === 'object' &&
            'reason' in error &&
            error.reason === 'CONFIGURATION_CONFLICT',
          ),
        );
        setError(
          t(
            error &&
              typeof error === 'object' &&
              'reason' in error &&
              error.reason === 'DEPARTMENT_IN_USE'
              ? 'workflows.officeRules.departmentInUse'
              : 'workflows.parametersFailed',
          ),
        );
        return false;
      })
      .finally(() => {
        setBusy(false);
        onBusyChange(false);
      });
  };
  useImperativeHandle(saveRef, () => ({ save }));
  const selectPeople = (
    label: string,
    value: string[],
    update: (value: string[]) => void,
  ) => (
    <OfficePeoplePicker
      label={label}
      value={value}
      update={update}
      busy={locked}
    />
  );
  return (
    <div className='space-y-4'>
      <AlertDialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open) setConfirmation(undefined);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmation?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('workflows.keepParameterEditing')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                confirmation?.run();
                setConfirmation(undefined);
              }}
            >
              {confirmation?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {draft.dispatchRules && (
        <section className='space-y-3'>
          <h3 className='font-medium'>{t('workflows.officeRules.title')}</h3>
          <p className='text-sm text-muted-foreground'>
            {t('workflows.officeRules.help')}
          </p>
          <fieldset className='space-y-2'>
            <legend className='text-sm font-medium'>
              {t('workflows.officeRules.departments')}
            </legend>
            <p className='text-xs text-muted-foreground'>
              {t('workflows.officeRules.allDepartments')}
            </p>
            {organization?.departments.map((row) => (
              <label key={row.name} className='flex items-center gap-2 text-sm'>
                <Checkbox
                  disabled={locked}
                  checked={draft.dispatchRules!.departmentNames.includes(
                    row.name,
                  )}
                  onCheckedChange={(checked) =>
                    change({
                      ...draft,
                      dispatchRules: {
                        ...draft.dispatchRules!,
                        departmentNames: checked
                          ? [...draft.dispatchRules!.departmentNames, row.name]
                          : draft.dispatchRules!.departmentNames.filter(
                              (name) => name !== row.name,
                            ),
                      },
                    })
                  }
                />
                {row.name}
              </label>
            ))}
          </fieldset>
          {configuration.workflow !== 'incoming' && (
            <label className='flex items-center gap-2 text-sm'>
              <Checkbox
                disabled={locked}
                checked={draft.dispatchRules.ownDepartmentOnly}
                onCheckedChange={(checked) =>
                  change({
                    ...draft,
                    dispatchRules: {
                      ...draft.dispatchRules!,
                      ownDepartmentOnly: !!checked,
                    },
                  })
                }
              />
              {t('workflows.officeRules.ownDepartment')}
            </label>
          )}
          <fieldset className='space-y-2'>
            <legend className='text-sm font-medium'>
              {t('workflows.officeRules.assigneeRole')}
            </legend>
            <div className='flex flex-wrap gap-2'>
              {(['clerks', 'heads', 'leaders'] as const).map((role) => (
                <Button
                  key={role}
                  disabled={locked}
                  variant={
                    draft.dispatchRules!.assigneeRole === role
                      ? 'secondary'
                      : 'outline'
                  }
                  aria-pressed={draft.dispatchRules!.assigneeRole === role}
                  onClick={() =>
                    change({
                      ...draft,
                      dispatchRules: {
                        ...draft.dispatchRules!,
                        assigneeRole: role,
                      },
                    })
                  }
                >
                  {t(`workflows.parameterFields.${role}`)}
                </Button>
              ))}
            </div>
          </fieldset>
          {(['ccHeads', 'ccLeaders'] as const).map((key) => (
            <label key={key} className='flex items-center gap-2 text-sm'>
              <Checkbox
                disabled={locked}
                checked={draft.dispatchRules![key]}
                onCheckedChange={(checked) =>
                  change({
                    ...draft,
                    dispatchRules: {
                      ...draft.dispatchRules!,
                      [key]: !!checked,
                    },
                  })
                }
              />
              {t(`workflows.officeRules.${key}`)}
            </label>
          ))}
        </section>
      )}
      {organization && (
        <details ref={sharedRef} className='space-y-3 rounded-lg border p-3'>
          <summary className='cursor-pointer font-medium'>
            {t('workflows.officeRules.sharedOrganization')}
          </summary>
          <p className='text-sm text-muted-foreground'>
            {t('workflows.officeRules.sharedHelp')}
          </p>
          {organization.legacyOverrides && (
            <p role='status' className='text-sm text-muted-foreground'>
              {t('workflows.officeRules.legacyHelp')}
            </p>
          )}
          <h3 className='font-medium'>
            {t('workflows.parameterFields.departments')}
          </h3>
          {organization.departments.map((row, index) => (
            <fieldset
              key={index}
              data-department-index={index}
              className='space-y-3 rounded-lg border p-3'
            >
              <label htmlFor={`${id}-department-${index}`}>
                {t('workflows.parameterFields.name')}
              </label>
              <Input
                id={`${id}-department-${index}`}
                disabled={locked}
                value={row.name}
                aria-invalid={showOrganizationErrors && invalidNames[index]}
                aria-describedby={
                  showOrganizationErrors && invalidNames[index]
                    ? `${id}-name-error-${index}`
                    : undefined
                }
                onChange={(event) => {
                  if (draft.dispatchRules?.departmentNames.includes(row.name))
                    change({
                      ...draft,
                      dispatchRules: {
                        ...draft.dispatchRules,
                        departmentNames:
                          draft.dispatchRules.departmentNames.map((name) =>
                            name === row.name ? event.target.value : name,
                          ),
                      },
                    });
                  setOrganization({
                    ...organization,
                    departments: organization.departments.map((item, offset) =>
                      offset === index
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  });
                }}
              />
              {showOrganizationErrors && invalidNames[index] && (
                <p
                  id={`${id}-name-error-${index}`}
                  className='text-sm text-destructive'
                >
                  {t('workflows.officeRules.invalidDepartmentName')}
                </p>
              )}
              {(['clerks', 'heads', 'leaders'] as const).map((field) => (
                <div key={field} data-role={field}>
                  {showOrganizationErrors &&
                    field === 'clerks' &&
                    !row.clerks.length && (
                      <p className='text-sm text-destructive'>
                        {t('workflows.officeRules.clerksRequired')}
                      </p>
                    )}
                  {selectPeople(
                    t(`workflows.parameterFields.${field}`),
                    row[field],
                    (value) =>
                      setOrganization({
                        ...organization,
                        departments: organization.departments.map(
                          (item, offset) =>
                            offset === index
                              ? { ...item, [field]: value }
                              : item,
                        ),
                      }),
                  )}
                </div>
              ))}
              {draft.dispatchRules?.departmentNames.includes(row.name) && (
                <p className='text-xs text-muted-foreground'>
                  {t('workflows.officeRules.removeSelectedDepartment')}
                </p>
              )}
              <Button
                variant='outline'
                disabled={
                  locked ||
                  !!draft.dispatchRules?.departmentNames.includes(row.name)
                }
                onClick={() =>
                  setConfirmation({
                    title: t('workflows.officeRules.removeTitle', {
                      name: row.name,
                    }),
                    action: t('workflows.officeRules.removeAction'),
                    message: t('workflows.officeRules.removeDepartment', {
                      name: row.name,
                    }),
                    run: () => {
                      setOrganization({
                        ...organization,
                        departments: organization.departments.filter(
                          (_, offset) => offset !== index,
                        ),
                      });
                      sharedRef.current?.querySelector('summary')?.focus();
                    },
                  })
                }
              >
                {t('workflows.removeParameterEntry')}
              </Button>
            </fieldset>
          ))}
          <Button
            variant='outline'
            disabled={locked}
            onClick={() =>
              setOrganization({
                ...organization,
                departments: [
                  ...organization.departments,
                  { name: '', clerks: [], heads: [], leaders: [] },
                ],
              })
            }
          >
            {t('workflows.addParameterEntry')}
          </Button>
        </details>
      )}
      {draft.managementGroups && (
        <section className='space-y-3'>
          <h3 className='font-medium'>
            {t('workflows.parameterFields.managementGroups')}
          </h3>
          {draft.managementGroups.map((row) => (
            <fieldset key={row.id} className='space-y-3 rounded-lg border p-3'>
              <label htmlFor={`${id}-group-${row.id}`}>
                {t('workflows.parameterFields.name')}
              </label>
              <Input
                id={`${id}-group-${row.id}`}
                disabled={locked}
                value={row.name}
                onChange={(event) =>
                  change({
                    ...draft,
                    managementGroups: draft.managementGroups!.map((item) =>
                      item.id === row.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  })
                }
              />
              {selectPeople(
                t('workflows.parameterFields.members'),
                row.members,
                (members) =>
                  change({
                    ...draft,
                    managementGroups: draft.managementGroups!.map((item) =>
                      item.id === row.id ? { ...item, members } : item,
                    ),
                  }),
              )}
              <Button
                variant='outline'
                disabled={locked}
                onClick={() =>
                  change({
                    ...draft,
                    managementGroups: draft.managementGroups!.filter(
                      (item) => item.id !== row.id,
                    ),
                  })
                }
              >
                {t('workflows.removeParameterEntry')}
              </Button>
            </fieldset>
          ))}
          <Button
            variant='outline'
            disabled={locked}
            onClick={() =>
              change({
                ...draft,
                managementGroups: [
                  ...draft.managementGroups!,
                  {
                    id:
                      Math.max(
                        0,
                        ...draft.managementGroups!.map((row) => row.id),
                      ) + 1,
                    name: '',
                    members: [],
                  },
                ],
              })
            }
          >
            {t('workflows.addParameterEntry')}
          </Button>
        </section>
      )}
      {draft.holidays && (
        <section className='space-y-3'>
          <h3 className='font-medium'>
            {t('workflows.parameterFields.holidays')}
          </h3>
          {draft.holidays.map((row, index) => (
            <div
              key={index}
              className='grid gap-2 rounded-lg border p-3 sm:grid-cols-2'
            >
              <label>
                {t('workflows.parameterFields.date')}
                <Input
                  type='date'
                  disabled={locked}
                  value={row.date}
                  onChange={(event) =>
                    change({
                      ...draft,
                      holidays: draft.holidays!.map((item, offset) =>
                        offset === index
                          ? { ...item, date: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
              </label>
              <label>
                {t('workflows.parameterFields.name')}
                <Input
                  disabled={locked}
                  value={row.name}
                  onChange={(event) =>
                    change({
                      ...draft,
                      holidays: draft.holidays!.map((item, offset) =>
                        offset === index
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    })
                  }
                />
              </label>
              <label className='flex items-center gap-2'>
                <Checkbox
                  disabled={locked}
                  checked={row.kind === 'workday'}
                  onCheckedChange={(checked) =>
                    change({
                      ...draft,
                      holidays: draft.holidays!.map((item, offset) =>
                        offset === index
                          ? {
                              ...item,
                              kind: checked ? 'workday' : 'holiday',
                            }
                          : item,
                      ),
                    })
                  }
                />
                {t('workflows.parameterFields.workday')}
              </label>
              <Button
                variant='outline'
                disabled={locked}
                onClick={() =>
                  change({
                    ...draft,
                    holidays: draft.holidays!.filter(
                      (_, offset) => offset !== index,
                    ),
                  })
                }
              >
                {t('workflows.removeParameterEntry')}
              </Button>
            </div>
          ))}
          <Button
            variant='outline'
            disabled={locked}
            onClick={() =>
              change({
                ...draft,
                holidays: [
                  ...draft.holidays!,
                  { date: '', name: '', kind: 'holiday' },
                ],
              })
            }
          >
            {t('workflows.addParameterEntry')}
          </Button>
        </section>
      )}
      {error && (
        <p role='alert' className='text-destructive'>
          {error}
        </p>
      )}
      {conflict && (
        <Button
          variant='outline'
          disabled={locked}
          onClick={() =>
            setConfirmation({
              title: t('workflows.officeRules.reloadTitle'),
              action: t('workflows.officeRules.reloadAction'),
              message: t('workflows.officeRules.reloadConfirm'),
              run: () => {
                setBusy(true);
                onBusyChange(true);
                void client
                  .request<{ data: OfficeWorkflowParameters }>({ path })
                  .then(({ data }) => {
                    setSaved(data);
                    setDraft(data.values);
                    setOrganization(data.organization);
                    onSaved?.(data);
                    setConflict(false);
                    setError('');
                  })
                  .catch(() => setError(t('workflows.parametersFailed')))
                  .finally(() => {
                    setBusy(false);
                    onBusyChange(false);
                  });
              },
            })
          }
        >
          {t('workflows.reloadParameterRevision')}
        </Button>
      )}
      {success && !dirty && (
        <p role='status'>{t('workflows.parametersSaved')}</p>
      )}
      {!saveRef && (
        <Button disabled={locked || !dirty} onClick={() => void save()}>
          {t('workflows.saveParameters')}
        </Button>
      )}
    </div>
  );
}
