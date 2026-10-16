import type { ChatAgent } from '@nocobase/app-plugin-agents/shared/conversations';
import { useState, type ReactElement } from 'react';

import {
  AgentIdentity,
  AgentPicker,
  AgentTag,
  AvailabilityDot,
} from '#components/agent-picker';

const online = { online: true, reason: null, onlineRunners: 1 } as const;

const AGENTS: readonly ChatAgent[] = [
  {
    id: 'assistant',
    name: 'Claude · Sonnet 5',
    description: 'Everyday coding and writing.',
    nameText: null,
    descriptionText: null,
    avatar: null,
    isSystemDefault: false,
    isMyDefault: true,
    availability: online,
    personalOnly: false,
  },
  {
    id: 'writer',
    name: 'Codex · GPT-5',
    description: null,
    nameText: null,
    descriptionText: null,
    avatar: null,
    isSystemDefault: false,
    isMyDefault: false,
    availability: {
      online: false,
      reason: 'othersPersonal',
      onlineRunners: 0,
    },
    personalOnly: true,
  },
  {
    id: 'coder',
    name: 'Claude · Opus 5',
    description: 'Long refactors and reviews.',
    nameText: null,
    descriptionText: null,
    avatar: null,
    isSystemDefault: true,
    isMyDefault: false,
    availability: online,
    personalOnly: false,
  },
  {
    id: 'reviewer',
    name: 'Gemini · 3 Pro',
    description: null,
    nameText: null,
    descriptionText: null,
    avatar: null,
    isSystemDefault: false,
    isMyDefault: false,
    availability: { online: false, reason: 'noRunner', onlineRunners: 0 },
    personalOnly: false,
  },
];

function Section({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly children: ReactElement;
}): ReactElement {
  return (
    <section className='flex flex-col gap-3 rounded-xl border bg-card p-4'>
      <div>
        <h2 className='text-sm font-medium'>{title}</h2>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>
      {children}
    </section>
  );
}

/**
 * The agent picker in its two appearances: a form field (with and without a "no agent" choice)
 * and a composer's toolbar at two widths, an existing conversation whose agent stays (picking starts a new
 * one), and the plain parts it is built from.
 */
export function AgentPickerDemo(): ReactElement {
  const [chosen, setChosen] = useState<string | null>('assistant');
  const [started, setStarted] = useState<string | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [runner, setRunner] = useState<string | null>(null);
  const name = (id: string | null): string =>
    AGENTS.find((agent) => agent.id === id)?.name ?? 'nobody';
  return (
    <div className='min-h-svh bg-background p-4 sm:p-6'>
      <div className='mx-auto flex max-w-2xl flex-col gap-4'>
        <Section
          title='As a form field'
          description={`Looks like the form's selects: the chosen agent with its availability, the menu with each agent's tags. Default agent: ${name(fallback)}; rule agent: ${name(runner)}.`}
        >
          <div className='grid gap-3 sm:grid-cols-2'>
            <AgentPicker
              agents={AGENTS}
              value={fallback}
              onSelect={setFallback}
              noneOption={{
                label: 'System default',
                onSelect: () => setFallback(null),
              }}
            />
            <AgentPicker
              agents={AGENTS}
              value={runner}
              onSelect={setRunner}
              placeholder='Choose an agent'
            />
          </div>
        </Section>
        <Section
          title="In a composer's toolbar"
          description='Fitted to the composer: where it is narrow, the dot sits on the avatar; where it is wide, the name has more room before it truncates.'
        >
          <div className='flex flex-col gap-3'>
            {[
              { width: 'max-w-80', label: 'Narrow, like the chat panel' },
              { width: 'max-w-xl', label: 'Wide, like the home page' },
            ].map(({ width, label }) => (
              <div key={width} className='flex flex-col gap-1'>
                <p className='text-xs text-muted-foreground'>{label}</p>
                <div
                  className={`@container flex w-full ${width} items-center rounded-xl border bg-card p-2`}
                >
                  <AgentPicker
                    agents={AGENTS}
                    value={chosen}
                    onSelect={setChosen}
                    appearance='toolbar'
                    showHint={false}
                    className='h-7 shrink px-1.5 @md:px-2'
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Section
          title='An existing conversation'
          description={
            started
              ? `Would start a new conversation with ${name(started)}.`
              : 'The conversation stays with its agent; picking another starts a new one.'
          }
        >
          <AgentPicker
            agents={AGENTS}
            value='coder'
            bound
            appearance='toolbar'
            shown={{
              name: 'Claude · Opus 5',
              availability: online,
              temporary: true,
            }}
            onSelect={setStarted}
            className='self-start'
          />
        </Section>
        <Section
          title='Parts'
          description='The availability dot, a tag and an agent as one row (AgentIdentity), as an executor picker lists it among people.'
        >
          <div className='flex flex-wrap items-center gap-3 text-sm'>
            <span className='inline-flex items-center gap-1.5'>
              <AvailabilityDot availability={online} /> Online
            </span>
            <span className='inline-flex items-center gap-1.5'>
              <AvailabilityDot
                availability={{
                  online: false,
                  reason: 'noRunner',
                  onlineRunners: 0,
                }}
              />
              No runner online
            </span>
            <AgentTag tone='violet'>Personal runners only</AgentTag>
            <AgentIdentity
              name='Gemini · 3 Pro'
              availability={{
                online: false,
                reason: 'noRunner',
                onlineRunners: 0,
              }}
              ringClassName='ring-card'
            />
          </div>
        </Section>
      </div>
    </div>
  );
}
