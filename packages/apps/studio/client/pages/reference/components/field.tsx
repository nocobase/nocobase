import { useTranslation } from '@nocobase/i18n/client';
import { type FormEvent, type ReactElement, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import { ExamplePage, ExampleSection } from '../shared';

interface Region {
  readonly value: string;
  readonly label: string;
}

const REGIONS: readonly Region[] = [
  { value: 'eu', label: 'Europe' },
  { value: 'na', label: 'North America' },
  { value: 'apac', label: 'Asia Pacific' },
  { value: 'latam', label: 'Latin America' },
];

type ShippingMethod = 'standard' | 'express' | 'overnight';

interface ShippingOption {
  readonly value: ShippingMethod;
  readonly price: string;
}

const SHIPPING_OPTIONS: readonly ShippingOption[] = [
  { value: 'standard', price: '$0.00' },
  { value: 'express', price: '$12.00' },
  { value: 'overnight', price: '$29.00' },
];

const SHIPPING_KEY: Record<ShippingMethod, { title: string; hint: string }> = {
  standard: {
    title: 'components.field.shippingStandard',
    hint: 'components.field.shippingStandardHint',
  },
  express: {
    title: 'components.field.shippingExpress',
    hint: 'components.field.shippingExpressHint',
  },
  overnight: {
    title: 'components.field.shippingOvernight',
    hint: 'components.field.shippingOvernightHint',
  },
};

function isShippingMethod(value: unknown): value is ShippingMethod {
  return value === 'standard' || value === 'express' || value === 'overnight';
}

interface FormErrors {
  name?: string;
  email?: string;
  region?: string;
}

function formValue(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

export default function FieldExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [region, setRegion] = useState<string | null>(null);
  const [marketing, setMarketing] = useState(false);
  const [invoiceCopy, setInvoiceCopy] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [shipping, setShipping] = useState<ShippingMethod>('standard');

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: FormErrors = {};
    if (!formValue(data, 'name')) {
      next.name = t('components.field.nameRequired');
    }
    const email = formValue(data, 'email');
    if (!email) {
      next.email = t('components.field.emailRequired');
    } else if (!email.includes('@')) {
      next.email = t('components.field.emailInvalid');
    }
    if (!region) {
      next.region = t('components.field.regionRequired');
    }
    setErrors(next);
    setSubmitted(Object.keys(next).length === 0);
  };

  const handleReset = (): void => {
    setErrors({});
    setSubmitted(false);
    setRegion(null);
    setMarketing(false);
    setInvoiceCopy(true);
  };

  return (
    <ExamplePage
      title={t('components.field.title')}
      description={t('components.field.description')}
      docs='https://ui.shadcn.com/docs/components/field'
    >
      <ExampleSection
        title={t('components.field.form')}
        description={t('components.field.formDescription')}
        contentClassName='block'
      >
        <form
          className='w-full max-w-md'
          noValidate
          onSubmit={handleSubmit}
          onReset={handleReset}
        >
          <FieldGroup>
            <FieldSet>
              <FieldLegend>{t('components.field.customerDetails')}</FieldLegend>
              <FieldDescription>
                {t('components.field.customerDetailsDescription')}
              </FieldDescription>
              <FieldGroup>
                <Field data-invalid={errors.name ? true : undefined}>
                  <FieldLabel htmlFor='field-name'>
                    {t('components.field.fullName')}
                  </FieldLabel>
                  <Input
                    id='field-name'
                    name='name'
                    placeholder={t('components.field.namePlaceholder')}
                    aria-invalid={errors.name ? true : undefined}
                    autoComplete='name'
                  />
                  <FieldError>{errors.name}</FieldError>
                </Field>
                <Field data-invalid={errors.email ? true : undefined}>
                  <FieldLabel htmlFor='field-email'>
                    {t('reference.email')}
                  </FieldLabel>
                  <Input
                    id='field-email'
                    name='email'
                    type='email'
                    placeholder={t('components.field.emailPlaceholder')}
                    aria-invalid={errors.email ? true : undefined}
                    autoComplete='email'
                  />
                  <FieldDescription>
                    {t('components.field.emailHint')}
                  </FieldDescription>
                  <FieldError>{errors.email}</FieldError>
                </Field>
                <Field data-invalid={errors.region ? true : undefined}>
                  <FieldLabel htmlFor='field-region'>
                    {t('components.field.region')}
                  </FieldLabel>
                  <Select
                    items={REGIONS}
                    value={region}
                    onValueChange={(value: string | null) => setRegion(value)}
                  >
                    <SelectTrigger
                      id='field-region'
                      className='w-full'
                      aria-invalid={errors.region ? true : undefined}
                    >
                      <SelectValue
                        placeholder={t('reference.selectPlaceholder')}
                      />
                    </SelectTrigger>
                    <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                      {REGIONS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.region}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor='field-notes'>
                    {t('reference.notes')}
                  </FieldLabel>
                  <Textarea
                    id='field-notes'
                    name='notes'
                    placeholder={t('components.field.notesPlaceholder')}
                  />
                  <FieldDescription>{t('reference.optional')}</FieldDescription>
                </Field>
              </FieldGroup>
            </FieldSet>
            <FieldSeparator />
            <FieldSet>
              <FieldLegend variant='label'>
                {t('components.field.preferences')}
              </FieldLegend>
              <FieldDescription>
                {t('components.field.preferencesDescription')}
              </FieldDescription>
              <FieldGroup className='gap-3'>
                <Field orientation='horizontal'>
                  <Checkbox
                    id='field-marketing'
                    name='marketing'
                    checked={marketing}
                    onCheckedChange={(checked) => setMarketing(checked)}
                  />
                  <FieldContent>
                    <FieldLabel htmlFor='field-marketing'>
                      {t('components.field.marketing')}
                    </FieldLabel>
                    <FieldDescription>
                      {t('components.field.marketingHint')}
                    </FieldDescription>
                  </FieldContent>
                </Field>
                <Field orientation='horizontal'>
                  <FieldContent>
                    <FieldLabel htmlFor='field-invoice-copy'>
                      {t('components.field.invoiceCopy')}
                    </FieldLabel>
                    <FieldDescription>
                      {t('components.field.invoiceCopyHint')}
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id='field-invoice-copy'
                    name='invoiceCopy'
                    checked={invoiceCopy}
                    onCheckedChange={(checked) => setInvoiceCopy(checked)}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
            <Field orientation='horizontal'>
              <Button type='submit'>{t('reference.submit')}</Button>
              <Button type='reset' variant='outline'>
                {t('reference.reset')}
              </Button>
              {submitted ? (
                <FieldDescription className='ms-auto'>
                  {t('components.field.submitted')}
                </FieldDescription>
              ) : null}
            </Field>
          </FieldGroup>
        </form>
      </ExampleSection>

      <ExampleSection
        title={t('components.field.orientations')}
        description={t('components.field.orientationsDescription')}
        contentClassName='block'
      >
        <FieldGroup className='w-full max-w-lg'>
          <Field orientation='vertical'>
            <FieldLabel htmlFor='field-vertical'>
              {t('components.field.vertical')}
            </FieldLabel>
            <Input
              id='field-vertical'
              placeholder={t('components.field.companyPlaceholder')}
            />
            <FieldDescription>
              {t('components.field.verticalHint')}
            </FieldDescription>
          </Field>
          <Field orientation='horizontal'>
            <Checkbox id='field-horizontal' defaultChecked />
            <FieldLabel htmlFor='field-horizontal' className='font-normal'>
              {t('components.field.agreeTerms')}
            </FieldLabel>
          </Field>
          <Field orientation='responsive'>
            <FieldContent>
              <FieldLabel htmlFor='field-responsive'>
                {t('components.field.responsive')}
              </FieldLabel>
              <FieldDescription>
                {t('components.field.responsiveHint')}
              </FieldDescription>
            </FieldContent>
            <Input
              id='field-responsive'
              placeholder={t('components.field.taxIdPlaceholder')}
              className='sm:max-w-48'
            />
          </Field>
        </FieldGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.field.choiceCards')}
        description={t('components.field.choiceCardsDescription')}
        contentClassName='block'
      >
        <FieldSet className='w-full max-w-md'>
          <FieldLegend variant='label'>
            {t('components.field.shippingMethod')}
          </FieldLegend>
          <RadioGroup
            value={shipping}
            onValueChange={(value: unknown) => {
              if (isShippingMethod(value)) setShipping(value);
            }}
            className='gap-2'
          >
            {SHIPPING_OPTIONS.map((option) => (
              <FieldLabel
                key={option.value}
                htmlFor={`shipping-${option.value}`}
              >
                <Field orientation='horizontal'>
                  <FieldContent>
                    <FieldTitle>
                      {t(SHIPPING_KEY[option.value].title)}
                    </FieldTitle>
                    <FieldDescription>
                      {t(SHIPPING_KEY[option.value].hint)}
                    </FieldDescription>
                  </FieldContent>
                  <span className='text-sm font-medium tabular-nums'>
                    {option.price}
                  </span>
                  <RadioGroupItem
                    value={option.value}
                    id={`shipping-${option.value}`}
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </FieldSet>
      </ExampleSection>

      <ExampleSection
        title={t('components.field.errors')}
        description={t('components.field.errorsDescription')}
        contentClassName='block'
      >
        <FieldGroup className='w-full max-w-md'>
          <Field data-invalid>
            <FieldLabel htmlFor='field-error-single'>
              {t('components.field.password')}
            </FieldLabel>
            <Input
              id='field-error-single'
              type='password'
              defaultValue='abc'
              aria-invalid
            />
            <FieldError>{t('components.field.passwordTooShort')}</FieldError>
          </Field>
          <Field data-invalid>
            <FieldLabel htmlFor='field-error-list'>
              {t('components.field.password')}
            </FieldLabel>
            <Input
              id='field-error-list'
              type='password'
              defaultValue='password'
              aria-invalid
            />
            <FieldError
              errors={[
                { message: t('components.field.passwordNeedsNumber') },
                { message: t('components.field.passwordNeedsSymbol') },
              ]}
            />
          </Field>
        </FieldGroup>
      </ExampleSection>
    </ExamplePage>
  );
}
