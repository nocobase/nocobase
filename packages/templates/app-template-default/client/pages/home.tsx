import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import {
  Database,
  MessageSquareText,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#components/ui/card';

export default function HomePage(): ReactElement {
  const { t } = useTranslation();
  return (
    <PageContainer className='mx-auto max-w-5xl'>
      <div className='flex flex-col gap-4'>
        <div className='flex items-center gap-2 text-sm font-medium text-primary'>
          <Sparkles aria-hidden='true' className='size-4' />
          {t('home.platform')}
        </div>
        <PageHeader
          title={t('home.title')}
          description={t('home.description')}
        />
      </div>
      <div className='grid gap-4 md:grid-cols-3'>
        {(
          [
            ['pages', PanelsTopLeft],
            ['data', Database],
            ['workflows', Workflow],
          ] as const
        ).map(([feature, Icon]) => (
          <Card key={feature}>
            <CardHeader className='gap-3'>
              <div className='flex size-10 items-center justify-center rounded-lg bg-primary/5 text-primary'>
                <Icon aria-hidden='true' className='size-4' />
              </div>
              <CardTitle>
                <h2>{t(`home.${feature}.title`)}</h2>
              </CardTitle>
              <CardDescription>
                {t(`home.${feature}.description`)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-sm leading-6 text-muted-foreground'>
                {t(`home.${feature}.examples`)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className='flex items-center gap-2'>
              <MessageSquareText
                aria-hidden='true'
                className='size-4 text-primary'
              />
              {t('home.startTitle')}
            </h2>
          </CardTitle>
          <CardDescription>{t('home.startDescription')}</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-4'>
          <blockquote className='rounded-lg border border-primary/10 bg-primary/5 p-4 text-sm leading-7'>
            {t('home.examplePrompt')}
          </blockquote>
          <p className='text-sm text-muted-foreground'>{t('home.startHint')}</p>
        </CardContent>
      </Card>
      <p className='flex items-start gap-2 text-sm leading-6 text-muted-foreground'>
        <ShieldCheck aria-hidden='true' className='mt-1 size-4 shrink-0' />
        {t('home.foundation')}
      </p>
    </PageContainer>
  );
}
