import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';
import { useLocation } from 'react-router';
import { RouteDialog } from '#components/route-dialog';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '#components/ui/alert';
import { Info } from 'lucide-react';
import { StatusBadge } from '#components/status-badge';
function Content(): ReactElement {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col gap-4'>
      <Alert data-tone='info'>
        <Info aria-hidden='true' />
        <AlertTitle>{t('gallery.alertTitle')}</AlertTitle>
        <AlertDescription>{t('gallery.alertText')}</AlertDescription>
      </Alert>
      <div className='flex flex-wrap gap-2'>
        {(['neutral', 'info', 'warning', 'success'] as const).map((tone) => (
          <StatusBadge key={tone} tone={tone}>
            {tone}
          </StatusBadge>
        ))}
      </div>
    </div>
  );
}
function Footer(): ReactElement {
  const { t } = useTranslation();
  const { close, isClosing } = useRouteOverlay();
  return (
    <Button variant='outline' disabled={isClosing} onClick={() => void close()}>
      {t('gallery.close')}
    </Button>
  );
}
export default function GalleryOverlay(): ReactElement {
  const { t } = useTranslation();
  const sheet = useLocation().pathname.endsWith('/sheet');
  const Overlay = sheet ? RouteDrawer : RouteDialog;
  return (
    <Overlay
      title={t(sheet ? 'gallery.sheet' : 'gallery.dialog')}
      description={t('gallery.overlayText')}
      footer={<Footer />}
    >
      <Content />
    </Overlay>
  );
}
