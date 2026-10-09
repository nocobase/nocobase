import { MAIL_LABEL_COLORS } from '../../shared/mail.js';
import type { MailLabelColor } from '../../shared/mail.js';

export { MAIL_LABEL_COLORS };

interface MailLabelColorStyles {
  readonly dot: string;
  readonly tag: string;
}

const COLOR_STYLES: Readonly<Record<MailLabelColor, MailLabelColorStyles>> = {
  slate: {
    dot: 'bg-slate-500',
    tag: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200',
  },
  red: {
    dot: 'bg-red-500',
    tag: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-200',
  },
  orange: {
    dot: 'bg-orange-500',
    tag: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/70 dark:bg-orange-950/50 dark:text-orange-200',
  },
  amber: {
    dot: 'bg-amber-500',
    tag: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-200',
  },
  green: {
    dot: 'bg-green-500',
    tag: 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/70 dark:bg-green-950/50 dark:text-green-200',
  },
  sky: {
    dot: 'bg-sky-500',
    tag: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/50 dark:text-sky-200',
  },
  blue: {
    dot: 'bg-blue-500',
    tag: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/50 dark:text-blue-200',
  },
  violet: {
    dot: 'bg-violet-500',
    tag: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/70 dark:bg-violet-950/50 dark:text-violet-200',
  },
  pink: {
    dot: 'bg-pink-500',
    tag: 'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900/70 dark:bg-pink-950/50 dark:text-pink-200',
  },
};

export function getMailLabelColorStyles(
  color?: MailLabelColor,
): MailLabelColorStyles {
  return COLOR_STYLES[color ?? 'blue'] ?? COLOR_STYLES.blue;
}

export function mailLabelColorSwatch(color: MailLabelColor): string {
  return getMailLabelColorStyles(color).dot;
}
