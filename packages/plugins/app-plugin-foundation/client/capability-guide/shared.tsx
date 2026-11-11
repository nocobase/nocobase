import { cn } from 'cn';
import {
  Blocks,
  Bot,
  Code,
  Database,
  GitBranch,
  Mail,
  Palette,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { createElement, type ReactElement } from 'react';

import {
  type CatalogEntry,
  type GuideContent,
  type GuideGroupId,
} from '../../shared/capability-guide/index.js';

const GROUP_ICONS: Readonly<Record<GuideGroupId, LucideIcon>> = {
  data: Database,
  access: ShieldCheck,
  process: GitBranch,
  integration: Mail,
  experience: Palette,
  ai: Bot,
  development: Code,
};

export function EntryIcon({
  entry,
  className,
}: {
  readonly entry: CatalogEntry;
  readonly className?: string;
}): ReactElement {
  return createElement(entry.group ? GROUP_ICONS[entry.group] : Blocks, {
    className,
    'aria-hidden': true,
  });
}

/** Source (core or plugin) and, for a plugin, whether it is an example or a Skill. */
export function EntryBadges({
  entry,
  content,
  className,
}: {
  readonly entry: CatalogEntry;
  readonly content: GuideContent;
  readonly className?: string;
}): ReactElement {
  return (
    <span className={cn('flex flex-wrap items-center gap-1', className)}>
      <Badge tone={entry.source === 'kernel' ? 'primary' : 'muted'}>
        {content.sources[entry.source]}
      </Badge>
      {entry.role ? (
        <Badge tone='outline'>{content.roles[entry.role]}</Badge>
      ) : null}
    </span>
  );
}

function Badge({
  tone,
  children,
}: {
  readonly tone: 'primary' | 'muted' | 'outline';
  readonly children: string;
}): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[0.7rem] leading-none font-medium whitespace-nowrap',
        tone === 'primary' && 'border-primary/20 bg-primary/5 text-primary',
        tone === 'muted' && 'border-border bg-muted text-muted-foreground',
        tone === 'outline' &&
          'border-dashed border-border bg-background text-foreground',
      )}
    >
      {children}
    </span>
  );
}
