import { LoaderCircle } from 'lucide-react';
import { Link } from 'react-router';
import { Alert, AlertDescription } from '#components/ui/alert';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import type { WorkflowVersion } from '../../../shared/workflows.js';

export function DataState({
  loading,
  data,
  status,
  retry,
}: {
  readonly loading: boolean;
  readonly data?: unknown;
  readonly status?: number;
  readonly retry: () => void;
}): ReactElement | null {
  const { t } = useTranslation();
  if (loading && data === undefined)
    return (
      <div
        aria-label={t('workflows.loading')}
        role='status'
        className='space-y-3'
      >
        <Skeleton className='h-8 w-full' />
        <Skeleton className='h-24 w-full' />
      </div>
    );
  if (loading)
    return (
      <div
        role='status'
        className='flex items-center gap-2 text-sm text-muted-foreground'
      >
        <LoaderCircle className='size-4 animate-spin' />
        {t('workflows.loading')}
      </div>
    );
  if (!status) return null;
  return (
    <Alert variant='destructive'>
      <AlertDescription>
        <p>
          {t(
            status === 403
              ? 'workflows.forbidden'
              : status === 404
                ? 'workflows.notFound'
                : status === 401
                  ? 'workflows.signIn'
                  : 'workflows.failed',
          )}
        </p>
        {status === 401 && (
          <Link to='/login' className='underline'>
            {t('workflows.signIn')}
          </Link>
        )}
        {status >= 500 && (
          <Button variant='outline' onClick={retry}>
            {t('workflows.retry')}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Picks one version of a process. "Latest" only means the largest number:
 * the entry points that create records choose their version in code.
 */
export function VersionSelect({
  versions,
  value,
  onChange,
  allLabel,
}: {
  readonly versions: readonly WorkflowVersion[];
  readonly value: number | undefined;
  readonly onChange: (version: number | undefined) => void;
  /** Offers "every version" as `undefined` when set. */
  readonly allLabel?: string;
}): ReactElement {
  const { t } = useTranslation();
  const latest = versions.at(-1)?.version;
  const items = [
    ...(allLabel ? [{ value: 'all', label: allLabel }] : []),
    ...[...versions].reverse().map(({ version }) => ({
      value: String(version),
      label:
        version === latest
          ? t('workflows.latestVersion', { version })
          : t('workflows.versionLabel', { version }),
    })),
  ];
  return (
    <Select
      items={items}
      value={
        value === undefined
          ? allLabel
            ? 'all'
            : String(latest)
          : String(value)
      }
      onValueChange={(next: string | null) =>
        onChange(!next || next === 'all' ? undefined : Number(next))
      }
    >
      <SelectTrigger
        size='sm'
        className='w-44 font-normal tracking-normal'
        aria-label={t('workflows.version')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
