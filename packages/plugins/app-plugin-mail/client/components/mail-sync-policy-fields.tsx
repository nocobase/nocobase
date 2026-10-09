import { useState, type ReactElement } from 'react';
import { CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@nocobase/i18n/client';
import { enUS, zhCN } from 'react-day-picker/locale';
import { Button } from './ui/button.js';
import { Calendar } from './ui/calendar.js';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.js';

export interface MailSyncPolicyValue {
  readonly receivedAfter: string;
}

export interface MailSyncPolicyFieldsProps {
  readonly value: MailSyncPolicyValue;
  readonly labels: {
    readonly receivedAfter: string;
  };
  readonly disabled?: boolean;
  readonly onChange: (value: MailSyncPolicyValue) => void;
}

export function MailSyncPolicyFields({
  value,
  labels,
  disabled = false,
  onChange,
}: MailSyncPolicyFieldsProps): ReactElement {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const locale = i18n.language?.startsWith('zh') ? zhCN : enUS;
  const selected = value.receivedAfter
    ? parseISO(value.receivedAfter)
    : undefined;

  return (
    <div className='grid max-w-sm gap-2 text-sm font-medium'>
      <span>{labels.receivedAfter}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant='outline' disabled={disabled} />}
          className='w-full justify-start text-left font-normal'
          aria-label={labels.receivedAfter}
        >
          <CalendarDays className='size-4' aria-hidden='true' />
          {selected ? (
            format(selected, 'PPP', { locale })
          ) : (
            <span className='text-muted-foreground'>
              {t('settings.initialSync.pickDate', {
                defaultValue: 'Pick a date',
              })}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent align='start' className='w-auto p-2'>
          <Calendar
            locale={locale}
            selected={selected}
            onSelect={(date) => {
              onChange({
                ...value,
                receivedAfter: date ? format(date, 'yyyy-MM-dd') : '',
              });
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
