import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Button } from '@/components/ui/button';
import { Toaster, toast } from '@/components/ui/toast';

import { ExamplePage, ExampleSection } from '../shared';

const TOAST_TYPES = ['success', 'info', 'warning', 'error'] as const;

export default function ToastExamplePage(): ReactElement {
  const { t } = useTranslation();

  const showUndoToast = (): void => {
    const id = toast.add({
      type: 'success',
      title: t('components.toast.archivedTitle', { number: 'ORD-1039' }),
      description: t('components.toast.archivedBody'),
      actionProps: {
        children: t('components.toast.undo'),
        onClick: () => toast.close(id),
      },
    });
  };

  const showLongToast = (): void => {
    toast.add({
      type: 'error',
      title: t('components.toast.paymentFailedTitle'),
      description: t('components.toast.paymentFailedBody'),
      priority: 'high',
      timeout: 0,
    });
  };

  const showExportToast = (): void => {
    void toast.promise(
      new Promise<number>((resolve) => {
        window.setTimeout(() => resolve(118), 2000);
      }),
      {
        loading: t('components.toast.exportLoading'),
        success: (count: number) =>
          t('components.toast.exportSuccess', { count }),
        error: t('components.toast.exportError'),
      },
    );
  };

  return (
    <ExamplePage
      title={t('components.toast.title')}
      description={t('components.toast.description')}
      docs='https://ui.shadcn.com/docs/components/toast'
    >
      <Toaster />

      <ExampleSection
        title={t('components.toast.basic')}
        description={t('components.toast.basicDescription')}
      >
        <Button
          variant='outline'
          onClick={() =>
            toast.add({
              title: t('components.toast.savedTitle'),
              description: t('components.toast.savedBody'),
            })
          }
        >
          {t('reference.save')}
        </Button>
      </ExampleSection>

      <ExampleSection
        title={t('components.toast.types')}
        description={t('components.toast.typesDescription')}
      >
        {TOAST_TYPES.map((type) => (
          <Button
            key={type}
            variant='outline'
            onClick={() =>
              toast.add({
                type,
                title: t(`components.toast.headline.${type}`),
                description: t(`components.toast.body.${type}`),
                priority: type === 'error' ? 'high' : 'low',
              })
            }
          >
            {t(`components.toast.type.${type}`)}
          </Button>
        ))}
      </ExampleSection>

      <ExampleSection
        title={t('components.toast.withAction')}
        description={t('components.toast.withActionDescription')}
      >
        <Button variant='outline' onClick={showUndoToast}>
          {t('components.toast.archiveOrder')}
        </Button>
      </ExampleSection>

      <ExampleSection
        title={t('components.toast.longDescription')}
        description={t('components.toast.longDescriptionDescription')}
      >
        <Button variant='outline' onClick={showLongToast}>
          {t('components.toast.retryPayment')}
        </Button>
      </ExampleSection>

      <ExampleSection
        title={t('components.toast.promise')}
        description={t('components.toast.promiseDescription')}
      >
        <Button variant='outline' onClick={showExportToast}>
          {t('components.toast.exportInvoices')}
        </Button>
      </ExampleSection>
    </ExamplePage>
  );
}
