/**
 * The Usage page's prices sheet, opened by "Set prices" (`?prices=1`): the model prices, read behind `agents.prices`
 * read and changed behind its manage.
 */
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { agentsKeys } from '../../../api/keys.js';
import { AgListSkeleton, AgLoadError } from '../../../components/ag-states.js';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../../components/ui/sheet.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';
import { PricesSection } from './prices-section.js';

export function PricesSheet({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full gap-0 data-[side=right]:sm:max-w-2xl'>
        <SheetHeader className='border-b pr-12'>
          <SheetTitle>{t('prices.section.title')}</SheetTitle>
          <SheetDescription>{t('prices.section.description')}</SheetDescription>
        </SheetHeader>
        <div className='min-h-0 flex-1 overflow-y-auto p-4'>
          {open ? <Prices /> : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Prices(): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const canEdit = useCan({
    resource: { type: 'settings', id: 'agents.prices' },
    action: 'manage',
  }).can;
  const prices = useQuery({
    queryKey: agentsKeys.prices,
    queryFn: () => api.prices(),
  });
  if (prices.isError)
    return (
      <AgLoadError
        title={t('prices.loadFailed')}
        error={prices.error}
        onRetry={() => void prices.refetch()}
      />
    );
  if (!prices.data) return <AgListSkeleton rows={4} />;
  return <PricesSection prices={prices.data} canEdit={canEdit} />;
}
