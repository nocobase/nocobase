import { useTranslation } from '@nocobase/i18n/client';
import { useToaster } from '@nocobase/app-client';
import { useId, useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
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
import { saveOrder, statuses, useOrders, type Order } from './data';
import { PreviewSelect } from './shared';
function CloseButton() {
  const { t } = useTranslation();
  const { close, isClosing } = useRouteOverlay();
  return (
    <Button variant='outline' disabled={isClosing} onClick={() => void close()}>
      {t('businessPreview.close')}
    </Button>
  );
}
function FormFooter({
  id,
  edit,
}: {
  readonly id: string;
  readonly edit: boolean;
}) {
  const { t } = useTranslation();
  const { close, isClosing } = useRouteOverlay();
  return (
    <>
      <Button
        variant='outline'
        disabled={isClosing}
        onClick={() => void close()}
      >
        {t('businessPreview.cancel')}
      </Button>
      <Button type='submit' form={id} disabled={isClosing}>
        {t(edit ? 'businessPreview.save' : 'businessPreview.create')}
      </Button>
    </>
  );
}
function OrderForm({ row }: { readonly row?: Order }) {
  const { t } = useTranslation();
  const toaster = useToaster();
  const id = useId();
  const schema = z.object({
    customer: z.string().trim().min(1, t('businessPreview.required')),
    email: z
      .string()
      .trim()
      .min(1, t('businessPreview.required'))
      .refine(
        (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        t('businessPreview.invalidEmail'),
      ),
    product: z.string().trim().min(1, t('businessPreview.required')),
    quantity: z
      .string()
      .trim()
      .refine(
        (v) =>
          v !== '' &&
          Number.isInteger(Number(v)) &&
          Number(v) >= 1 &&
          Number(v) <= 100000,
        t('businessPreview.invalidQuantity'),
      ),
    price: z
      .string()
      .trim()
      .refine(
        (v) =>
          v !== '' &&
          Number.isFinite(Number(v)) &&
          Number(v) >= 0 &&
          Number(v) <= 100000000,
        t('businessPreview.invalidPrice'),
      ),
    status: z.enum(statuses),
    note: z.string(),
  });
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customer: row?.customer ?? '',
      email: row?.email ?? '',
      product: row?.product ?? '',
      quantity: String(row?.quantity ?? 1),
      price: String(row?.price ?? ''),
      status: row?.status ?? 'draft',
      note: row?.note ?? '',
    },
  });
  const dirty = form.formState.isDirty;
  const savedRef = useRef(false);
  const [confirm, setConfirm] = useState(false);
  const resolverRef = useRef<((allowed: boolean) => void) | null>(null);
  useEffect(
    () => () => {
      resolverRef.current?.(false);
    },
    [],
  );
  const resolveClose = (allowed: boolean) => {
    setConfirm(false);
    resolverRef.current?.(allowed);
    resolverRef.current = null;
  };
  const beforeClose = () =>
    !dirty || savedRef.current
      ? true
      : new Promise<boolean>((resolve) => {
          resolverRef.current = resolve;
          setConfirm(true);
        });
  const fields = ['customer', 'email', 'product', 'quantity', 'price'] as const;
  return (
    <>
      <RouteDialog
        title={t(
          row ? 'businessPreview.editOrder' : 'businessPreview.newOrder',
        )}
        description={row?.number ?? t('businessPreview.formHint')}
        beforeClose={beforeClose}
        footer={<FormFooter id={id} edit={Boolean(row)} />}
      >
        <FormBody
          id={id}
          form={form}
          fields={fields}
          onSave={(values) => {
            if (savedRef.current) return;
            savedRef.current = true;
            const updated = saveOrder(
              {
                ...values,
                quantity: Number(values.quantity),
                price: Number(values.price),
              },
              row?.id,
            );
            toaster.show({
              type: 'success',
              title: t('businessPreview.savedOrder', {
                number: updated.number,
              }),
            });
          }}
        />
      </RouteDialog>
      <AlertDialog
        open={confirm}
        onOpenChange={(open) => {
          if (!open) resolveClose(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('businessPreview.discardTitle', {
                number: row?.number ?? t('businessPreview.newOrder'),
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('businessPreview.discardHint', {
                number: row?.number ?? t('businessPreview.newOrder'),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t('businessPreview.keepEditing')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => resolveClose(true)}
            >
              {t('businessPreview.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
type FormValues = {
  customer: string;
  email: string;
  product: string;
  quantity: string;
  price: string;
  status: (typeof statuses)[number];
  note: string;
};
function FormBody({
  id,
  form,
  fields,
  onSave,
}: {
  readonly id: string;
  readonly form: ReturnType<typeof useForm<FormValues>>;
  readonly fields: readonly (
    'customer' | 'email' | 'product' | 'quantity' | 'price'
  )[];
  readonly onSave: (values: FormValues) => void;
}) {
  const { t } = useTranslation();
  const { close } = useRouteOverlay();
  return (
    <form
      id={id}
      noValidate
      onSubmit={(event) =>
        void form.handleSubmit(async (values) => {
          onSave(values);
          await close();
        })(event)
      }
    >
      <FieldGroup>
        <div className='grid gap-5 sm:grid-cols-2'>
          {fields.map((name) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  className={
                    name === 'quantity' || name === 'price'
                      ? ''
                      : 'sm:col-span-2'
                  }
                  data-invalid={fieldState.invalid}
                >
                  <FieldLabel htmlFor={`${id}-${name}`}>
                    {t(`businessPreview.${name}`)} *
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${id}-${name}`}
                    type={
                      name === 'email'
                        ? 'email'
                        : name === 'quantity' || name === 'price'
                          ? 'number'
                          : 'text'
                    }
                    min={
                      name === 'quantity' ? 1 : name === 'price' ? 0 : undefined
                    }
                    max={
                      name === 'quantity'
                        ? 100000
                        : name === 'price'
                          ? 100000000
                          : undefined
                    }
                    step={name === 'price' ? '0.01' : undefined}
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
        </div>
        <Controller
          name='status'
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor={`${id}-status`}>
                {t('businessPreview.status')} *
              </FieldLabel>
              <PreviewSelect
                id={`${id}-status`}
                label={t('businessPreview.status')}
                value={field.value}
                onChange={field.onChange}
                options={statuses.map((value) => ({
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
          <Textarea id={`${id}-note`} {...form.register('note')} />
        </Field>
      </FieldGroup>
    </form>
  );
}
export default function OrderFormRoute() {
  const { orderId } = useParams();
  const rows = useOrders();
  const { t } = useTranslation();
  const row = rows.find((item) => item.id === orderId);
  if (orderId && !row)
    return (
      <RouteDialog
        title={t('businessPreview.missing')}
        footer={<CloseButton />}
      >
        <p className='text-sm text-muted-foreground'>
          {t('businessPreview.missingHint')}
        </p>
      </RouteDialog>
    );
  return <OrderForm key={orderId ?? 'new'} row={row} />;
}
