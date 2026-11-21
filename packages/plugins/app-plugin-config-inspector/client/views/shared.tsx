import { useTranslation } from '@nocobase/i18n/client';
import { useCallback, type ReactElement } from 'react';

import { MASK, REDACTED, type SettingSource } from '../../shared/snapshot.js';
import { Badge } from '../components/ui/badge.js';

export const NAMESPACE = '@nocobase/app-plugin-config-inspector';

/** Translates a key under `configInspector`. */
export function useInspectorT(): (
  key: string,
  options?: Record<string, unknown>,
) => string {
  const { t } = useTranslation(NAMESPACE);
  return useCallback(
    (key: string, options?: Record<string, unknown>) =>
      t(`configInspector.${key}`, options),
    [t],
  );
}

export function Segment<T extends string>({
  label,
  value,
  options,
  onChange,
  className = '',
}: {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
  className?: string;
}): ReactElement {
  return (
    <span
      role='radiogroup'
      aria-label={label}
      className={`inline-flex rounded-lg border bg-muted p-0.5 ${className}`}
    >
      {options.map(([key, text]) => (
        <button
          key={key}
          type='button'
          role='radio'
          aria-checked={value === key}
          className={`flex-1 rounded-md px-3 py-1 text-sm whitespace-nowrap transition-colors sm:flex-none ${value === key ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => onChange(key)}
        >
          {text}
        </button>
      ))}
    </span>
  );
}

const SOURCE_STYLE: Record<SettingSource, string> = {
  file: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
  environment:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
  default: 'text-muted-foreground',
  unknown: 'text-muted-foreground',
};

export function SourceBadge({
  source,
}: {
  source: SettingSource;
}): ReactElement {
  const t = useInspectorT();
  return (
    <Badge variant='outline' className={`rounded-md ${SOURCE_STYLE[source]}`}>
      {t(`source.${source}`)}
    </Badge>
  );
}

export function NoteBadge({
  tone = 'muted',
  children,
}: {
  tone?: 'muted' | 'warning' | 'environment';
  children: string;
}): ReactElement {
  return (
    <Badge
      variant='outline'
      className={`rounded-md ${tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300' : tone === 'environment' ? SOURCE_STYLE.environment : 'text-muted-foreground'}`}
    >
      {children}
    </Badge>
  );
}

/** A redacted display value: a credential as dots, nothing as a dash, the rest as code. */
export function Value({ value }: { value: string }): ReactElement {
  const t = useInspectorT();
  if (value === REDACTED)
    return (
      <span
        className='tracking-widest text-muted-foreground'
        title={t('configured')}
        aria-label={t('configured')}
      >
        {MASK}
      </span>
    );
  if (value === '') return <span className='text-muted-foreground'>—</span>;
  return <code className='font-mono text-xs break-all'>{value}</code>;
}

export function CustomizedDot(): ReactElement {
  const t = useInspectorT();
  return (
    <span
      role='img'
      aria-label={t('customized')}
      title={t('customized')}
      className='inline-block size-1.5 shrink-0 rounded-full bg-primary'
    />
  );
}
