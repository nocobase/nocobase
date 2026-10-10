import { useTranslation } from '@nocobase/i18n/client';
import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { CheckCircle2Icon, RefreshCwIcon } from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';

import { ExamplePage, ExampleSection } from '../shared';

const EXPECTED_CODE = '482913';

export default function InputOtpExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);

  const invalid = code.length === EXPECTED_CODE.length && !verified;

  const handleChange = (value: string): void => {
    setCode(value);
    setVerified(value === EXPECTED_CODE);
  };

  return (
    <ExamplePage
      title={t('components.inputOtp.title')}
      description={t('components.inputOtp.description')}
      docs='https://ui.shadcn.com/docs/components/input-otp'
    >
      <ExampleSection
        title={t('components.inputOtp.basic')}
        description={t('components.inputOtp.basicDescription')}
      >
        <InputOTP maxLength={6} aria-label={t('components.inputOtp.codeLabel')}>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </ExampleSection>

      <ExampleSection
        title={t('components.inputOtp.patterns')}
        description={t('components.inputOtp.patternsDescription')}
        contentClassName='grid gap-6 sm:grid-cols-2'
      >
        <Field className='w-fit'>
          <FieldLabel htmlFor='otp-terminal-pin'>
            {t('components.inputOtp.pinLabel')}
          </FieldLabel>
          <InputOTP
            id='otp-terminal-pin'
            maxLength={4}
            pattern={REGEXP_ONLY_DIGITS}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
          </InputOTP>
          <FieldDescription>
            {t('components.inputOtp.pinDescription')}
          </FieldDescription>
        </Field>
        <Field className='w-fit'>
          <FieldLabel htmlFor='otp-invoice-code'>
            {t('components.inputOtp.invoiceCodeLabel')}
          </FieldLabel>
          <InputOTP
            id='otp-invoice-code'
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <FieldDescription>
            {t('components.inputOtp.invoiceCodeDescription')}
          </FieldDescription>
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.inputOtp.disabled')}
        description={t('components.inputOtp.disabledDescription')}
      >
        <InputOTP
          maxLength={6}
          disabled
          value='4829'
          aria-label={t('components.inputOtp.codeLabel')}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </ExampleSection>

      <ExampleSection
        title={t('components.inputOtp.verify')}
        description={t('components.inputOtp.verifyDescription')}
        contentClassName='block space-y-3'
      >
        <p className='text-sm text-muted-foreground'>
          {t('components.inputOtp.sentTo', {
            email: 'ava.chen@northwind.example',
          })}
        </p>
        <InputOTP
          maxLength={6}
          value={code}
          onChange={handleChange}
          aria-label={t('components.inputOtp.codeLabel')}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} aria-invalid={invalid} />
            <InputOTPSlot index={1} aria-invalid={invalid} />
            <InputOTPSlot index={2} aria-invalid={invalid} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} aria-invalid={invalid} />
            <InputOTPSlot index={4} aria-invalid={invalid} />
            <InputOTPSlot index={5} aria-invalid={invalid} />
          </InputOTPGroup>
        </InputOTP>
        {verified ? (
          <p className='flex items-center gap-2 text-sm text-muted-foreground'>
            <CheckCircle2Icon className='size-4 text-primary' />
            {t('components.inputOtp.verified')}
          </p>
        ) : invalid ? (
          <p className='text-sm text-destructive'>
            {t('components.inputOtp.incorrect')}
          </p>
        ) : (
          <p className='text-sm text-muted-foreground'>
            {t('components.inputOtp.hint', { code: EXPECTED_CODE })}
          </p>
        )}
        <Button
          variant='outline'
          size='sm'
          onClick={() => {
            setCode('');
            setVerified(false);
          }}
        >
          <RefreshCwIcon data-icon='inline-start' />
          {t('components.inputOtp.resend')}
        </Button>
      </ExampleSection>
    </ExamplePage>
  );
}
