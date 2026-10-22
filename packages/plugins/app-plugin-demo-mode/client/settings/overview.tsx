import { useToaster } from '@nocobase/app-client';
import { Check, Copy, DatabaseZap, ExternalLink } from 'lucide-react';
import { useTranslation } from '@nocobase/i18n/client';
import {
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { useHref } from 'react-router';

import type { DemoDataStatus } from '../../server/data/types.js';
import { useDemoAccounts } from '../accounts.js';
import { DEMO_SIGN_IN_PATH } from '../accounts.js';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.js';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card.js';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '../components/ui/empty.js';
import { Progress } from '../components/ui/progress.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import { Skeleton } from '../components/ui/skeleton.js';
import { Spinner } from '../components/ui/spinner.js';
import type { DemoDataControls } from '../demo-data.js';
import {
  DemoSettingsContext,
  languageName,
  useErrorText,
  useLabel,
  useT,
} from './context.js';
import { ErrorAlert } from './shared.js';

function StateBadge({
  status,
}: {
  readonly status: DemoDataStatus;
}): ReactElement {
  const t = useT();
  if (status.state === 'importing')
    return <Badge variant='secondary'>{t('data.state.importing')}</Badge>;
  if (status.state === 'clearing')
    return <Badge variant='secondary'>{t('data.state.clearing')}</Badge>;
  if (status.state === 'failed')
    return <Badge variant='destructive'>{t('data.state.failed')}</Badge>;
  if (status.present) return <Badge>{t('data.state.ready')}</Badge>;
  return <Badge variant='outline'>{t('data.state.none')}</Badge>;
}

type Intent = 'import' | 'reset' | 'clear';

/** The demo dataset: what is generated now, and generating, resetting and clearing it. */
export function DataCard({
  demo,
  canManage,
}: {
  readonly demo: DemoDataControls;
  readonly canManage: boolean;
}): ReactElement {
  const t = useT();
  const label = useLabel();
  const errorText = useErrorText();
  const toaster = useToaster();
  const { onDataChange } = useContext(DemoSettingsContext);
  const { i18n } = useTranslation();
  const { status } = demo;
  const [chosen, setChosen] = useState<string>();
  // An import or reset this page watched has finished: everything the application shows changed.
  const importing = Boolean(status?.importing);
  const wasImportingRef = useRef(importing);
  useEffect(() => {
    if (wasImportingRef.current && !importing) onDataChange?.();
    wasImportingRef.current = importing;
  }, [importing, onDataChange]);
  const [intent, setIntent] = useState<Intent>();
  const [failure, setFailure] = useState<unknown>();
  if (!status)
    return demo.error ? (
      <ErrorAlert error={demo.error} />
    ) : (
      <Skeleton className='h-48 w-full' />
    );
  if (!status.available)
    return (
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <DatabaseZap />
              </EmptyMedia>
              <EmptyTitle>{t('data.unavailable')}</EmptyTitle>
              <EmptyDescription>{t('data.unavailableHelp')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  // The reader's own language when the dataset is written in it.
  const reader = status.languages.find(
    (item) =>
      item === i18n.language ||
      item.split('-')[0] === i18n.language.split('-')[0],
  );
  const language =
    chosen ?? status.language ?? reader ?? status.languages[0] ?? '';
  const working = Boolean(status.importing) || demo.pending;
  const counts = Object.entries(status.counts);
  const run = async () => {
    const action = intent;
    setFailure(undefined);
    try {
      if (action === 'clear') {
        await demo.clear();
        onDataChange?.();
      } else if (action === 'reset') await demo.reset(language);
      else await demo.importData(language);
      setIntent(undefined);
      toaster.show({
        type: 'success',
        title: t(
          action === 'clear'
            ? 'data.cleared'
            : action === 'reset'
              ? 'data.resetStarted'
              : 'data.importStarted',
        ),
      });
    } catch (cause) {
      setFailure(cause);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex flex-wrap items-center gap-2'>
          {t('data.title')}
          <StateBadge status={status} />
        </CardTitle>
        <CardDescription>
          {status.present && status.language
            ? t('data.presentSummary', {
                language: languageName(status.language),
                time: status.finishedAt
                  ? new Date(status.finishedAt).toLocaleString()
                  : '—',
              })
            : t('data.absentSummary')}
        </CardDescription>
        {canManage ? (
          <CardAction className='flex flex-wrap items-center gap-2'>
            {status.languages.length > 1 ? (
              <Select
                value={language}
                disabled={working}
                onValueChange={(value) => {
                  if (value !== null) setChosen(value);
                }}
              >
                <SelectTrigger aria-label={t('data.language')} size='sm'>
                  <SelectValue>{languageName(language)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {status.languages.map((item) => (
                    <SelectItem key={item} value={item}>
                      {languageName(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {status.present ? (
              <>
                <Button
                  size='sm'
                  variant='outline'
                  disabled={working}
                  onClick={() => setIntent('clear')}
                >
                  {t('data.clear')}
                </Button>
                <Button
                  size='sm'
                  disabled={working}
                  onClick={() => setIntent('reset')}
                >
                  {t('data.reset')}
                </Button>
              </>
            ) : (
              <>
                {status.state === 'failed' ? (
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={working}
                    onClick={() => setIntent('clear')}
                  >
                    {t('data.clear')}
                  </Button>
                ) : null}
                <Button
                  size='sm'
                  disabled={working}
                  onClick={() => setIntent('import')}
                >
                  {t('data.generate')}
                </Button>
              </>
            )}
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {status.importing ? (
          <div className='flex items-center gap-3 text-sm'>
            <span className='shrink-0'>
              {t(
                status.state === 'clearing'
                  ? 'data.state.clearing'
                  : 'data.state.importing',
              )}
            </span>
            <Progress
              className='flex-1'
              value={status.importing.percent}
              aria-label={t('data.state.importing')}
            />
            <span className='w-10 shrink-0 text-right tabular-nums'>
              {Math.round(status.importing.percent)}%
            </span>
          </div>
        ) : null}
        {status.failure ? (
          <Alert variant='destructive'>
            <AlertTitle>{t('data.failed')}</AlertTitle>
            <AlertDescription>{status.failure.message}</AlertDescription>
          </Alert>
        ) : null}
        {demo.error ? <ErrorAlert error={demo.error} /> : null}
        {counts.length ? (
          <dl className='grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4'>
            {counts.map(([key, value]) => (
              <div key={key} className='rounded-lg border px-3 py-2.5'>
                <dt className='truncate text-xs text-muted-foreground'>
                  {label('count', key)}
                </dt>
                <dd className='mt-1 text-xl font-semibold tabular-nums'>
                  {value.toLocaleString()}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {!canManage ? (
          <p className='text-sm text-muted-foreground'>{t('data.readOnly')}</p>
        ) : null}
      </CardContent>
      <AlertDialog
        open={intent !== undefined}
        onOpenChange={(open) => {
          if (!open && !demo.pending) {
            setIntent(undefined);
            setFailure(undefined);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {intent ? t(`data.confirm.${intent}.title`) : null}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {intent
                ? t(`data.confirm.${intent}.description`, {
                    language: languageName(language),
                  })
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {failure ? (
            <Alert variant='destructive'>
              <AlertTitle>{errorText(failure)}</AlertTitle>
            </Alert>
          ) : null}
          <AlertDialogFooter>
            <Button
              variant='outline'
              disabled={demo.pending}
              onClick={() => setIntent(undefined)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant={intent === 'import' ? 'default' : 'destructive'}
              disabled={demo.pending}
              onClick={() => void run()}
            >
              {demo.pending ? <Spinner /> : null}
              {intent
                ? t(`data.${intent === 'import' ? 'generate' : intent}`)
                : null}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function CopyButton({
  value,
  label,
  text,
}: {
  readonly value: string;
  /** The button's accessible name. */
  readonly label: string;
  /** What the button reads; "Copy link" when absent. */
  readonly text?: string;
}): ReactElement {
  const t = useT();
  const toaster = useToaster();
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type='button'
      size='sm'
      variant='outline'
      aria-label={label}
      onClick={() => {
        void navigator.clipboard
          .writeText(value)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() =>
            toaster.show({ type: 'error', title: t('visitors.copyFailed') }),
          );
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? t('visitors.copied') : (text ?? t('visitors.copyLink'))}
    </Button>
  );
}

/**
 * How visitors get in: the accounts quick sign-in offers, each with the link that enters it, and the snippet that
 * embeds the demo in another page.
 */
export function VisitorsCard({
  status,
}: {
  readonly status: DemoDataStatus | null;
}): ReactElement {
  const t = useT();
  const { accounts } = useDemoAccounts(status?.finishedAt);
  const path = useHref(DEMO_SIGN_IN_PATH);
  const entry = (username: string) =>
    `${window.location.origin}${path}?as=${encodeURIComponent(username)}`;
  // The dataset lists passwords for the demo page; quick sign-in never returns them.
  const listed = new Map(
    (status?.accounts ?? []).map((account) => [account.username, account]),
  );
  const first = accounts?.[0];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('visitors.title')}</CardTitle>
        <CardDescription>{t('visitors.description')}</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {accounts === null ? (
          <Skeleton className='h-24 w-full' />
        ) : !accounts.length ? (
          <p className='text-sm text-muted-foreground'>
            {status?.present ? t('visitors.off') : t('visitors.noData')}
          </p>
        ) : (
          <>
            <ul className='divide-y rounded-lg border'>
              {accounts.map((account) => (
                <li
                  key={account.username}
                  className='flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm font-medium'>
                      {account.name}
                      <span className='ml-2 text-muted-foreground font-normal'>
                        {account.role}
                      </span>
                    </p>
                    <p className='truncate text-xs text-muted-foreground'>
                      {t('visitors.credentials', {
                        username: account.username,
                        password: listed.get(account.username)?.password ?? '—',
                      })}
                    </p>
                  </div>
                  <div className='flex shrink-0 gap-2'>
                    <CopyButton
                      value={entry(account.username)}
                      label={t('visitors.copyLinkFor', { name: account.name })}
                    />
                    <Button
                      size='sm'
                      variant='ghost'
                      render={
                        <a
                          href={entry(account.username)}
                          target='_blank'
                          rel='noopener'
                          aria-label={t('visitors.openFor', {
                            name: account.name,
                          })}
                        />
                      }
                    >
                      <ExternalLink />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            {first ? (
              <div className='flex flex-col gap-2'>
                <div className='flex items-center justify-between gap-2'>
                  <p className='text-sm font-medium'>{t('visitors.embed')}</p>
                  <CopyButton
                    value={`<iframe src="${entry(first.username)}" title="Demo" style="width:100%;height:780px;border:0"></iframe>`}
                    label={t('visitors.copyEmbed')}
                    text={t('visitors.copyEmbed')}
                  />
                </div>
                <p className='text-sm text-muted-foreground'>
                  {t('visitors.embedHelp')}
                </p>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
