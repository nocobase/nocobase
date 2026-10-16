import { cn } from 'cn';
import type { ReactElement } from 'react';

/** The agents' marks, with the colors people know them by; another agent shows the first letters of its name. */
const MARKS: Readonly<Record<string, { glyph: string; tone?: string }>> = {
  codex: { glyph: 'CX', tone: 'bg-foreground text-background' },
  claude: { glyph: 'CC', tone: 'bg-[#d97757] text-white' },
  gemini: { glyph: 'GE', tone: 'bg-[#4285f4] text-white' },
  copilot: { glyph: 'GH', tone: 'bg-[#24292f] text-white' },
  cursor: { glyph: 'CU', tone: 'bg-foreground text-background' },
  opencode: { glyph: 'OC' },
  qwen: { glyph: 'QW', tone: 'bg-[#615ced] text-white' },
  kimi: { glyph: 'KI' },
  codebuddy: { glyph: 'CB' },
  qoder: { glyph: 'QO' },
  goose: { glyph: 'GO' },
  auggie: { glyph: 'AU' },
  droid: { glyph: 'DR' },
  kilo: { glyph: 'KL' },
  cline: { glyph: 'CL' },
  amp: { glyph: 'AM' },
  vibe: { glyph: 'MV', tone: 'bg-[#fa500f] text-white' },
};

export function AgentBadge({
  agentId,
  name,
  large,
}: {
  readonly agentId: string;
  readonly name: string;
  readonly large?: boolean;
}): ReactElement {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-bold tracking-tight',
        large
          ? 'size-6 rounded-[5px] text-[10px]'
          : 'size-5 rounded-[4px] text-[8.5px]',
        MARKS[agentId]?.tone ??
          'bg-muted text-foreground border border-current/25',
      )}
    >
      {MARKS[agentId]?.glyph ?? name.slice(0, 2).toUpperCase()}
    </span>
  );
}
