/**
 * The usage page's range: one button showing the range in the locale's words, opening a calendar (two months on wide
 * screens) with quick presets beside it. The first day picked starts a new range and the second ends it, in either
 * order; a preset applies at once.
 */
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { CalendarIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import type { DateRange } from 'react-day-picker';
import { enUS, zhCN } from 'react-day-picker/locale';

import { useMediaQuery } from '../../hooks/use-media-query.js';
import { Button } from '../../components/ui/button.js';
import { Calendar } from '../../components/ui/calendar.js';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/popover.js';
import {
  RANGE_PRESETS,
  formatDayRange,
  fromDay,
  presetRange,
  toDay,
} from './model.js';

export function DateRangePicker({
  from,
  to,
  onChange,
}: {
  readonly from: string;
  readonly to: string;
  readonly onChange: (range: {
    readonly from: string;
    readonly to: string;
  }) => void;
}): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const wide = useMediaQuery('(min-width: 768px)');
  const [open, setOpen] = useState(false);
  const [today] = useState(() => new Date());
  // The first end of a range being picked; null when none is.
  const [start, setStart] = useState<Date | null>(null);
  const selected: DateRange | undefined = start
    ? { from: start, to: undefined }
    : { from: fromDay(from), to: fromDay(to) };

  const close = (next: boolean): void => {
    setOpen(next);
    setStart(null);
  };
  const pick = (day: Date): void => {
    if (!start) {
      setStart(day);
      return;
    }
    const [first, last] = start <= day ? [start, day] : [day, start];
    onChange({ from: toDay(first), to: toDay(last) });
    close(false);
  };

  return (
    <Popover open={open} onOpenChange={close}>
      <PopoverTrigger
        render={
          <Button
            variant='outline'
            aria-label={t('usage.filters.range')}
            className='w-full justify-start font-normal sm:w-auto'
          />
        }
      >
        <CalendarIcon data-icon='inline-start' />
        {formatDayRange(from, to, locale)}
      </PopoverTrigger>
      <PopoverContent
        className='w-auto flex-col p-0 sm:flex-row sm:gap-0'
        align='start'
      >
        <div
          role='group'
          aria-label={t('usage.filters.presets')}
          className='flex flex-wrap gap-1 border-b p-2 sm:w-28 sm:flex-col sm:flex-nowrap sm:border-r sm:border-b-0'
        >
          {RANGE_PRESETS.map((preset) => (
            <Button
              key={preset}
              variant='ghost'
              size='sm'
              className='justify-start'
              onClick={() => {
                onChange(presetRange(preset));
                close(false);
              }}
            >
              {t(`usage.presets.${preset}`)}
            </Button>
          ))}
        </div>
        <Calendar
          mode='range'
          locale={locale.startsWith('zh') ? zhCN : enUS}
          numberOfMonths={wide ? 2 : 1}
          defaultMonth={fromDay(wide ? from : to) ?? fromDay(to) ?? today}
          selected={selected}
          onSelect={(_range, day) => pick(day)}
          disabled={{ after: today }}
        />
      </PopoverContent>
    </Popover>
  );
}
