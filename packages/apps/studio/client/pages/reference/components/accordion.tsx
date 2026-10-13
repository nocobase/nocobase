import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

import { ExamplePage, ExampleSection } from '../shared';

const orderSections = ['items', 'shipping', 'payment'];

export default function AccordionExamplePage(): ReactElement {
  const { t } = useTranslation();
  const [openSections, setOpenSections] = useState<string[]>(['items']);

  return (
    <ExamplePage
      title={t('components.accordion.title')}
      description={t('components.accordion.description')}
      docs='https://ui.shadcn.com/docs/components/accordion'
    >
      <ExampleSection
        title={t('components.accordion.basic')}
        description={t('components.accordion.basicDescription')}
        contentClassName='block'
      >
        <Accordion defaultValue={['shipping']} className='max-w-lg'>
          <AccordionItem value='shipping'>
            <AccordionTrigger>
              {t('components.accordion.faqShippingQuestion')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.faqShippingAnswer')}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='returns'>
            <AccordionTrigger>
              {t('components.accordion.faqReturnsQuestion')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.faqReturnsAnswer')}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='support'>
            <AccordionTrigger>
              {t('components.accordion.faqSupportQuestion')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.faqSupportAnswer')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ExampleSection>

      <ExampleSection
        title={t('components.accordion.multiple')}
        description={t('components.accordion.multipleDescription')}
        contentClassName='block'
      >
        <Accordion
          multiple
          defaultValue={['notifications']}
          className='max-w-lg'
        >
          <AccordionItem value='notifications'>
            <AccordionTrigger>
              {t('components.accordion.settingsNotifications')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.settingsNotificationsBody')}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='privacy'>
            <AccordionTrigger>
              {t('components.accordion.settingsPrivacy')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.settingsPrivacyBody')}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='billing'>
            <AccordionTrigger>
              {t('components.accordion.settingsBilling')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.settingsBillingBody')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ExampleSection>

      <ExampleSection
        title={t('components.accordion.disabled')}
        description={t('components.accordion.disabledDescription')}
        contentClassName='block'
      >
        <Accordion className='max-w-lg'>
          <AccordionItem value='history'>
            <AccordionTrigger>
              {t('components.accordion.historyQuestion')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.historyAnswer')}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='premium' disabled>
            <AccordionTrigger>
              {t('components.accordion.premiumQuestion')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.premiumAnswer')}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='email'>
            <AccordionTrigger>
              {t('components.accordion.emailQuestion')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.emailAnswer')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ExampleSection>

      <ExampleSection
        title={t('components.accordion.bordered')}
        description={t('components.accordion.borderedDescription')}
        contentClassName='block'
      >
        <Accordion
          defaultValue={['billing']}
          className='max-w-lg rounded-lg border'
        >
          <AccordionItem value='billing' className='px-4'>
            <AccordionTrigger>
              {t('components.accordion.billingQuestion')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.billingAnswer')}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='security' className='px-4'>
            <AccordionTrigger>
              {t('components.accordion.securityQuestion')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.securityAnswer')}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='integrations' className='px-4'>
            <AccordionTrigger>
              {t('components.accordion.integrationsQuestion')}
            </AccordionTrigger>
            <AccordionContent>
              {t('components.accordion.integrationsAnswer')}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ExampleSection>

      <ExampleSection
        title={t('components.accordion.controlled')}
        description={t('components.accordion.controlledDescription')}
        contentClassName='block space-y-3'
      >
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setOpenSections([...orderSections])}
          >
            {t('components.accordion.expandAll')}
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setOpenSections([])}
          >
            {t('components.accordion.collapseAll')}
          </Button>
        </div>
        <Accordion
          multiple
          value={openSections}
          onValueChange={(value: string[]) => setOpenSections(value)}
          className='max-w-lg'
        >
          <AccordionItem value='items'>
            <AccordionTrigger>
              {t('components.accordion.orderItems')}
            </AccordionTrigger>
            <AccordionContent>
              <ul className='space-y-1.5'>
                <li className='flex justify-between gap-4'>
                  <span>2 × Studio Headphones</span>
                  <span className='tabular-nums'>$398.00</span>
                </li>
                <li className='flex justify-between gap-4'>
                  <span>1 × USB-C Dock</span>
                  <span className='tabular-nums'>$129.00</span>
                </li>
                <li className='flex justify-between gap-4 border-t pt-1.5 font-medium'>
                  <span>{t('reference.total')}</span>
                  <span className='tabular-nums'>$527.00</span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='shipping'>
            <AccordionTrigger>
              {t('components.accordion.orderShipping')}
            </AccordionTrigger>
            <AccordionContent>
              <p>Olivia Martin</p>
              <p className='text-muted-foreground'>
                100 Market St, San Francisco, CA 94105
              </p>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value='payment'>
            <AccordionTrigger>
              {t('components.accordion.orderPayment')}
            </AccordionTrigger>
            <AccordionContent>
              <p>Visa •••• 4242</p>
              <p className='text-muted-foreground'>
                {t('reference.statusPaid')} · Sep 12, 2026
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ExampleSection>
    </ExamplePage>
  );
}
