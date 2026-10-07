import { useTranslation } from '@nocobase/i18n/client';
import { CalendarIcon } from 'lucide-react';
import { useId, useState, type ReactElement } from 'react';
import { enUS, zhCN } from 'react-day-picker/locale';
import { cn } from 'cn';
import { Button } from './ui/button.js';
import { Calendar } from './ui/calendar.js';
import { Input } from './ui/input.js';
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from './ui/popover.js';

export function DateTimePicker({
  label,
  value,
  onChange,
  className,
}: {
  readonly label: string;
  readonly value: Date | undefined;
  readonly onChange: (value: Date | undefined) => void;
  readonly className?: string;
}): ReactElement {
  const { t, i18n } = useTranslation('@nocobase/app-plugin-hub');
  const [open, setOpen] = useState(false);
  const timeId = useId();
  const locale = i18n.language?.startsWith('zh') ? zhCN : enUS;
  const time = value
    ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
    : '00:00';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant='outline'
            aria-label={label}
            className={cn(
              'justify-start border-input font-normal',
              !value && 'text-muted-foreground',
              className,
            )}
          />
        }
      >
        <CalendarIcon />
        <span className='truncate'>
          {value
            ? value.toLocaleString(locale.code, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
            : label}
        </span>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        className='w-auto max-w-[calc(100vw-2rem)] gap-0 p-0'
      >
        <PopoverTitle className='border-b px-3 py-2'>{label}</PopoverTitle>
        <Calendar
          mode='single'
          locale={locale}
          selected={value}
          defaultMonth={value}
          autoFocus
          className='[--cell-size:--spacing(9)]'
          onSelect={(date) => {
            if (!date) return;
            const next = new Date(date);
            next.setHours(
              value?.getHours() ?? 0,
              value?.getMinutes() ?? 0,
              0,
              0,
            );
            onChange(next);
          }}
        />
        <div className='space-y-3 border-t p-3'>
          <div className='flex items-center gap-3'>
            <label htmlFor={timeId} className='text-sm'>
              {t('dateTime.time')}
            </label>
            <Input
              id={timeId}
              type='time'
              step={60}
              className='min-w-0 flex-1'
              disabled={!value}
              value={time}
              onChange={(event) => {
                if (
                  !value ||
                  !event.target.validity.valid ||
                  !event.target.value
                )
                  return;
                const [hours, minutes] = event.target.value
                  .split(':')
                  .map(Number);
                const next = new Date(value);
                next.setHours(hours, minutes, 0, 0);
                onChange(next);
              }}
            />
          </div>
          <div className='flex justify-between gap-2'>
            <Button
              variant='ghost'
              size='sm'
              disabled={!value}
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              {t('dateTime.clear')}
            </Button>
            <Button size='sm' onClick={() => setOpen(false)}>
              {t('dateTime.done')}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
