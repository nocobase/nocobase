import { cn } from 'cn';
import {
  Bell,
  BookOpen,
  Bot,
  CalendarClock,
  Database,
  FileText,
  GitBranch,
  Inbox,
  KeyRound,
  Languages,
  ListChecks,
  Mail,
  Palette,
  Paperclip,
  Printer,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { createElement, type ReactElement } from 'react';

import type { CapabilityPrerequisite } from '../../shared/capability-guide/index.js';

const CAPABILITY_ICONS: Readonly<Record<string, LucideIcon>> = {
  auth: KeyRound,
  authorization: ShieldCheck,
  dataSources: Database,
  file: Paperclip,
  templatePrint: Printer,
  workflow: GitBranch,
  approval: ListChecks,
  taskCenter: Inbox,
  notification: Bell,
  mail: Mail,
  scheduler: CalendarClock,
  theme: Palette,
  i18n: Languages,
  aiEmployee: Bot,
  aiKnowledgeBase: BookOpen,
};

export function CapabilityIcon({
  id,
  className,
}: {
  readonly id: string;
  readonly className?: string;
}): ReactElement {
  return createElement(CAPABILITY_ICONS[id] ?? FileText, {
    className,
    'aria-hidden': true,
  });
}

export function PrerequisiteBadge({
  prerequisite,
  label,
}: {
  readonly prerequisite: CapabilityPrerequisite;
  readonly label: string;
}): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[0.7rem] leading-none font-medium whitespace-nowrap',
        prerequisite === 'builtIn'
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}
