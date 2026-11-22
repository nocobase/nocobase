import { useTranslation } from '@nocobase/i18n/client';
import {
  CheckIcon,
  CopyIcon,
  MessageSquareTextIcon,
  SparklesIcon,
} from 'lucide-react';
import { type ReactElement } from 'react';

import { PageContainer } from '#components/page-container';
import { Button } from '#components/ui/button';

import { useCopy } from './use-copy.js';

const STEPS = ['describe', 'build', 'review'] as const;

export default function HomePage(): ReactElement {
  return (
    <PageContainer>
      <AgentIntro />
    </PageContainer>
  );
}

/** The first part of the page: development here happens by asking a coding agent, which the steps and sample show. */
function AgentIntro(): ReactElement {
  const { t } = useTranslation();
  const { copied, copy } = useCopy();
  const example = t('home.example.text');

  return (
    <section className='grid gap-8 rounded-2xl border border-border bg-linear-to-br from-primary/5 via-card to-card p-6 md:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-4'>
          <p className='flex items-center gap-2 text-sm font-medium text-primary'>
            <SparklesIcon className='size-4' aria-hidden />
            {t('home.platform')}
          </p>
          <h1 className='font-heading text-3xl font-semibold tracking-[-0.035em] text-balance md:text-4xl'>
            {t('home.title')}
          </h1>
          <p className='text-base leading-7 text-muted-foreground'>
            {t('home.description')}
          </p>
        </div>
        <ol className='flex flex-col gap-3'>
          {STEPS.map((step, index) => (
            <li key={step} className='flex gap-3'>
              <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary'>
                {index + 1}
              </span>
              <div className='flex flex-col gap-0.5'>
                <span className='text-sm font-medium'>
                  {t(`home.steps.${step}.title`)}
                </span>
                <span className='text-sm text-muted-foreground'>
                  {t(`home.steps.${step}.description`)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <figure className='flex flex-col overflow-hidden rounded-xl border border-primary/10 bg-card shadow-sm'>
        <figcaption className='flex items-center justify-between gap-2 border-b border-primary/10 px-4 py-2.5'>
          <span className='flex items-center gap-2 text-sm font-medium'>
            <MessageSquareTextIcon
              className='size-4 text-primary'
              aria-hidden
            />
            {t('home.example.title')}
          </span>
          <Button variant='ghost' size='sm' onClick={() => void copy(example)}>
            {copied ? (
              <CheckIcon data-icon='inline-start' />
            ) : (
              <CopyIcon data-icon='inline-start' />
            )}
            {copied ? t('home.prompt.copiedShort') : t('home.prompt.copy')}
          </Button>
        </figcaption>
        <p className='bg-primary/5 px-4 py-4 text-sm leading-7 whitespace-pre-line'>
          {example}
        </p>
        <p className='border-t border-primary/10 px-4 py-2.5 text-xs text-muted-foreground'>
          {t('home.example.hint')}
        </p>
      </figure>
    </section>
  );
}
