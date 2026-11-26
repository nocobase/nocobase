import { errorToastOptions } from '@nocobase/app-client';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useAppLocale } from '@nocobase/app-plugin-i18n/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useHref } from 'react-router';
import { Bell, LoaderCircle } from 'lucide-react';
import { Button } from './ui/button.js';
import { Input } from './ui/input.js';
import { Skeleton } from './ui/skeleton.js';
import { Alert, AlertDescription } from './ui/alert.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from './ui/field.js';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog.js';
import {
  currentDevice,
  pushBase,
  rememberDevice,
  registerWorker,
  unsubscribeDevice,
  type PushDevice,
} from '../browser.js';

export function PushPreferences(): React.ReactElement | null {
  const api = useApiClient();
  const { session } = useAuthentication();
  const userId = session!.user.id;
  const base = pushBase(useHref('/'));
  const { locale } = useAppLocale();
  const { t } = useTranslation('@nocobase/app-plugin-notification-web-push');
  const toaster = useToaster();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(
    () =>
      typeof Notification !== 'undefined' &&
      Notification.permission === 'denied',
  );
  const [remove, setRemove] = useState<PushDevice | null>(null);
  const [confirm, setConfirm] = useState(false);
  const subscribeButtonRef = useRef<HTMLButtonElement>(null);
  const sectionTitleRef = useRef<HTMLSpanElement>(null);
  const devices = useQuery({
    queryKey: ['push-devices', userId],
    queryFn: async () =>
      (
        await api.request<{ data: PushDevice[] }>({
          path: `webPush/subscriptions`,
        })
      ).data,
  });
  const key = useQuery({
    queryKey: ['push-key', userId],
    queryFn: async () =>
      (
        await api.request<{ data: { publicKey: string | null } }>({
          path: `webPush/key`,
        })
      ).data.publicKey,
  });
  const supported =
    window.isSecureContext &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;
  const ios =
    /iPad|iPhone|iPod/u.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const [standalone] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone,
  );
  const current = currentDevice(base, userId);
  const registered = devices.data?.some((row) => row.id === current);
  async function act(work: () => Promise<void>, message: string) {
    setBusy(true);
    try {
      await work();
      await devices.refetch();
      toaster.show({ type: 'success', title: t(message) });
    } catch (error) {
      toaster.show({
        ...errorToastOptions(error),
        type: 'error',
        title: t('push.failed'),
      });
    } finally {
      setBusy(false);
    }
  }
  async function subscribe() {
    // Permission is requested directly from this click, before any network work (required on iOS).
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      setDenied(permission === 'denied');
      if (permission !== 'granted') return;
      const registration = await registerWorker(base);
      await navigator.serviceWorker.ready;
      const publicKey = Uint8Array.from(
        atob(key.data!.replace(/-/gu, '+').replace(/_/gu, '/')),
        (char) => char.charCodeAt(0),
      );
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        }));
      const result = await api.request<{ data: PushDevice }>({
        method: 'POST',
        path: `webPush/subscriptions`,
        json: {
          name:
            name.trim() ||
            `${navigator.platform || 'Browser'} · ${new Date().toLocaleDateString(locale)}`,
          locale,
          subscription: subscription.toJSON(),
        },
      });
      rememberDevice(base, userId, result.data.id);
      await devices.refetch();
      toaster.show({ type: 'success', title: t('push.saved') });
    } catch (error) {
      toaster.show({
        ...errorToastOptions(error),
        type: 'error',
        title: t('push.failed'),
      });
    } finally {
      setBusy(false);
    }
  }
  const unavailable = !supported
    ? 'push.unsupported'
    : key.isSuccess && !key.data
      ? 'push.unavailable'
      : denied
        ? 'push.denied'
        : null;
  const canSubscribe =
    supported && !denied && !!key.data && !(ios && !standalone) && !registered;
  const action = (
    <Button
      ref={subscribeButtonRef}
      disabled={!canSubscribe || busy}
      onClick={() => void subscribe()}
    >
      {t('push.subscribe')}
    </Button>
  );
  return (
    <FieldSet aria-labelledby='push-settings-title'>
      <FieldLegend className='flex w-full items-center justify-between gap-2'>
        <span id='push-settings-title' ref={sectionTitleRef} tabIndex={-1}>
          {t('push.title')}
        </span>
        {busy ? (
          <LoaderCircle
            className='size-4 animate-spin'
            aria-label={t('push.saving')}
          />
        ) : null}
        {!!devices.data?.length && !registered ? action : null}
      </FieldLegend>
      <FieldDescription>
        {devices.data?.length
          ? t('push.deviceCount', {
              total: devices.data.length,
              active: devices.data.filter((device) => device.enabled).length,
            })
          : t('push.description')}
      </FieldDescription>
      {ios && !standalone ? (
        <FieldDescription>{t('push.ios')}</FieldDescription>
      ) : null}
      {unavailable ? (
        <FieldDescription>{t(unavailable)}</FieldDescription>
      ) : null}
      {canSubscribe ? (
        <Field>
          <FieldLabel htmlFor='push-device-name'>{t('push.name')}</FieldLabel>
          <Input
            id='push-device-name'
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
      ) : null}
      {devices.isPending || key.isPending ? (
        <Skeleton className='h-16 w-full' />
      ) : devices.isError || key.isError ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {t('push.loadingFailed')}{' '}
            <Button
              variant='outline'
              onClick={() => {
                void devices.refetch();
                void key.refetch();
              }}
            >
              {t('push.retry')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : !devices.data.length ? (
        <Empty className='p-4'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <Bell />
            </EmptyMedia>
            <EmptyTitle>{t('push.empty')}</EmptyTitle>
            <EmptyDescription>{t('push.emptyHint')}</EmptyDescription>
          </EmptyHeader>
          {action}
        </Empty>
      ) : (
        devices.data.map((device) => (
          <Field
            className='flex-wrap rounded-lg border p-3'
            orientation='horizontal'
            key={device.id}
          >
            <FieldContent>
              <FieldTitle>{device.name}</FieldTitle>
              {device.id === current ? (
                <FieldDescription>{t('push.current')}</FieldDescription>
              ) : null}
            </FieldContent>
            <span className='text-xs text-muted-foreground'>
              {t(device.enabled ? 'push.active' : 'push.paused')}
            </span>
            <div className='flex flex-wrap items-center gap-1'>
              <Button
                size='sm'
                variant='outline'
                disabled={busy || !device.enabled}
                onClick={() => {
                  void act(async () => {
                    await api.request({
                      method: 'POST',
                      path: `webPush/subscriptions/${device.id}/test`,
                    });
                  }, 'push.testSent');
                }}
              >
                {t('push.test')}
              </Button>
              <Button
                size='sm'
                variant='outline'
                disabled={busy}
                onClick={() => {
                  void act(async () => {
                    await api.request({
                      method: 'PATCH',
                      path: `webPush/subscriptions/${device.id}`,
                      json: { enabled: !device.enabled },
                    });
                    window.dispatchEvent(new Event('nocobase:push-device'));
                  }, 'push.saved');
                }}
              >
                {t(device.enabled ? 'push.pause' : 'push.resume')}
              </Button>
              <Button
                size='sm'
                variant='ghost'
                className='text-destructive'
                disabled={busy}
                onClick={() => {
                  setRemove(device);
                  setConfirm(true);
                }}
              >
                {t('push.remove')}
              </Button>
            </div>
          </Field>
        ))
      )}
      <AlertDialog
        open={confirm}
        onOpenChange={(open) => {
          if (!busy) setConfirm(open);
        }}
      >
        <AlertDialogContent finalFocus={() => sectionTitleRef.current}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('push.removeTitle', { name: remove?.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('push.removeHint')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t('push.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void act(async () => {
                  if (remove?.id === current)
                    await unsubscribeDevice(api, base, userId);
                  else
                    await api.request({
                      method: 'DELETE',
                      path: `webPush/subscriptions/${remove!.id}`,
                    });
                  setConfirm(false);
                }, 'push.saved');
              }}
            >
              {t('push.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FieldSet>
  );
}
