import { useTranslation } from '@nocobase/i18n/client';
import { useToaster } from '@nocobase/app-client';
import {
  useId,
  useRef,
  useState,
  type ReactElement,
  type FormEvent,
} from 'react';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { addCustomer } from './data.js';

const fields = ['name', 'contact', 'email', 'industry'] as const;
type Field = (typeof fields)[number];
type Draft = Record<Field, string>;
function errorFor(field: Field, value: string): string | undefined {
  if (field !== 'industry' && !value.trim()) return 'themeLab.required';
  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return 'themeLab.invalidEmail';
  return undefined;
}
function CustomerForm(): ReactElement {
  const { t } = useTranslation();
  const toaster = useToaster();
  const { close, isClosing } = useRouteOverlay();
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [draft, setDraft] = useState<Draft>({
    name: '',
    contact: '',
    email: '',
    industry: '',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [attempted, setAttempted] = useState(false);
  const [failure, setFailure] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setAttempted(true);
    const nextErrors = Object.fromEntries(
      fields.flatMap((field) => {
        const error = errorFor(field, draft[field]);
        return error ? [[field, error]] : [];
      }),
    );
    setErrors(nextErrors);
    const first = fields.find((field) => nextErrors[field]);
    if (first) {
      formRef.current
        ?.querySelector<HTMLInputElement>(`[name="${first}"]`)
        ?.focus();
      return;
    }
    addCustomer({
      name: draft.name.trim(),
      contact: draft.contact.trim(),
      email: draft.email.trim(),
      industry: draft.industry.trim(),
    });
    toaster.show({
      type: 'success',
      title: t('themeLab.created', { name: draft.name.trim() }),
    });
    try {
      await close();
    } catch {
      setFailure(true);
    }
  };
  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={(event) => {
        void submit(event);
      }}
      className='flex flex-col gap-5'
    >
      {failure && (
        <p role='alert' className='text-sm text-destructive'>
          {t('themeLab.closeError')}
        </p>
      )}
      {fields.map((field) => (
        <div key={field} className='flex flex-col gap-2'>
          <Label htmlFor={`${id}-${field}`}>
            {t(`themeLab.${field}`)}
            {field !== 'industry' ? ' *' : ''}
          </Label>
          <Input
            id={`${id}-${field}`}
            name={field}
            type={field === 'email' ? 'email' : 'text'}
            required={field !== 'industry'}
            value={draft[field]}
            aria-invalid={Boolean(errors[field])}
            aria-describedby={
              errors[field] ? `${id}-${field}-error` : undefined
            }
            onChange={(event) => {
              const value = event.target.value;
              setDraft({ ...draft, [field]: value });
              if (attempted)
                setErrors({ ...errors, [field]: errorFor(field, value) });
            }}
          />
          {errors[field] && (
            <p id={`${id}-${field}-error`} className='text-sm text-destructive'>
              {t(errors[field])}
            </p>
          )}
        </div>
      ))}
      <p className='text-xs text-muted-foreground'>
        {t('themeLab.previewHint')}
      </p>
      <div className='flex justify-end gap-2'>
        <Button
          variant='outline'
          type='button'
          disabled={isClosing}
          onClick={() => {
            void close().catch(() => setFailure(true));
          }}
        >
          {t('themeLab.cancel')}
        </Button>
        <Button type='submit' disabled={isClosing || failure}>
          {t('themeLab.create')}
        </Button>
      </div>
    </form>
  );
}
export default function CreateCustomer(): ReactElement {
  const { t } = useTranslation();
  return (
    <RouteDialog
      title={t('themeLab.newCustomer')}
      description={t('themeLab.createHint')}
      className='sm:max-w-md'
    >
      <CustomerForm />
    </RouteDialog>
  );
}
