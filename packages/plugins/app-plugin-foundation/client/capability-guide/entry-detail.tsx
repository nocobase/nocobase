import { copyText, useClientApplication } from '@nocobase/app-client';
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
import { Link } from 'react-router';

import {
  capabilityPath,
  docsUrl,
  entryContent,
  entryPrerequisite,
  packageUrl,
  type CapabilityCatalog,
  type CatalogEntry,
  type EntryContent,
  type GuideContent,
} from '../../shared/capability-guide/index.js';
import { Button } from '../components/ui/button.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible.js';
import { EntryBadges, EntryIcon } from './shared.js';
import { useGuideContent } from './use-guide-content.js';

const linkButton =
  'inline-flex h-8 items-center gap-1.5 rounded-lg border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted';

/** One entry: the business problem, situations, prerequisite, prompts, and technical notes folded away. */
export function EntryDetail({
  entry,
  catalog,
  content,
  backTo,
  search,
}: {
  readonly entry: CatalogEntry | undefined;
  readonly catalog: CapabilityCatalog;
  readonly content: GuideContent;
  readonly backTo: string;
  readonly search: string;
}): ReactElement {
  const { locale } = useGuideContent();
  const routes = useRegisteredPaths();
  const back = (
    <Link
      to={backTo}
      className='-ml-1 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:hidden'
    >
      <ArrowLeft className='size-4' aria-hidden />
      {content.detail.back}
    </Link>
  );
  if (!entry)
    return (
      <div className='flex flex-col items-start gap-4 rounded-xl border border-dashed p-6'>
        {back}
        <p role='status' className='text-sm text-muted-foreground'>
          {content.detail.missing}
        </p>
      </div>
    );

  const text = entryContent(content, entry);
  const demo = entry.demo && routes.has(entry.demo) ? entry.demo : undefined;
  return (
    <article className='flex flex-col gap-6' aria-labelledby='entry-title'>
      {back}
      <header className='flex flex-col gap-3'>
        <div className='flex items-start gap-3'>
          <span className='flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary'>
            <EntryIcon entry={entry} className='size-5' />
          </span>
          <div className='flex min-w-0 flex-col gap-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <h2
                id='entry-title'
                className='font-heading text-xl font-semibold tracking-tight'
              >
                {text.title}
              </h2>
              <EntryBadges entry={entry} content={content} />
              {entry.group ? (
                <span className='text-xs text-muted-foreground'>
                  {content.groups[entry.group]}
                </span>
              ) : null}
            </div>
            <code className='font-mono text-xs text-muted-foreground'>
              {entry.packageName}
            </code>
          </div>
        </div>
        <p className='max-w-3xl text-base leading-7'>{text.summary}</p>
        {entry.docs || demo ? (
          <div className='flex flex-wrap gap-2'>
            {demo ? (
              <Link to={demo} className={linkButton}>
                <Play className='size-4' aria-hidden />
                {content.detail.demo}
              </Link>
            ) : null}
            {entry.docs ? (
              <a
                href={docsUrl(entry.docs, locale)}
                target='_blank'
                rel='noreferrer'
                className={linkButton}
              >
                <ArrowUpRight className='size-4' aria-hidden />
                {content.detail.docs}
              </a>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_15rem]'>
        <div className='flex min-w-0 flex-col gap-6'>
          <section className='flex flex-col gap-2'>
            <h3 className='text-sm font-semibold'>
              {content.detail.scenarios}
            </h3>
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
          {entry.role === 'example' ? (
            <section className='flex flex-col gap-2 rounded-xl border border-dashed p-4'>
              <h3 className='text-sm font-semibold'>
                {content.detail.adapt.title}
              </h3>
              <ol className='flex list-decimal flex-col gap-1 pl-5 text-sm leading-6 text-muted-foreground'>
                {content.detail.adapt.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </section>
          ) : null}
          <PromptEditor entry={entry} text={text} content={content} />
          <DeveloperReference entry={entry} text={text} content={content} />
        </div>

        <aside className='flex flex-col gap-6'>
          <section className='flex flex-col gap-2 rounded-xl border bg-card p-4'>
            <h3 className='text-sm font-semibold'>
              {content.detail.prerequisite}
            </h3>
            <p className='text-sm leading-6 text-muted-foreground'>
              {entryPrerequisite(content, entry)}
            </p>
          </section>
          {entry.related.length ? (
            <section className='flex flex-col gap-2'>
              <h3 className='text-sm font-semibold'>
                {content.detail.related}
              </h3>
              <ul className='flex flex-col gap-1.5'>
                {entry.related.map((id) => {
                  const related = catalog.find(id);
                  if (!related) return null;
                  return (
                    <li key={id}>
                      <Link
                        to={capabilityPath(id, search)}
                        className='flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-hover'
                      >
                        <EntryIcon
                          entry={related}
                          className='size-4 shrink-0 text-primary'
                        />
                        <span className='flex-1'>
                          {entryContent(content, related).title}
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
    </article>
  );
}

interface RouteNode {
  readonly path?: string;
  readonly children?: readonly RouteNode[];
}

/**
 * Every page path the application registered. A demo button appears only when its page is one of them: an application
 * may declare an example plugin without registering its pages, and the entry then keeps its guidance without a dead
 * link.
 */
function useRegisteredPaths(): ReadonlySet<string> {
  const { runtime } = useClientApplication();
  const paths = new Set<string>();
  const walk = (nodes: readonly RouteNode[]): void => {
    for (const node of nodes) {
      if (node.path) paths.add(node.path);
      walk(node.children ?? []);
    }
  };
  walk(runtime.routes);
  return paths;
}

type Variant = 'template' | 'example';

function PromptEditor({
  entry,
  text: entryText,
  content,
}: {
  readonly entry: CatalogEntry;
  readonly text: EntryContent;
  readonly content: GuideContent;
}): ReactElement {
  const prompts = entryText.prompts as Readonly<
    Record<string, EntryContent['prompts'][string] | undefined>
  >;
  const [current, setCurrent] = useState(entry.prompts[0] ?? 'main');
  const [variant, setVariant] = useState<Variant>('template');
  const [edits, setEdits] = useState<Readonly<Record<string, string>>>({});
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const prompt = prompts[current];
  const hasExample = Boolean(prompt?.example);
  const shownVariant: Variant = hasExample ? variant : 'template';
  const key = `${current}:${shownVariant}`;
  const original =
    (shownVariant === 'example' ? prompt?.example : prompt?.template) ?? '';
  const value = edits[key] ?? original;

  async function copy(): Promise<void> {
    try {
      setStatus((await copyText(value)) ? 'copied' : 'failed');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex flex-col gap-1'>
        <h3 className='text-sm font-semibold'>{content.detail.prompts}</h3>
        <p className='text-xs leading-5 text-muted-foreground'>
          {content.detail.promptHint}
        </p>
      </div>
      {entry.prompts.length > 1 ? (
        <div
          role='tablist'
          aria-label={content.detail.prompts}
          className='flex flex-wrap gap-1.5'
        >
          {entry.prompts.map((id) => (
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
      {hasExample ? (
        <div
          role='radiogroup'
          aria-label={prompt?.label}
          className='flex w-fit gap-1 rounded-lg bg-muted p-1 text-xs'
        >
          {(['template', 'example'] as const).map((option) => (
            <button
              key={option}
              type='button'
              role='radio'
              aria-checked={shownVariant === option}
              onClick={() => {
                setVariant(option);
                setStatus('idle');
              }}
              className='rounded-md px-2 py-1 text-muted-foreground aria-checked:bg-background aria-checked:font-medium aria-checked:text-foreground aria-checked:shadow-sm'
            >
              {option === 'template'
                ? content.detail.template
                : content.detail.example}
            </button>
          ))}
        </div>
      ) : null}
      <textarea
        aria-label={prompt?.label ?? content.detail.prompts}
        value={value}
        onChange={(event) => {
          setEdits({ ...edits, [key]: event.target.value });
          setStatus('idle');
        }}
        rows={Math.min(16, Math.max(6, value.split('\n').length + 2))}
        className='field-sizing-content max-h-[32rem] min-h-40 w-full resize-y rounded-xl border bg-primary/5 p-4 text-sm leading-7 outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
      />
      <div className='flex flex-wrap items-center gap-2'>
        <Button onClick={() => void copy()}>
          {status === 'copied' ? <Check aria-hidden /> : <Copy aria-hidden />}
          {content.detail.copy}
        </Button>
        {value !== original ? (
          <Button
            variant='ghost'
            onClick={() => {
              const { [key]: _removed, ...rest } = edits;
              setEdits(rest);
              setStatus('idle');
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
            status === 'failed' ? 'text-destructive' : 'text-muted-foreground',
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
  entry,
  text,
  content,
}: {
  readonly entry: CatalogEntry;
  readonly text: EntryContent;
  readonly content: GuideContent;
}): ReactElement {
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
        <ReferenceList
          title={content.detail.packageName}
          items={[entry.packageName]}
        />
        {entry.covers.length ? (
          <ReferenceList title={content.detail.covers} items={entry.covers} />
        ) : null}
        {entry.skills.length ? (
          <ReferenceList title={content.detail.skills} items={entry.skills} />
        ) : null}
        <ol className='flex list-decimal flex-col gap-1 pl-5 leading-6 text-muted-foreground'>
          {text.reference.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <a
          href={packageUrl(entry.packageName)}
          target='_blank'
          rel='noreferrer'
          className='inline-flex w-fit items-center gap-1 text-primary hover:underline'
        >
          <ArrowUpRight className='size-4' aria-hidden />
          {content.detail.source}
        </a>
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
      <h4 className='text-xs font-medium text-muted-foreground'>{title}</h4>
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
