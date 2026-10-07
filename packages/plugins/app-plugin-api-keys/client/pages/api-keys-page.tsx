import { PageContainer } from '../components/page-container.js';
import { Spinner } from '../components/ui/spinner.js';
import { PageHeader } from '../components/page-header.js';
import { useTranslation } from '@nocobase/i18n/client';
import { Check, Copy, Plus, Trash2 } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';

import { useAuthenticationClient } from '@nocobase/app-plugin-authentication/client';

import type { ApiKeySummary } from '../api-keys-client.js';
import { Badge } from '../components/ui/badge.js';
import { Button } from '../components/ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog.js';
import { Input } from '../components/ui/input.js';
import { Label } from '../components/ui/label.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.js';
import {
  API_KEY_EXPIRY_CHOICES,
  expiryChoiceToSeconds,
  formatKeyHint,
  isExpired,
  type ApiKeyExpiryChoice,
} from '../expiry.js';

export default function ApiKeysPage(): ReactElement {
  const { t, i18n } = useTranslation('@nocobase/app-plugin-api-keys');
  const auth = useAuthenticationClient();
  const [keys, setKeys] = useState<readonly ApiKeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKeySummary>();
  // Held only until the reveal dialog closes. The server never returns it again.
  const [issued, setIssued] = useState<{ name: string; key: string }>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const { data, error: reason } = await auth.apiKey.list();
      if (reason) throw new Error(reason.message);
      setKeys(data?.apiKeys ?? []);
    } catch (reason) {
      setError(readError(reason, t('errors.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [auth, t]);

  useEffect(() => {
    // Loading the list is what this page mounts to do; `load` sets its
    // pending flag before the first await, which the rule cannot see past.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const create = async (
    name: string,
    expiry: ApiKeyExpiryChoice,
  ): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      const expiresIn = expiryChoiceToSeconds(expiry);
      const { data, error: reason } = await auth.apiKey.create({
        name,
        ...(expiresIn === undefined ? {} : { expiresIn }),
      });
      if (reason) throw new Error(reason.message);
      if (!data?.key) throw new Error(t('errors.createFailed'));
      setCreating(false);
      setIssued({ name, key: data.key });
      await load();
    } catch (reason) {
      setError(readError(reason, t('errors.createFailed')));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (key: ApiKeySummary): Promise<void> => {
    setBusy(true);
    setError(undefined);
    try {
      const { error: reason } = await auth.apiKey.delete({ keyId: key.id });
      if (reason) throw new Error(reason.message);
      setRevoking(undefined);
      await load();
    } catch (reason) {
      setError(readError(reason, t('errors.revokeFailed')));
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (value: Date | string | null): string =>
    value ? new Date(value).toLocaleString(i18n.language) : t('page.never');

  return (
    <PageContainer>
      <PageHeader
        title={t('page.title')}
        description={t('page.description')}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> {t('page.add')}
          </Button>
        }
      />

      {error ? (
        <div className='rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>
          {error}
        </div>
      ) : null}

      <div className='overflow-hidden rounded-xl border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('page.columns.name')}</TableHead>
              <TableHead>{t('page.columns.key')}</TableHead>
              <TableHead>{t('page.columns.status')}</TableHead>
              <TableHead>{t('page.columns.lastUsed')}</TableHead>
              <TableHead>{t('page.columns.expires')}</TableHead>
              <TableHead className='w-14'>
                <span className='sr-only'>{t('page.columns.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='h-32 text-center text-muted-foreground'
                >
                  <Spinner
                    className='mx-auto size-5'
                    aria-label={t('page.loading')}
                  />
                </TableCell>
              </TableRow>
            ) : keys.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='h-32 text-center text-muted-foreground'
                >
                  {t('page.empty')}
                </TableCell>
              </TableRow>
            ) : (
              keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className='font-medium'>
                    {key.name ?? t('page.unnamed')}
                  </TableCell>
                  <TableCell className='font-mono text-xs text-muted-foreground'>
                    {formatKeyHint(key)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        key.enabled && !isExpired(key.expiresAt)
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {!key.enabled
                        ? t('page.disabled')
                        : isExpired(key.expiresAt)
                          ? t('page.expired')
                          : t('page.active')}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {key.lastRequest
                      ? formatDate(key.lastRequest)
                      : t('page.unused')}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {formatDate(key.expiresAt)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={t('page.actions.revoke')}
                      onClick={() => setRevoking(key)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateKeyDialog
        open={creating}
        busy={busy}
        onOpenChange={setCreating}
        onSubmit={create}
      />
      <RevealKeyDialog issued={issued} onClose={() => setIssued(undefined)} />
      <RevokeKeyDialog
        target={revoking}
        busy={busy}
        onCancel={() => setRevoking(undefined)}
        onConfirm={revoke}
      />
    </PageContainer>
  );
}

function CreateKeyDialog({
  open,
  busy,
  onOpenChange,
  onSubmit,
}: {
  readonly open: boolean;
  readonly busy: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (
    name: string,
    expiry: ApiKeyExpiryChoice,
  ) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-api-keys');
  const [name, setName] = useState('');
  const [expiry, setExpiry] = useState<ApiKeyExpiryChoice>('90');

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    void onSubmit(name.trim(), expiry);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setName('');
          setExpiry('90');
        }
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>{t('form.title')}</DialogTitle>
            <DialogDescription>{t('form.description')}</DialogDescription>
          </DialogHeader>
          <div className='space-y-2'>
            <Label htmlFor='api-key-name'>{t('form.name')}</Label>
            <Input
              id='api-key-name'
              value={name}
              required
              maxLength={32}
              placeholder={t('form.namePlaceholder')}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className='space-y-2'>
            <Label>{t('form.expiry')}</Label>
            <Select
              items={API_KEY_EXPIRY_CHOICES.map((choice) => ({
                value: choice,
                label: t(`form.expiryChoices.${choice}`),
              }))}
              value={expiry}
              onValueChange={(value) => setExpiry(value as ApiKeyExpiryChoice)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                {API_KEY_EXPIRY_CHOICES.map((choice) => (
                  <SelectItem key={choice} value={choice}>
                    {t(`form.expiryChoices.${choice}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              {t('form.cancel')}
            </Button>
            <Button type='submit' disabled={busy || name.trim().length === 0}>
              {busy ? (
                <Spinner
                  data-icon='inline-start'
                  aria-label={t('page.loading')}
                />
              ) : null}
              {t('form.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RevealKeyDialog({
  issued,
  onClose,
}: {
  readonly issued: { readonly name: string; readonly key: string } | undefined;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-api-keys');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <Dialog
      open={issued !== undefined}
      onOpenChange={(next) => {
        if (!next) {
          setCopied(false);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('reveal.title')}</DialogTitle>
          <DialogDescription>
            {t('reveal.description', { name: issued?.name ?? '' })}
          </DialogDescription>
        </DialogHeader>
        <div className='mt-4 flex items-center gap-2 rounded-lg border bg-muted/40 p-3'>
          <code className='flex-1 font-mono text-xs break-all'>
            {issued?.key}
          </code>
          <Button
            variant='outline'
            size='icon-sm'
            aria-label={t('reveal.copy')}
            onClick={() => {
              if (!issued) return;
              void navigator.clipboard
                .writeText(issued.key)
                .then(() => setCopied(true));
            }}
          >
            {copied ? <Check /> : <Copy />}
          </Button>
        </div>
        <p className='mt-3 text-sm text-muted-foreground'>
          {t('reveal.usage')}
        </p>
        <DialogFooter>
          <Button onClick={onClose}>{t('reveal.done')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RevokeKeyDialog({
  target,
  busy,
  onCancel,
  onConfirm,
}: {
  readonly target: ApiKeySummary | undefined;
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: (key: ApiKeySummary) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-api-keys');

  return (
    <AlertDialog
      open={target !== undefined}
      onOpenChange={(next) => {
        if (!next && !busy) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('revoke.title', { name: target?.name ?? t('page.unnamed') })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('revoke.description', {
              name: target?.name ?? t('page.unnamed'),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t('revoke.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={busy}
            onClick={() => {
              if (target) void onConfirm(target);
            }}
          >
            {busy ? (
              <Spinner
                data-icon='inline-start'
                aria-label={t('page.loading')}
              />
            ) : null}
            {t('revoke.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function readError(value: unknown, fallback: string): string {
  if (value instanceof Error && value.message) return value.message;
  return fallback;
}
