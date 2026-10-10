import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';

import { ExamplePage, ExampleSection } from '../shared';

export default function SwitchExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [published, setPublished] = useState(false);

  return (
    <ExamplePage
      title={t('components.switch.title')}
      description={t('components.switch.description')}
      docs='https://ui.shadcn.com/docs/components/switch'
    >
      <ExampleSection
        title={t('components.switch.basic')}
        description={t('components.switch.basicDescription')}
      >
        <Field orientation='horizontal' className='w-fit'>
          <Switch id='switch-email-notifications' defaultChecked />
          <FieldLabel htmlFor='switch-email-notifications'>
            {t('components.switch.emailNotifications')}
          </FieldLabel>
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.switch.controlled')}
        description={t('components.switch.controlledDescription')}
      >
        <Field orientation='horizontal' className='w-fit'>
          <Switch
            id='switch-publish'
            checked={published}
            onCheckedChange={setPublished}
          />
          <FieldLabel htmlFor='switch-publish'>
            {t('components.switch.publishProduct')}
          </FieldLabel>
        </Field>
        <Badge variant={published ? 'default' : 'secondary'}>
          {published
            ? t('reference.statusPublished')
            : t('reference.statusDraft')}
        </Badge>
      </ExampleSection>

      <ExampleSection
        title={t('components.switch.withDescription')}
        description={t('components.switch.withDescriptionDescription')}
        contentClassName='block'
      >
        <Field orientation='horizontal' className='max-w-sm'>
          <FieldContent>
            <FieldLabel htmlFor='switch-two-factor'>
              {t('components.switch.twoFactor')}
            </FieldLabel>
            <FieldDescription>
              {t('components.switch.twoFactorDescription')}
            </FieldDescription>
          </FieldContent>
          <Switch id='switch-two-factor' />
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.switch.choiceCards')}
        description={t('components.switch.choiceCardsDescription')}
        contentClassName='block'
      >
        <FieldGroup className='w-full max-w-sm'>
          <FieldLabel htmlFor='switch-order-updates'>
            <Field orientation='horizontal'>
              <FieldContent>
                <FieldTitle>{t('components.switch.orderUpdates')}</FieldTitle>
                <FieldDescription>
                  {t('components.switch.orderUpdatesDescription')}
                </FieldDescription>
              </FieldContent>
              <Switch id='switch-order-updates' defaultChecked />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor='switch-marketing'>
            <Field orientation='horizontal'>
              <FieldContent>
                <FieldTitle>
                  {t('components.switch.marketingEmails')}
                </FieldTitle>
                <FieldDescription>
                  {t('components.switch.marketingEmailsDescription')}
                </FieldDescription>
              </FieldContent>
              <Switch id='switch-marketing' />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor='switch-digest'>
            <Field orientation='horizontal'>
              <FieldContent>
                <FieldTitle>{t('components.switch.weeklyDigest')}</FieldTitle>
                <FieldDescription>
                  {t('components.switch.weeklyDigestDescription')}
                </FieldDescription>
              </FieldContent>
              <Switch id='switch-digest' defaultChecked />
            </Field>
          </FieldLabel>
        </FieldGroup>
      </ExampleSection>

      <ExampleSection
        title={t('components.switch.sizes')}
        description={t('components.switch.sizesDescription')}
      >
        <Field orientation='horizontal' className='w-fit'>
          <Switch id='switch-size-sm' size='sm' defaultChecked />
          <FieldLabel htmlFor='switch-size-sm'>
            {t('components.switch.small')}
          </FieldLabel>
        </Field>
        <Field orientation='horizontal' className='w-fit'>
          <Switch id='switch-size-default' defaultChecked />
          <FieldLabel htmlFor='switch-size-default'>
            {t('components.switch.default')}
          </FieldLabel>
        </Field>
      </ExampleSection>

      <ExampleSection
        title={t('components.switch.states')}
        description={t('components.switch.statesDescription')}
        contentClassName='grid gap-4 sm:grid-cols-2'
      >
        <Field orientation='horizontal' data-disabled className='w-fit'>
          <Switch id='switch-disabled-off' disabled />
          <FieldLabel htmlFor='switch-disabled-off'>
            {t('components.switch.disabledOff')}
          </FieldLabel>
        </Field>
        <Field orientation='horizontal' data-disabled className='w-fit'>
          <Switch id='switch-disabled-on' disabled defaultChecked />
          <FieldLabel htmlFor='switch-disabled-on'>
            {t('components.switch.disabledOn')}
          </FieldLabel>
        </Field>
        <Field
          orientation='horizontal'
          data-invalid
          className='sm:col-span-2 max-w-sm'
        >
          <FieldContent>
            <FieldLabel htmlFor='switch-terms'>
              {t('components.switch.acceptTerms')}
            </FieldLabel>
            <FieldDescription>
              {t('components.switch.acceptTermsDescription')}
            </FieldDescription>
          </FieldContent>
          <Switch id='switch-terms' aria-invalid />
        </Field>
      </ExampleSection>
    </ExamplePage>
  );
}
