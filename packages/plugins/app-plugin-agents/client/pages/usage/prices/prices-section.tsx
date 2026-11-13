/**
 * The model prices, in the Usage page's prices sheet: Online, each enabled service's models, priced by (service, model);
 * Runner, each coding tool, priced by (tool, model) with its subscription switch (`tool-panel.tsx`). The services come
 * from this plugin's cache, so a model turned on on the Models page shows here at once. Shown to who reads
 * `agents.prices`, changed by who manages it.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { ChevronRightIcon, TerminalIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import type { ModelCatalog } from '../../../../shared/models.js';
import type { PricesAnswer } from '../../../../shared/reports.js';
import { agentsKeys } from '../../../api/keys.js';
import { Badge } from '../../../components/ui/badge.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible.js';
import { Item, ItemGroup } from '../../../components/ui/item.js';
import { Separator } from '../../../components/ui/separator.js';
import { AgLoadError } from '../../../components/ag-states.js';
import { TableCell, TableRow } from '../../../components/ui/table.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';
import { useNotify } from '../../../hooks/use-notify.js';
import {
  AGENT_TOOLS,
  exactPrice,
  mergePriceCatalogs,
  onlineKey,
  onlinePairs,
  withPrice,
} from './model.js';
import { PriceCells, PriceTable } from './price-cells.js';
import { ToolPanel } from './tool-panel.js';
import { useSavePrices } from './use-save-prices.js';

export function PricesSection({
  prices,
  canEdit,
}: {
  readonly prices: PricesAnswer;
  readonly canEdit: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const models = useQuery({
    // Keep all priced kinds separate from chat pickers while sharing service-change invalidation.
    queryKey: [...agentsKeys.models, 'prices'],
    queryFn: async () => ({
      services: mergePriceCatalogs(
        await Promise.all([
          api.models(),
          api.models('embedding'),
          api.models('rerank'),
        ]),
      ),
    }),
  });
  const services = models.data?.services ?? [];
  return (
    <div className='flex flex-col gap-6'>
      {models.isError ? (
        <AgLoadError
          title={t('prices.loadFailed')}
          error={models.error}
          onRetry={() => void models.refetch()}
        />
      ) : null}
      {services.length > 0 ? (
        <>
          <OnlinePrices prices={prices} canEdit={canEdit} services={services} />
          <Separator />
        </>
      ) : null}
      <section
        className='flex flex-col gap-3'
        aria-labelledby='ag-prices-runner'
      >
        <h3 id='ag-prices-runner' className='text-sm font-medium'>
          {t('prices.section.runner')}
        </h3>
        <ItemGroup className='gap-2' aria-label={t('prices.section.runner')}>
          {AGENT_TOOLS.map((tool) => (
            <Item key={tool} variant='outline' role='listitem' className='p-0'>
              <Collapsible className='w-full'>
                <CollapsibleTrigger className='group/tool flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50'>
                  <TerminalIcon className='size-4 text-muted-foreground' />
                  <span className='flex-1'>{t(`tools.${tool}`)}</span>
                  {prices.subscriptions.includes(tool) ? (
                    <Badge variant='secondary'>
                      {t('prices.tool.subscriptionTag')}
                    </Badge>
                  ) : null}
                  <ChevronRightIcon className='size-4 text-muted-foreground transition-transform group-data-[panel-open]/tool:rotate-90' />
                </CollapsibleTrigger>
                <CollapsibleContent className='border-t px-3 py-4'>
                  <ToolPanel tool={tool} prices={prices} canEdit={canEdit} />
                </CollapsibleContent>
              </Collapsible>
            </Item>
          ))}
        </ItemGroup>
      </section>
    </div>
  );
}

/** Each enabled service's models, priced at that service. */
function OnlinePrices({
  prices,
  canEdit,
  services,
}: {
  readonly prices: PricesAnswer;
  readonly canEdit: boolean;
  readonly services: ModelCatalog['services'];
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const save = useSavePrices();
  const groups = onlinePairs(services);
  return (
    <section className='flex flex-col gap-3' aria-labelledby='ag-prices-online'>
      <h3 id='ag-prices-online' className='text-sm font-medium'>
        {t('prices.section.online')}
      </h3>
      <PriceTable
        label={t('prices.section.online')}
        model={t('prices.price.model')}
      >
        {groups.flatMap(({ service, models }) =>
          models.map((model) => {
            const key = onlineKey(service.name, model);
            const price = exactPrice(prices.items, key);
            const label = `${service.title} · ${model}`;
            return (
              <TableRow key={`${service.name}/${model}`} aria-label={label}>
                <TableCell className='max-w-0 px-3'>
                  <div className='truncate font-mono'>{model}</div>
                  <div className='truncate text-muted-foreground'>
                    {service.title}
                  </div>
                </TableCell>
                <PriceCells
                  key={`${price?.id ?? 'none'}:${price?.updatedAt ?? ''}`}
                  model={label}
                  price={price}
                  exact
                  canEdit={canEdit}
                  onSave={(amounts) =>
                    save.mutateAsync(withPrice(prices, key, amounts), {
                      onSuccess: () =>
                        notify.success(t('prices.price.saved', { model })),
                      onError: (error) => notify.error(error),
                    })
                  }
                />
              </TableRow>
            );
          }),
        )}
      </PriceTable>
    </section>
  );
}
