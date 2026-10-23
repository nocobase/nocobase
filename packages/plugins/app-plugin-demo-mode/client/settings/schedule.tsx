import { useMemo, type ReactElement } from 'react';

import {
  nextDemoReset,
  type DemoDailySchedule,
} from '../demo-configuration.js';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '../components/ui/combobox.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import { Switch } from '../components/ui/switch.js';
import { languageName, useDraft, useT, type Configuration } from './context.js';
import { SettingRow, SettingsCard } from './shared.js';

const pad = (value: number) => String(value).padStart(2, '0');

function preview(schedule: DemoDailySchedule): string | null {
  try {
    return nextDemoReset(schedule);
  } catch {
    return null;
  }
}

function validZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: zone }).format();
    return true;
  } catch {
    return false;
  }
}

/** The once-a-day reset: clear everything visitors changed and generate the dataset again. */
export function ScheduleCard({
  configuration,
  languages,
}: {
  readonly configuration: Configuration;
  /** The dataset's languages, the first being its default. */
  readonly languages: readonly string[];
}): ReactElement {
  const t = useT();
  const fallback: DemoDailySchedule = {
    enabled: false,
    hour: 3,
    minute: 0,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: languages[0] ?? 'en-US',
  };
  const server = configuration.view.schedule ?? fallback;
  const draft = useDraft('schedule', 'schedule', server, configuration);
  const value = draft.draft;
  const zones = useMemo(() => Intl.supportedValuesOf('timeZone'), []);
  const disabled =
    !configuration.canEdit || draft.saving || configuration.view.busy;
  const next = value.enabled ? preview(value) : null;
  const zoneOk = validZone(value.timezone);
  const set = (patch: Partial<DemoDailySchedule>) =>
    draft.setDraft({ ...value, ...patch });
  return (
    <SettingsCard
      draft={draft}
      canEdit={configuration.canEdit}
      busy={configuration.view.busy || (value.enabled && !zoneOk)}
      confirmation={{
        title: t('schedule.confirmTitle'),
        description: t('schedule.confirmDescription'),
        changes: [
          value.enabled
            ? t('schedule.summary', {
                time: `${pad(value.hour)}:${pad(value.minute)}`,
                timezone: value.timezone,
                language: languageName(value.language),
              })
            : t('schedule.off'),
        ],
        destructive: value.enabled,
      }}
    >
      <SettingRow
        label={t('schedule.enabled')}
        description={t('schedule.enabledHelp')}
        htmlFor='demo-schedule-enabled'
      >
        <Switch
          id='demo-schedule-enabled'
          checked={value.enabled}
          disabled={disabled}
          onCheckedChange={(enabled) => set({ enabled })}
        />
      </SettingRow>
      {value.enabled ? (
        <div className='grid gap-4 rounded-lg border p-4 sm:grid-cols-2'>
          <div className='flex flex-col gap-2'>
            <span className='text-sm font-medium'>{t('schedule.time')}</span>
            <div className='flex items-center gap-2'>
              <Select
                value={String(value.hour)}
                disabled={disabled}
                onValueChange={(hour) => {
                  if (hour !== null) set({ hour: Number(hour) });
                }}
              >
                <SelectTrigger aria-label={t('schedule.hour')} className='w-20'>
                  <SelectValue>{pad(value.hour)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <SelectItem key={hour} value={String(hour)}>
                      {pad(hour)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span aria-hidden>:</span>
              <Select
                value={String(value.minute)}
                disabled={disabled}
                onValueChange={(minute) => {
                  if (minute !== null) set({ minute: Number(minute) });
                }}
              >
                <SelectTrigger
                  aria-label={t('schedule.minute')}
                  className='w-20'
                >
                  <SelectValue>{pad(value.minute)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {[
                    ...new Set([
                      ...Array.from({ length: 12 }, (_, step) => step * 5),
                      value.minute,
                    ]),
                  ]
                    .sort((a, b) => a - b)
                    .map((minute) => (
                      <SelectItem key={minute} value={String(minute)}>
                        {pad(minute)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='flex flex-col gap-2'>
            <span className='text-sm font-medium'>
              {t('schedule.language')}
            </span>
            <Select
              value={value.language}
              disabled={disabled}
              onValueChange={(language) => {
                if (language !== null) set({ language });
              }}
            >
              <SelectTrigger
                aria-label={t('schedule.language')}
                className='w-full'
              >
                <SelectValue>{languageName(value.language)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {[
                  ...new Set([
                    ...languages,
                    ...(value.language ? [value.language] : []),
                  ]),
                ].map((language) => (
                  <SelectItem key={language} value={language}>
                    {languageName(language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-col gap-2 sm:col-span-2'>
            <span className='text-sm font-medium'>
              {t('schedule.timezone')}
            </span>
            <Combobox
              items={zones}
              value={value.timezone}
              disabled={disabled}
              onValueChange={(timezone: string | null) => {
                if (timezone) set({ timezone });
              }}
            >
              <ComboboxInput
                aria-label={t('schedule.timezone')}
                aria-invalid={!zoneOk}
                className='w-full'
              />
              <ComboboxContent>
                <ComboboxEmpty>{t('schedule.noTimezone')}</ComboboxEmpty>
                <ComboboxList>
                  {(zone: string) => (
                    <ComboboxItem key={zone} value={zone}>
                      {zone}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {!zoneOk ? (
              <p className='text-sm text-destructive'>
                {t('schedule.invalidTimezone')}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      <p className='text-sm text-muted-foreground'>
        {next
          ? t('schedule.next', { time: new Date(next).toLocaleString() })
          : t('schedule.off')}
      </p>
    </SettingsCard>
  );
}
