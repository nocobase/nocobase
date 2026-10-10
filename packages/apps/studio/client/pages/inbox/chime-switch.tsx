import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import { playInboxChime, useInboxChime } from '../../inbox/chime.js';

/** The sound reminder switch beside the inbox's kind filter; turning it on plays the chime once. */
export function InboxChimeSwitch(): ReactElement {
  const { t } = useTranslation();
  const chime = useInboxChime();
  return (
    <div className='flex items-center gap-2'>
      <Switch
        id='studio-inbox-chime'
        size='sm'
        checked={chime.enabled}
        onCheckedChange={(checked) => {
          chime.setEnabled(checked);
          if (checked) playInboxChime({ preview: true });
        }}
      />
      <Label
        htmlFor='studio-inbox-chime'
        className='text-xs text-muted-foreground'
        title={t('inbox.chime.hint')}
      >
        {t('inbox.chime.label')}
      </Label>
    </div>
  );
}
