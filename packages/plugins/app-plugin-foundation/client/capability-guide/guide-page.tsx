import { ChevronRight, Search } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link } from 'react-router';

import {
  CAPABILITIES,
  CAPABILITY_GROUP_IDS,
  capabilityPath,
  format,
  type CapabilityGroupId,
  type GuideCapability,
  type GuideContent,
} from '../../shared/capability-guide/index.js';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { CapabilityIcon, PrerequisiteBadge } from './shared.js';
import { useGuideContent } from './use-guide-content.js';

function searchText(
  capability: GuideCapability,
  content: GuideContent,
): string {
  const text = content.capabilities[capability.id];
  if (!text) return capability.id;
  return [
    text.title,
    text.summary,
    ...text.scenarios,
    ...Object.values(text.prompts).map((prompt) => prompt.label),
    content.groups[capability.group].title,
  ]
    .join(' ')
    .toLocaleLowerCase();
}

/** The capability guide: how to ask for something, then every capability grouped by the business problem it solves. */
export function CapabilityGuidePage(): ReactElement {
  const { content } = useGuideContent();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<CapabilityGroupId | 'all'>('all');
  const normalized = query.trim().toLocaleLowerCase();
  const visible = CAPABILITIES.filter(
    (capability) =>
      (group === 'all' || capability.group === group) &&
      (!normalized || searchText(capability, content).includes(normalized)),
  );
  const groups = CAPABILITY_GROUP_IDS.filter((id) =>
    visible.some((capability) => capability.group === id),
  );

  return (
    <div className='mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-8'>
      <header className='flex flex-col gap-2'>
        <h1 className='font-heading text-2xl font-semibold tracking-tight'>
          {content.page.title}
        </h1>
        <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>
          {content.page.description}
        </p>
      </header>

      <section
        aria-labelledby='guide-request'
        className='rounded-2xl border bg-linear-to-br from-primary/5 via-card to-card p-5 md:p-6'
      >
        <h2 id='guide-request' className='text-base font-medium'>
          {content.page.requestTitle}
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          {content.page.requestHint}
        </p>
        <ol className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
          {content.page.requestParts.map((part, index) => (
            <li
              key={part.title}
              className='flex gap-3 rounded-xl border border-primary/10 bg-card p-3'
            >
              <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary'>
                {index + 1}
              </span>
              <span className='flex min-w-0 flex-col gap-0.5'>
                <span className='text-sm font-medium'>{part.title}</span>
                <span className='text-xs leading-5 text-muted-foreground'>
                  {part.example}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <nav aria-label={content.page.title} className='flex flex-wrap gap-1.5'>
          {(['all', ...CAPABILITY_GROUP_IDS] as const).map((id) => (
            <button
              key={id}
              type='button'
              aria-pressed={group === id}
              onClick={() => setGroup(id)}
              className='rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-hover aria-pressed:border-primary/30 aria-pressed:bg-primary/10 aria-pressed:text-primary'
            >
              {id === 'all' ? content.page.all : content.groups[id].title}
            </button>
          ))}
        </nav>
        <div className='relative md:w-80'>
          <Search
            className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground'
            aria-hidden
          />
          <Input
            type='search'
            className='h-9 bg-background pl-9'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={content.page.search}
            placeholder={content.page.search}
          />
        </div>
      </div>

      {groups.length ? (
        groups.map((id) => (
          <section
            key={id}
            aria-labelledby={`guide-group-${id}`}
            className='flex flex-col gap-3'
          >
            <div className='flex flex-col gap-0.5'>
              <h2 id={`guide-group-${id}`} className='text-base font-medium'>
                {content.groups[id].title}
              </h2>
              <p className='text-sm text-muted-foreground'>
                {content.groups[id].description}
              </p>
            </div>
            <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
              {visible
                .filter((capability) => capability.group === id)
                .map((capability) => (
                  <li key={capability.id} className='flex'>
                    <CapabilityCard capability={capability} content={content} />
                  </li>
                ))}
            </ul>
          </section>
        ))
      ) : (
        <div
          role='status'
          className='flex flex-col items-start gap-3 rounded-xl border border-dashed p-6 text-sm text-muted-foreground'
        >
          <p>{content.page.noResults}</p>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              setQuery('');
              setGroup('all');
            }}
          >
            {content.page.clear}
          </Button>
        </div>
      )}
      <p className='text-xs text-muted-foreground'>
        {format(content.page.count, { count: CAPABILITIES.length })}
      </p>
    </div>
  );
}

function CapabilityCard({
  capability,
  content,
}: {
  readonly capability: GuideCapability;
  readonly content: GuideContent;
}): ReactElement {
  const text = content.capabilities[capability.id];
  return (
    <Link
      to={capabilityPath(capability.id)}
      className='group flex w-full flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-[translate,box-shadow,background-color] duration-200 outline-none hover:-translate-y-0.5 hover:bg-hover hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
    >
      <span className='flex items-start justify-between gap-2'>
        <span className='flex size-9 items-center justify-center rounded-lg bg-primary/5 text-primary'>
          <CapabilityIcon id={capability.id} className='size-4' />
        </span>
        <PrerequisiteBadge
          prerequisite={capability.prerequisite}
          label={content.prerequisites[capability.prerequisite]}
        />
      </span>
      <span className='flex flex-col gap-1'>
        <span className='text-sm font-medium'>{text?.title}</span>
        <span className='text-sm leading-6 text-muted-foreground'>
          {text?.summary}
        </span>
      </span>
      <span className='mt-auto flex items-center justify-between text-xs text-muted-foreground group-hover:text-foreground'>
        {content.home.open} · {capability.prompts.length}
        <ChevronRight
          className='size-4 transition-transform group-hover:translate-x-0.5'
          aria-hidden
        />
      </span>
    </Link>
  );
}

export default CapabilityGuidePage;
