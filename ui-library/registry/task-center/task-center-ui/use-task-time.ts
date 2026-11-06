import { useTranslation } from '@nocobase/i18n/client';

export interface TaskTime {
  /** Such as "5 minutes ago", or a short date after a day. */
  readonly relative: string;
  /** The full date and time, for a tooltip. */
  readonly absolute: string;
}

/** Formats task times in the reader's language, relative to `now` (the current time by default). */
export function useTaskTime(now?: Date): (time: string) => TaskTime {
  const { i18n } = useTranslation();
  const relative = new Intl.RelativeTimeFormat(i18n.language, {
    numeric: 'auto',
  });
  const absolute = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const short = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return (time) => {
    const date = new Date(time);
    const minutes = Math.round(
      (date.getTime() - (now ?? new Date()).getTime()) / 60_000,
    );
    const text =
      minutes > -1
        ? relative.format(0, 'minute')
        : minutes > -60
          ? relative.format(minutes, 'minute')
          : minutes > -24 * 60
            ? relative.format(Math.round(minutes / 60), 'hour')
            : short.format(date);
    return { relative: text, absolute: absolute.format(date) };
  };
}
