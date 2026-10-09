import { useTranslation } from '@nocobase/i18n/client';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';

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

export default function RouteChildPageDialogPage() {
  const { t } = useTranslation();

  return (
    <RouteDialog
      description={t('routeOverlays.topicDialogDescription')}
      footer={<CloseAction />}
      title={t('routeOverlays.topicDialogTitle')}
    >
      <p className='text-sm leading-6 text-muted-foreground'>
        {t('routeOverlays.topicDialogHint')}
      </p>
    </RouteDialog>
  );
}
