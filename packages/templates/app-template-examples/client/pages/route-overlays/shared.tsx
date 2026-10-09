import { useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useId, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { RouteDialog } from '#components/route-dialog';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Label } from '#components/ui/label';
import { Textarea } from '#components/ui/textarea';

function CloseAction() {
  const { t } = useTranslation();
  const { close, isClosing } = useRouteOverlay();
  return (
    <Button
      disabled={isClosing}
      onClick={() => {
        void close().catch((error: unknown) => {
          console.error('Failed to close route overlay', error);
        });
      }}
    >
      {t('actions.close')}
    </Button>
  );
}

export function RouteOverlayExample({
  variant,
  nested = false,
}: {
  variant: 'dialog' | 'drawer';
  nested?: boolean;
}) {
  const { t } = useTranslation();
  const toaster = useToaster();
  const [draft, setDraft] = useState('');
  const [allowClose, setAllowClose] = useState(true);
  const fieldId = useId();
  const location = useLocation();
  const Overlay = variant === 'dialog' ? RouteDialog : RouteDrawer;
  return (
    <Overlay
      title={t(
        variant === 'dialog'
          ? 'routeOverlays.dialogTitle'
          : 'routeOverlays.drawerTitle',
      )}
      description={t('routeOverlays.hint')}
      footer={<CloseAction />}
      beforeClose={() => allowClose}
    >
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor={fieldId}>{t('routeOverlays.draft')}</Label>
          <Textarea
            id={fieldId}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={allowClose}
            onChange={(event) => setAllowClose(event.target.checked)}
          />
          {t('routeOverlays.allowClose')}
        </label>
        <div className='flex flex-wrap gap-2'>
          {!nested && (
            <Button
              render={
                <Link
                  to={{
                    pathname: variant === 'dialog' ? 'drawer' : 'dialog',
                    search: location.search,
                  }}
                />
              }
              nativeButton={false}
              variant='outline'
            >
              {t(
                variant === 'dialog'
                  ? 'routeOverlays.openDrawer'
                  : 'routeOverlays.openDialog',
              )}
            </Button>
          )}
          {/* Raised from inside the overlay, so it shows whether the toaster stays above it. */}
          <Button
            variant='outline'
            onClick={() =>
              toaster.show({
                type: 'success',
                title: t('routeOverlays.toastTitle'),
                description: t('routeOverlays.toastDescription'),
              })
            }
          >
            {t('routeOverlays.showToast')}
          </Button>
        </div>
        <p className='text-sm text-muted-foreground'>
          {t('routeOverlays.historyHint')}
        </p>
        {/* This page owns its child route, so it places the outlet itself. */}
        {!nested && <Outlet />}
      </div>
    </Overlay>
  );
}
