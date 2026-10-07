/**
 * A coding tool's prices (Runner): whether it is paid by subscription, so its runs cost nothing; the models its runs
 * reported, each with the price that applies to it (its own, or a rule's) edited in place; and the tool's price rules,
 * folded away, where a model or a pattern is priced, changed or removed.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { ChevronRightIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { priceFor, type PricesAnswer } from '../../../../shared/reports.js';
import { Button } from '../../../components/ui/button.js';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../components/ui/collapsible.js';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from '../../../components/ui/field.js';
import { Input } from '../../../components/ui/input.js';
import { Switch } from '../../../components/ui/switch.js';
import { TableCell, TableRow } from '../../../components/ui/table.js';
import { useNotify } from '../../../hooks/use-notify.js';
import { cn } from 'cn';
import {
  exactPrice,
  parseAmount,
  toolKey,
  toolPrices,
  withoutPrice,
  withPrice,
  withSubscription,
  type AgentTool,
} from './model.js';
import { PriceCells, PriceTable } from './price-cells.js';
import { useSavePrices } from './use-save-prices.js';

export function ToolPanel({
  tool,
  prices,
  canEdit,
}: {
  readonly tool: AgentTool;
  readonly prices: PricesAnswer;
  readonly canEdit: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const save = useSavePrices();
  const title = t(`tools.${tool}`);
  const subscribed = prices.subscriptions.includes(tool);
  const seen = prices.seen.filter((item) => item.tool === tool);
  const rules = toolPrices(prices.items, tool);
  const [model, setModel] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const inputAmount = parseAmount(input);
  const outputAmount = parseAmount(output);
  const canAdd =
    Boolean(model.trim()) &&
    Boolean(input.trim() || output.trim()) &&
    inputAmount !== null &&
    outputAmount !== null;
  const switchId = `ag-tool-subscription-${tool}`;

  const saveRow =
    (id: string) =>
    (amounts: { readonly inputPerM: number; readonly outputPerM: number }) =>
      save.mutateAsync(withPrice(prices, toolKey(tool, id), amounts), {
        onSuccess: () => notify.success(t('prices.price.saved', { model: id })),
        onError: (error) => notify.error(error),
      });

  return (
    <div className='flex flex-col gap-6'>
      <Field orientation='horizontal'>
        <FieldContent>
          <FieldLabel htmlFor={switchId}>
            {t('prices.tool.subscription')}
          </FieldLabel>
          <FieldDescription>
            {t('prices.tool.subscriptionHint')}
          </FieldDescription>
        </FieldContent>
        <Switch
          id={switchId}
          aria-label={t('prices.tool.subscription')}
          checked={subscribed}
          disabled={!canEdit || save.isPending}
          onCheckedChange={(on) =>
            save.mutate(withSubscription(prices, tool, on), {
              onSuccess: () =>
                notify.success(
                  t(
                    on ? 'prices.tool.subscribed' : 'prices.tool.unsubscribed',
                    { tool: title },
                  ),
                ),
              onError: (error) => notify.error(error),
            })
          }
        />
      </Field>

      <section
        className='flex flex-col gap-3'
        aria-labelledby={`ag-tool-seen-${tool}`}
      >
        <div>
          <h4 id={`ag-tool-seen-${tool}`} className='text-sm font-medium'>
            {t('prices.tool.seen')}
          </h4>
          <p className='text-sm text-muted-foreground'>
            {t('prices.tool.description', { tool: title })}
          </p>
        </div>
        {seen.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            {t('prices.tool.noneSeen', { tool: title })}
          </p>
        ) : (
          <div className={cn(subscribed && 'opacity-60')}>
            <PriceTable
              label={t('prices.tool.seen')}
              model={t('prices.price.model')}
            >
              {seen.map((item) => {
                const own = exactPrice(prices.items, toolKey(tool, item.model));
                const price =
                  own ??
                  priceFor(
                    { prices: prices.items, subscriptions: [] },
                    { tool, modelService: null, model: item.model },
                  );
                return (
                  <TableRow key={item.model} aria-label={item.model}>
                    <TableCell className='max-w-0 truncate px-3 font-mono'>
                      {item.model}
                    </TableCell>
                    <PriceCells
                      key={`${price?.id ?? 'none'}:${price?.updatedAt ?? ''}`}
                      model={item.model}
                      price={price}
                      exact={own !== null}
                      canEdit={canEdit}
                      onSave={saveRow(item.model)}
                    />
                  </TableRow>
                );
              })}
            </PriceTable>
          </div>
        )}
      </section>

      <Collapsible className='flex flex-col gap-3'>
        <CollapsibleTrigger className='group/rules flex w-fit items-center gap-1 rounded-md text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50'>
          <ChevronRightIcon className='size-4 text-muted-foreground transition-transform group-data-[panel-open]/rules:rotate-90' />
          {t('prices.tool.rules', { count: rules.length })}
        </CollapsibleTrigger>
        <CollapsibleContent className='flex flex-col gap-3'>
          <p className='text-sm text-muted-foreground'>
            {t('prices.tool.rulesHint')}
          </p>
          {rules.length > 0 ? (
            <PriceTable
              label={t('prices.tool.rules', { count: rules.length })}
              model={t('prices.tool.ruleModel')}
            >
              {rules.map((rule) => (
                <TableRow key={rule.id} aria-label={rule.model}>
                  <TableCell
                    className='max-w-0 truncate px-3 font-mono'
                    title={rule.note ?? undefined}
                  >
                    {rule.model}
                  </TableCell>
                  <PriceCells
                    key={`${rule.id}:${rule.updatedAt}`}
                    model={rule.model}
                    price={rule}
                    exact
                    canEdit={canEdit}
                    onSave={saveRow(rule.model)}
                    actions={
                      canEdit ? (
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label={t('prices.price.remove', {
                            model: rule.model,
                          })}
                          disabled={save.isPending}
                          onClick={() =>
                            save.mutate(
                              withoutPrice(prices, toolKey(tool, rule.model)),
                              {
                                onSuccess: () =>
                                  notify.success(
                                    t('prices.price.removed', {
                                      model: rule.model,
                                    }),
                                  ),
                                onError: (error) => notify.error(error),
                              },
                            )
                          }
                        >
                          <Trash2Icon />
                        </Button>
                      ) : null
                    }
                  />
                </TableRow>
              ))}
            </PriceTable>
          ) : null}
          {canEdit ? (
            <form
              className='flex flex-wrap items-center gap-2'
              onSubmit={(event) => {
                event.preventDefault();
                const id = model.trim();
                if (!canAdd || inputAmount === null || outputAmount === null)
                  return;
                save.mutate(
                  withPrice(prices, toolKey(tool, id), {
                    inputPerM: inputAmount,
                    outputPerM: outputAmount,
                  }),
                  {
                    onSuccess: () => {
                      setModel('');
                      setInput('');
                      setOutput('');
                      notify.success(t('prices.tool.ruleAdded', { model: id }));
                    },
                    onError: (error) => notify.error(error),
                  },
                );
              }}
            >
              <Input
                className='min-w-40 flex-1 font-mono'
                aria-label={t('prices.tool.ruleModel')}
                placeholder={t('prices.tool.ruleModel')}
                value={model}
                onChange={(event) => setModel(event.target.value)}
              />
              <Input
                className='w-28 text-right tabular-nums'
                inputMode='decimal'
                aria-label={t('prices.price.input')}
                aria-invalid={inputAmount === null || undefined}
                placeholder={t('prices.price.input')}
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <Input
                className='w-28 text-right tabular-nums'
                inputMode='decimal'
                aria-label={t('prices.price.output')}
                aria-invalid={outputAmount === null || undefined}
                placeholder={t('prices.price.output')}
                value={output}
                onChange={(event) => setOutput(event.target.value)}
              />
              <Button
                type='submit'
                variant='outline'
                disabled={!canAdd || save.isPending}
              >
                <PlusIcon data-icon='inline-start' />
                {t('prices.tool.addRule')}
              </Button>
            </form>
          ) : (
            <p className='text-sm text-muted-foreground'>
              {t('prices.price.readOnly')}
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
