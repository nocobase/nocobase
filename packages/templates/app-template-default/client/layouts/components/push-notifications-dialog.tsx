import { PushPreferences } from '@nocobase/app-plugin-notification-web-push/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';

export interface PushNotificationsDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/**
 * The signed-in person's own devices, from @nocobase/app-plugin-notification-web-push. Nothing here asks for
 * notification permission until the person chooses to subscribe; the plugin also says when push is not configured,
 * not supported or blocked.
 */
export function PushNotificationsDialog({
  open,
  onOpenChange,
}: PushNotificationsDialogProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90svh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>
            {t('account.pushNotifications', {
              defaultValue: 'Push notifications',
            })}
          </DialogTitle>
          <DialogDescription>
            {t('account.pushNotificationsDescription', {
              defaultValue:
                'Choose which of your devices receive notifications from this application.',
            })}
          </DialogDescription>
        </DialogHeader>
        {open ? <PushPreferences /> : null}
      </DialogContent>
    </Dialog>
  );
}
