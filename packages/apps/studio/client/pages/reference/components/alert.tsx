import { useTranslation } from '@nocobase/i18n/client';
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  HardDriveIcon,
  InfoIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import { ExamplePage, ExampleSection } from '../shared';

export default function AlertExamplePage(): ReactElement {
  const { t } = useTranslation();

  return (
    <ExamplePage
      title={t('components.alert.title')}
      description={t('components.alert.description')}
      docs='https://ui.shadcn.com/docs/components/alert'
    >
      <ExampleSection
        title={t('components.alert.basic')}
        description={t('components.alert.basicDescription')}
        contentClassName='grid gap-4'
      >
        <Alert className='max-w-md'>
          <CheckCircle2Icon />
          <AlertTitle>{t('components.alert.paymentReceivedTitle')}</AlertTitle>
          <AlertDescription>
            {t('components.alert.paymentReceivedDescription', {
              amount: '$1,240.00',
              invoice: 'INV-2031',
            })}
          </AlertDescription>
        </Alert>
        <Alert className='max-w-md'>
          <InfoIcon />
          <AlertTitle>{t('components.alert.maintenanceTitle')}</AlertTitle>
          <AlertDescription>
            {t('components.alert.maintenanceDescription')}
          </AlertDescription>
        </Alert>
      </ExampleSection>

      <ExampleSection
        title={t('components.alert.destructive')}
        description={t('components.alert.destructiveDescription')}
        contentClassName='grid gap-4'
      >
        <Alert variant='destructive' className='max-w-md'>
          <AlertCircleIcon />
          <AlertTitle>{t('components.alert.paymentFailedTitle')}</AlertTitle>
          <AlertDescription>
            {t('components.alert.paymentFailedDescription')}
          </AlertDescription>
        </Alert>
        <Alert variant='destructive' className='max-w-md'>
          <AlertCircleIcon />
          <AlertTitle>{t('components.alert.syncStoppedTitle')}</AlertTitle>
          <AlertDescription>
            <p>{t('components.alert.syncStoppedDescription')}</p>
            <ul className='list-inside list-disc text-sm'>
              <li>{t('components.alert.syncStoppedReasonToken')}</li>
              <li>{t('components.alert.syncStoppedReasonPermissions')}</li>
            </ul>
          </AlertDescription>
        </Alert>
      </ExampleSection>

      <ExampleSection
        title={t('components.alert.withoutIcon')}
        description={t('components.alert.withoutIconDescription')}
        contentClassName='grid gap-4'
      >
        <Alert className='max-w-md'>
          <AlertTitle>{t('components.alert.titleOnly')}</AlertTitle>
        </Alert>
        <Alert className='max-w-md'>
          <AlertDescription>
            {t('components.alert.descriptionOnly')}
          </AlertDescription>
        </Alert>
      </ExampleSection>

      <ExampleSection
        title={t('components.alert.withAction')}
        description={t('components.alert.withActionDescription')}
        contentClassName='grid gap-4'
      >
        <Alert className='max-w-md'>
          <HardDriveIcon />
          <AlertTitle>
            {t('components.alert.storageTitle', { percent: '92%' })}
          </AlertTitle>
          <AlertDescription>
            {t('components.alert.storageDescription')}
          </AlertDescription>
          <AlertAction>
            <Button size='xs'>{t('components.alert.manageStorage')}</Button>
          </AlertAction>
        </Alert>
        <Alert className='max-w-md'>
          <DownloadIcon />
          <AlertTitle>{t('components.alert.exportReadyTitle')}</AlertTitle>
          <AlertDescription>
            {t('components.alert.exportReadyDescription', {
              file: 'customers-2026-09.csv',
            })}
          </AlertDescription>
          <AlertAction>
            <Button size='xs' variant='outline'>
              {t('reference.download')}
            </Button>
          </AlertAction>
        </Alert>
        <Alert variant='destructive' className='max-w-md'>
          <AlertCircleIcon />
          <AlertTitle>{t('components.alert.webhookFailedTitle')}</AlertTitle>
          <AlertDescription>
            {t('components.alert.webhookFailedDescription')}
          </AlertDescription>
          <AlertAction>
            <Button size='xs' variant='outline'>
              {t('components.alert.retry')}
            </Button>
          </AlertAction>
        </Alert>
      </ExampleSection>

      <ExampleSection
        title={t('components.alert.inForm')}
        description={t('components.alert.inFormDescription')}
        contentClassName='block'
      >
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>{t('components.alert.formTitle')}</CardTitle>
            <CardDescription>
              {t('components.alert.formDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert variant='destructive'>
              <AlertCircleIcon />
              <AlertTitle>{t('components.alert.formErrorTitle')}</AlertTitle>
              <AlertDescription>
                {t('components.alert.formErrorDescription')}
              </AlertDescription>
            </Alert>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor='alert-form-name'>
                  {t('reference.name')}
                </FieldLabel>
                <Input id='alert-form-name' defaultValue='Acme Inc.' />
              </Field>
              <Field data-invalid>
                <FieldLabel htmlFor='alert-form-email'>
                  {t('reference.email')}
                </FieldLabel>
                <Input
                  id='alert-form-email'
                  type='email'
                  defaultValue='billing@acme'
                  aria-invalid
                />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className='justify-end gap-2'>
            <Button variant='outline'>{t('reference.cancel')}</Button>
            <Button>{t('reference.save')}</Button>
          </CardFooter>
        </Card>
      </ExampleSection>
    </ExamplePage>
  );
}
