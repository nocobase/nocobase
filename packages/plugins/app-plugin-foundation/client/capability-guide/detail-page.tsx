import { copyText } from '@nocobase/app-client';
import { cn } from 'cn';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, useParams } from 'react-router';

import {
  capabilityContent,
  CAPABILITY_GUIDE_PATH,
  capabilityPath,
  docsUrl,
  findCapability,
  type GuideCapability,
  type GuideContent,
} from '../../shared/capability-guide/index.js';
import { Button } from '../components/ui/button.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible.js';
import { CapabilityIcon, PrerequisiteBadge } from './shared.js';
import { useGuideContent } from './use-guide-content.js';

const linkButton =
  'inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted';

/** One capability: what it solves, typical situations, prompts to edit and copy, and where to read more. */
export function CapabilityDetailPage(): ReactElement {
  const { capabilityId = '' } = useParams();
  const { content, locale } = useGuideContent();
  const capability = findCapability(capabilityId);
  const text = capability
    ? capabilityContent(content, capability.id)
    : undefined;

  if (!capability || !text)
    return (
      <div className='mx-auto flex w-full max-w-4xl flex-col items-start gap-4 p-4 md:p-8'>
        <p role='status' className='text-sm text-muted-foreground'>
          {content.detail.missing}
        </p>
        <Link to={CAPABILITY_GUIDE_PATH} className={linkButton}>
          <ArrowLeft className='size-4' aria-hidden />
          {content.detail.back}
        </Link>
      </div>
    );
  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-8'>
      <Link
        to={CAPABILITY_GUIDE_PATH}
        className='-ml-1 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='size-4' aria-hidden />
        {content.detail.back}
      </Link>

      <header className='flex flex-col gap-4'>
        <div className='flex items-center gap-3'>
          <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary'>
            <CapabilityIcon id={capability.id} className='size-5' />
          </span>
          <div className='flex min-w-0 flex-wrap items-center gap-2'>
            <h1 className='font-heading text-2xl font-semibold tracking-tight'>
              {text.title}
            </h1>
            <PrerequisiteBadge
              prerequisite={capability.prerequisite}
              label={content.prerequisites[capability.prerequisite]}
            />
          </div>
        </div>
        <p className='max-w-2xl text-base leading-7'>{text.summary}</p>
        <div className='flex flex-wrap gap-2'>
          <a
            href={docsUrl(capability.docs, locale)}
            target='_blank'
            rel='noreferrer'
            className={linkButton}
          >
            <ArrowUpRight className='size-4' aria-hidden />
            {content.detail.docs}
          </a>
          {capability.demo ? (
            <Link
              to={capability.demo}
              className={linkButton}
              title={content.detail.demoHint}
            >
              <Play className='size-4' aria-hidden />
              {content.detail.demo}
            </Link>
          ) : null}
        </div>
      </header>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]'>
        <div className='flex min-w-0 flex-col gap-6'>
          <section className='flex flex-col gap-2'>
            <h2 className='text-sm font-semibold'>
              {content.detail.scenarios}
            </h2>
            <ul className='flex flex-col gap-1.5 text-sm leading-6 text-muted-foreground'>
              {text.scenarios.map((scenario) => (
                <li key={scenario} className='flex gap-2'>
                  <span
                    className='mt-2.5 size-1.5 shrink-0 rounded-full bg-primary/50'
                    aria-hidden
                  />
                  {scenario}
                </li>
              ))}
            </ul>
          </section>
          <PromptEditor
            key={capability.id}
            capability={capability}
            content={content}
          />
          <DeveloperReference capability={capability} content={content} />
        </div>

        <aside className='flex flex-col gap-6'>
          <section className='flex flex-col gap-2 rounded-xl border bg-card p-4'>
            <h2 className='text-sm font-semibold'>
              {content.detail.prerequisite}
            </h2>
            <p className='text-sm leading-6 text-muted-foreground'>
              {text.prerequisite}
            </p>
          </section>
          {capability.related.length ? (
            <section className='flex flex-col gap-2'>
              <h2 className='text-sm font-semibold'>
                {content.detail.related}
              </h2>
              <ul className='flex flex-col gap-1.5'>
                {capability.related.map((id) => {
                  return (
                    <li key={id}>
                      <Link
                        to={capabilityPath(id)}
                        className='flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-hover'
                      >
                        <CapabilityIcon
                          id={id}
                          className='size-4 text-primary'
                        />
                        <span className='flex-1'>
                          {capabilityContent(content, id)?.title}
                        </span>
                        <ChevronRight
                          className='size-4 text-muted-foreground'
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function PromptEditor({
  capability,
  content,
}: {
  readonly capability: GuideCapability;
  readonly content: GuideContent;
}): ReactElement {
  const prompts = capabilityContent(content, capability.id)?.prompts ?? {};
  const [current, setCurrent] = useState(capability.prompts[0] ?? '');
  const [edits, setEdits] = useState<Readonly<Record<string, string>>>({});
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const defaultText = prompts[current]?.text ?? '';
  const text = edits[current] ?? defaultText;

  async function copy(): Promise<void> {
    try {
      setStatus((await copyText(text)) ? 'copied' : 'failed');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1'>
        <h2 className='text-sm font-semibold'>{content.detail.prompts}</h2>
        <p className='text-xs leading-5 text-muted-foreground'>
          {content.detail.promptHint}
        </p>
      </div>
      {capability.prompts.length > 1 ? (
        <div role='tablist' className='flex flex-wrap gap-1.5'>
          {capability.prompts.map((id) => (
            <button
              key={id}
              type='button'
              role='tab'
              aria-selected={current === id}
              onClick={() => {
                setCurrent(id);
                setStatus('idle');
              }}
              className='rounded-lg border px-2.5 py-1 text-sm text-muted-foreground hover:bg-hover aria-selected:border-primary/30 aria-selected:bg-primary/10 aria-selected:text-primary'
            >
              {prompts[id]?.label ?? id}
            </button>
          ))}
        </div>
      ) : null}
      <textarea
        aria-label={prompts[current]?.label ?? content.detail.prompts}
        value={text}
        onChange={(event) => {
          setEdits({ ...edits, [current]: event.target.value });
          setStatus('idle');
        }}
        rows={Math.min(14, Math.max(6, text.split('\n').length + 2))}
        className='w-full resize-y rounded-xl border bg-primary/5 p-4 text-sm leading-7 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
      />
      <div className='flex flex-wrap items-center gap-2'>
        <Button onClick={() => void copy()}>
          {status === 'copied' ? <Check aria-hidden /> : <Copy aria-hidden />}
          {status === 'copied' ? content.detail.copied : content.detail.copy}
        </Button>
        {text !== defaultText ? (
          <Button
            variant='ghost'
            onClick={() => {
              const { [current]: _removed, ...rest } = edits;
              setEdits(rest);
            }}
          >
            <RotateCcw aria-hidden />
            {content.detail.reset}
          </Button>
        ) : null}
        <span
          role='status'
          className={cn(
            'text-xs',
            status === 'failed' ? 'text-destructive' : 'sr-only',
          )}
        >
          {status === 'failed'
            ? content.detail.copyFailed
            : status === 'copied'
              ? content.detail.copied
              : ''}
        </span>
      </div>
    </section>
  );
}

function DeveloperReference({
  capability,
  content,
}: {
  readonly capability: GuideCapability;
  readonly content: GuideContent;
}): ReactElement {
  const { packages, skills } = capability.reference;
  return (
    <Collapsible className='rounded-xl border'>
      <CollapsibleTrigger className='group flex w-full items-center justify-between px-4 py-3 text-sm font-medium'>
        {content.detail.reference}
        <ChevronDown
          className='size-4 text-muted-foreground transition-transform group-data-[panel-open]:rotate-180'
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className='flex flex-col gap-3 border-t px-4 py-3 text-sm'>
        {packages.length || skills.length ? (
          <>
            {packages.length ? (
              <ReferenceList title={content.detail.packages} items={packages} />
            ) : null}
            {skills.length ? (
              <ReferenceList title={content.detail.skills} items={skills} />
            ) : null}
          </>
        ) : (
          <p className='text-muted-foreground'>
            {content.detail.applicationOwned}
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

function ReferenceList({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly string[];
}): ReactElement {
  return (
    <div className='flex flex-col gap-1.5'>
      <h3 className='text-xs font-medium text-muted-foreground'>{title}</h3>
      <ul className='flex flex-wrap gap-1.5'>
        {items.map((item) => (
          <li key={item}>
            <code className='rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs'>
              {item}
            </code>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CapabilityDetailPage;
