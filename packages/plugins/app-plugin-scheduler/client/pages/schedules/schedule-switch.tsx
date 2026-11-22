/**
 * The switch that pauses or resumes a Schedule. Pausing asks first and says what it does and does not do; a Schedule
 * removed from code has no switch. Only who may manage Schedules sees it; the API checks the same permission.
 */
import { useToaster } from '@nocobase/app-client';
import { useState, type ReactElement } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog.js';
import { Button } from '../../components/ui/button.js';
import { Switch } from '../../components/ui/switch.js';
import { useSchedulerTranslation } from '../../lib/i18n.js';
import { useSchedulerApi, type Schedule } from '../../lib/api.js';

export function ScheduleSwitch({
  schedule,
  onChanged,
}: {
  readonly schedule: Schedule;
  readonly onChanged: (schedule: Schedule) => void;
}): ReactElement | null {
  const { t } = useSchedulerTranslation();
  const api = useSchedulerApi();
  const toaster = useToaster();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  if (schedule.lifecycleState === 'inactive')
    return <span className='text-muted-foreground'>—</span>;
  const change = async (enabled: boolean) => {
    setBusy(true);
    try {
      onChanged(await api.setEnabled(schedule.id, enabled));
      setConfirming(false);
    } catch (error) {
      void toaster.show({
        type: 'error',
        title: t('tasks.toggleFailed'),
        ...(error instanceof Error ? { description: error.message } : {}),
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Switch
        checked={schedule.enabled}
        disabled={busy}
        aria-label={t(schedule.enabled ? 'tasks.disable' : 'tasks.enable', {
          title: schedule.title,
        })}
        onCheckedChange={(checked) => {
          if (checked) void change(true);
          else setConfirming(true);
        }}
      />
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('pause.title', { title: schedule.title })}
            </AlertDialogTitle>
            <AlertDialogDescription render={<div />}>
              <p>{t('pause.description')}</p>
              <ul className='mt-2 list-disc space-y-1 pl-5 text-left'>
                <li>{t('pause.running')}</li>
                <li>{t('pause.missed')}</li>
                <li>{t('pause.redeploy')}</li>
                {schedule.limit !== undefined ? (
                  <li>{t('pause.limit')}</li>
                ) : null}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t('pause.cancel')}
            </AlertDialogCancel>
            <Button
              variant='destructive'
              disabled={busy}
              onClick={() => void change(false)}
            >
              {t('pause.confirm')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
