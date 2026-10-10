import { useTranslation } from '@nocobase/i18n/client';
import {
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  MessageSquareTextIcon,
  SparklesIcon,
} from 'lucide-react';
import { type ReactElement, useState } from 'react';

import { PageContainer } from '#components/page-container';
import { Button } from '#components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#components/ui/card';

import { CAPABILITIES, type Capability } from './capabilities.js';
import { PromptDialog } from './prompt-dialog.js';
import { useCopy } from './use-copy.js';

const STEPS = ['describe', 'build', 'review'] as const;

export default function HomePage(): ReactElement {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Capability>();
  const [open, setOpen] = useState(false);
  // Changes on every opening, so the dialog remounts and drops the edits of the previous one.
  const [openCount, setOpenCount] = useState(0);

  const openCapability = (capability: Capability): void => {
    setSelected(capability);
    setOpenCount((count) => count + 1);
    setOpen(true);
  };

  return (
    <PageContainer className='mx-auto max-w-6xl'>
      <AgentIntro />
      <section
        aria-labelledby='home-capabilities'
        className='flex flex-col gap-4'
      >
        <div className='flex flex-col gap-1'>
          <h2 id='home-capabilities' className='text-base font-medium'>
            {t('home.capabilitiesTitle')}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {t('home.capabilitiesDescription')}
          </p>
        </div>
        <ul className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {CAPABILITIES.map((capability) => (
            <li key={capability.id} className='flex'>
              <CapabilityCard
                capability={capability}
                onOpen={() => openCapability(capability)}
              />
            </li>
          ))}
        </ul>
      </section>
      {selected ? (
        <PromptDialog
          key={openCount}
          capability={selected}
          open={open}
          onOpenChange={setOpen}
        />
      ) : null}
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
              <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground'>
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
      <figure className='flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm'>
        <figcaption className='flex items-center justify-between gap-2 border-b border-border px-4 py-2.5'>
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
        <p className='px-4 py-4 text-sm leading-6 whitespace-pre-line'>
          {example}
        </p>
        <p className='border-t border-border bg-muted/50 px-4 py-2.5 text-xs text-muted-foreground'>
          {t('home.example.hint')}
        </p>
      </figure>
    </section>
  );
}

function CapabilityCard({
  capability,
  onOpen,
}: {
  readonly capability: Capability;
  readonly onOpen: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const prefix = `home.capabilities.${capability.id}`;
  const Icon = capability.icon;

  return (
    <button
      type='button'
      onClick={onOpen}
      className='group flex w-full cursor-pointer rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
    >
      <Card className='w-full transition-[translate,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:ring-foreground/20 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0'>
        <CardHeader className='gap-3'>
          {/* The chip only deepens its tint on hover rather than inverting: swapping a light background and a dark icon
              passes both through the same color halfway, where the icon vanishes for a moment and reads as a flicker. */}
          <span className='flex size-9 items-center justify-center rounded-lg bg-primary/5 text-primary ring-1 ring-transparent transition-[background-color,box-shadow] duration-200 ease-out group-hover:bg-primary/10 group-hover:ring-primary/20 motion-reduce:transition-none'>
            <Icon
              className='size-4 transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none'
              aria-hidden
            />
          </span>
          <div className='flex flex-col gap-1'>
            <CardTitle>{t(`${prefix}.title`)}</CardTitle>
            <CardDescription className='leading-6'>
              {t(`${prefix}.description`)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardFooter className='mt-auto justify-between text-sm text-muted-foreground transition-colors duration-200 ease-out group-hover:text-foreground'>
          {t('home.viewPrompts', { count: capability.prompts.length })}
          <ArrowRightIcon
            className='size-4 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none'
            aria-hidden
          />
        </CardFooter>
      </Card>
    </button>
  );
}
