import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useId, useRef, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Label } from '#components/ui/label';
import { useListData } from '#hooks/use-list-data';
import { RelationPicker } from './relation-picker.js';
import {
  ReadFeedback,
  WriteFeedback,
  FieldError,
  Choice,
  StatusChoice,
} from './shared.js';
import {
  base,
  useCrmAction,
  useWriteLock,
  type Customer,
  type Contact,
} from './model.js';
import type { CustomerDetailContext } from './detail.js';

export default function CustomerEditorPage() {
  const { customerId = '', contactId } = useParams();
  const location = useLocation();
  const isContact = location.pathname.includes('/contacts/');
  const creating = isContact && !contactId;
  const request = useListData<{ data: Customer | Contact }>(
    `${base}/${isContact ? 'contacts' : 'customers'}/${encodeURIComponent((isContact ? contactId : customerId) ?? '')}`,
    { active: !creating },
  );
  return (
    <Editor
      key={`${customerId}/${contactId ?? (creating ? 'new' : 'edit')}`}
      kind={isContact ? 'contact' : 'customer'}
      creating={creating}
      row={request.data?.data}
      customerId={customerId}
      read={request}
    />
  );
}

function Editor({
  kind,
  row,
  customerId,
  creating,
  read,
}: {
  kind: 'customer' | 'contact';
  row?: Customer | Contact;
  customerId: string;
  creating: boolean;
  read: { loading: boolean; error?: unknown; reload: () => void };
}) {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const navigate = useNavigate();
  const location = useLocation();
  const parent = useOutletContext<CustomerDetailContext>();
  const edit = useCrmAction('customers', 'edit');
  const assign = useCrmAction('customers', 'assign');
  const maintain = useCrmAction('contacts', 'edit');
  const [mode, setMode] = useState('details');
  const effectiveMode =
    kind === 'customer' && !edit.can && assign.can ? 'owner' : mode;
  const [relationValid, setRelationValid] = useState(false);
  const [error, setError] = useState<unknown>();
  const lock = useWriteLock();
  const formId = useId();
  const relationRef = useRef<HTMLButtonElement>(null);
  const initialCustomer = kind === 'customer' ? (row as Customer) : undefined;
  const initialContact =
    kind === 'contact' ? (row as Contact | undefined) : undefined;
  const form = useForm({
    values: {
      name: row?.name ?? '',
      notes: initialCustomer?.notes ?? '',
      status: initialCustomer?.status ?? 'active',
      ownerId: initialCustomer?.ownerId ?? '',
      customerId: initialContact?.customerId ?? customerId,
      email: initialContact?.email ?? '',
      phone: initialContact?.phone ?? '',
      title: initialContact?.title ?? '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });
  const ready = creating || Boolean(row && !read.error);
  const { setFocus } = form;
  useEffect(() => {
    if (ready) setFocus('name');
  }, [ready, setFocus]);
  const fields = useWatch({ control: form.control });
  const submit = async () => {
    if (!lock.acquire()) return;
    setError(undefined);
    try {
      let valid = false;
      await form.handleSubmit(() => {
        valid = true;
      })();
      const association = kind === 'contact' ? 'customerId' : 'ownerId';
      if ((kind === 'contact' || effectiveMode === 'owner') && !relationValid) {
        form.setError(association, {
          message: t('customerContacts.invalidRelation'),
        });
        if (valid) relationRef.current?.focus();
        valid = false;
      }
      if (!valid) return;
      const values = form.getValues();
      const json =
        kind === 'contact'
          ? {
              customerId: values.customerId,
              name: values.name.trim(),
              email: values.email.trim(),
              phone: values.phone.trim(),
              title: values.title.trim(),
            }
          : effectiveMode === 'owner'
            ? { ownerId: values.ownerId }
            : {
                name: values.name.trim(),
                notes: values.notes,
                status: values.status,
              };
      const saved = await api.request<{ data: Customer | Contact }>({
        path: `${base}/${kind === 'contact' ? 'contacts' : 'customers'}${row ? `/${encodeURIComponent(row.id)}` : ''}`,
        method: row ? 'PATCH' : 'POST',
        json,
      });
      if (kind === 'customer') parent.onCustomerSaved(saved.data as Customer);
      parent.reload();
      toaster.show({
        type: 'success',
        title: t('customerContacts.saved', { name: saved.data.name }),
      });
      lock.release();
      await navigate(
        { pathname: '..', search: location.search },
        { relative: 'route' },
      );
    } catch (failure) {
      if (
        failure instanceof ApiClientError &&
        failure.status === 400 &&
        failure.payload &&
        typeof failure.payload === 'object'
      ) {
        const detail: unknown = Reflect.get(failure.payload, 'error');
        const violations: unknown =
          detail && typeof detail === 'object'
            ? Reflect.get(detail, 'fieldViolations')
            : undefined;
        if (Array.isArray(violations)) {
          let first = true;
          for (const violation of violations) {
            const field: unknown =
              violation && typeof violation === 'object'
                ? Reflect.get(violation, 'field')
                : undefined;
            if (
              typeof field !== 'string' ||
              !Object.hasOwn(form.getValues(), field)
            )
              continue;
            const name = field as keyof typeof fields;
            const message =
              field === 'name'
                ? t('customerContacts.required')
                : field === 'email'
                  ? t('customerContacts.invalidEmail')
                  : t('customerContacts.invalid');
            form.setError(name, { message }, { shouldFocus: first });
            first = false;
          }
        }
      }
      setError(failure);
    } finally {
      lock.release();
    }
  };
  const input = (name: 'name' | 'email' | 'phone' | 'title', label: string) => (
    <div className='flex flex-col gap-2'>
      <Label htmlFor={`${formId}-${name}`}>
        {label}
        {name === 'name' ? ' *' : ''}
      </Label>
      <Input
        id={`${formId}-${name}`}
        disabled={lock.busy}
        aria-required={name === 'name'}
        aria-invalid={Boolean(form.formState.errors[name])}
        aria-describedby={`${formId}-${name}-error`}
        {...form.register(name, {
          ...(name === 'name'
            ? {
                validate: (value) =>
                  (Boolean(value.trim()) && value.trim().length <= 100) ||
                  t('customerContacts.required'),
              }
            : {}),
          ...(name !== 'name'
            ? {
                maxLength: {
                  value: name === 'email' ? 254 : 100,
                  message: t('customerContacts.maxLength'),
                },
              }
            : {}),
          ...(name === 'email'
            ? {
                validate: (value) =>
                  !value ||
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value.trim()) ||
                  t('customerContacts.invalidEmail'),
              }
            : {}),
        })}
      />
      <FieldError id={`${formId}-${name}-error`}>
        {form.formState.errors[name]?.message}
      </FieldError>
    </div>
  );
  const allowed =
    kind === 'contact'
      ? maintain.can
      : effectiveMode === 'owner'
        ? assign.can
        : edit.can;
  return (
    <RouteDialog
      title={t(
        kind === 'contact'
          ? creating
            ? 'customerContacts.newContact'
            : 'customerContacts.editContact'
          : 'customerContacts.editCustomer',
      )}
      beforeClose={() => !lock.locked()}
      footer={
        !ready ? (
          <Cancel />
        ) : (
          <>
            <Cancel disabled={lock.busy} />
            <Button
              form={formId}
              type='submit'
              disabled={lock.busy || !allowed}
            >
              {lock.busy
                ? t('customerContacts.saving')
                : t(row ? 'customerContacts.save' : 'customerContacts.create')}
            </Button>
          </>
        )
      }
    >
      {!ready ? (
        <ReadFeedback error={read.error} retry={read.reload} />
      ) : (
        <form
          id={formId}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className='flex flex-col gap-4'
        >
          <WriteFeedback error={error} />
          {kind === 'customer' && edit.can && assign.can && (
            <Choice
              label={t('customerContacts.batchField')}
              value={effectiveMode}
              disabled={lock.busy}
              onChange={setMode}
              options={[
                { value: 'details', label: t('customerContacts.editCustomer') },
                { value: 'owner', label: t('customerContacts.assignOwner') },
              ]}
            />
          )}
          {kind === 'contact' || effectiveMode === 'details' ? (
            <>
              {input('name', t('customerContacts.name'))}
              {kind === 'contact' ? (
                <>
                  {input('email', t('customerContacts.email'))}
                  {input('phone', t('customerContacts.phone'))}
                  {input('title', t('customerContacts.jobTitle'))}
                </>
              ) : (
                <>
                  <Label htmlFor={`${formId}-notes`}>
                    {t('customerContacts.notes')}
                  </Label>
                  <Textarea
                    id={`${formId}-notes`}
                    disabled={lock.busy}
                    {...form.register('notes', {
                      maxLength: {
                        value: 2000,
                        message: t('customerContacts.maxLength'),
                      },
                    })}
                  />
                  <FieldError id={`${formId}-notes-error`}>
                    {form.formState.errors.notes?.message}
                  </FieldError>
                  <Label>{t('customerContacts.status')}</Label>
                  <StatusChoice
                    value={fields.status ?? 'active'}
                    disabled={lock.busy}
                    onChange={(value) =>
                      form.setValue('status', value as Customer['status'])
                    }
                  />
                </>
              )}
            </>
          ) : null}
          {kind === 'contact' || effectiveMode === 'owner' ? (
            <div className='flex flex-col gap-2'>
              <Label>
                {t(
                  kind === 'contact'
                    ? 'customerContacts.customer'
                    : 'customerContacts.owner',
                )}{' '}
                *
              </Label>
              <RelationPicker
                triggerRef={relationRef}
                required
                invalid={Boolean(
                  kind === 'contact'
                    ? form.formState.errors.customerId
                    : form.formState.errors.ownerId,
                )}
                errorId={`${formId}-relation-error`}
                kind={kind === 'contact' ? 'customers' : 'salesReps'}
                value={
                  (kind === 'contact' ? fields.customerId : fields.ownerId) ??
                  ''
                }
                label={t(
                  kind === 'contact'
                    ? 'customerContacts.customer'
                    : 'customerContacts.owner',
                )}
                disabled={lock.busy}
                onValidityChange={setRelationValid}
                onChange={(id) => {
                  const name = kind === 'contact' ? 'customerId' : 'ownerId';
                  form.setValue(name, id, { shouldDirty: true });
                  form.clearErrors(name);
                }}
              />
              <FieldError id={`${formId}-relation-error`}>
                {kind === 'contact'
                  ? form.formState.errors.customerId?.message
                  : form.formState.errors.ownerId?.message}
              </FieldError>
            </div>
          ) : null}
        </form>
      )}
    </RouteDialog>
  );
}
export function Cancel({ disabled = false }: { disabled?: boolean }) {
  const { close } = useRouteOverlay();
  const { t } = useTranslation();
  return (
    <Button variant='outline' disabled={disabled} onClick={() => void close()}>
      {t('customerContacts.cancel')}
    </Button>
  );
}
