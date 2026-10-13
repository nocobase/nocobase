import { cn } from 'cn';
import type { ReactElement } from 'react';

/** The agents' marks; another agent shows the first letters of its name. */
const GLYPHS: Readonly<Record<string, string>> = {
  codex: 'CX',
  opencode: 'OC',
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
        agentId === 'codex'
          ? 'bg-foreground text-background'
          : 'bg-muted text-foreground border border-current/25',
      )}
    >
      {GLYPHS[agentId] ?? name.slice(0, 2).toUpperCase()}
    </span>
  );
}
