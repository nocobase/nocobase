import { useState, type ReactElement } from 'react';
import { CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@nocobase/i18n/client';
import {
  enUS,
  zhCN,
  zhTW,
  ja,
  es,
  ptBR,
  fr,
  de,
  vi,
  id,
} from 'react-day-picker/locale';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { Button } from './ui/button.js';
import { Calendar } from './ui/calendar.js';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.js';

const calendarLocales: Readonly<Record<string, typeof enUS>> = {
  'en-US': enUS,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'ja-JP': ja,
  'es-ES': es,
  'pt-BR': ptBR,
  'fr-FR': fr,
  'de-DE': de,
  'vi-VN': vi,
  'id-ID': id,
};

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
  const { t, i18n } = useTranslation(MAIL_PLUGIN_NS);
  const [open, setOpen] = useState(false);
  const locale = calendarLocales[i18n.language ?? 'en-US'] ?? enUS;
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
