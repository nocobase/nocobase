import { useApiClient } from '@nocobase/app-client';
import { useEffect, useState, type ReactElement } from 'react';

import type { DemoWriteRule } from '../../server/configuration/types.js';
import { MultiSelect } from '../components/multi-select.js';
import { Badge } from '../components/ui/badge.js';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '../components/ui/empty.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.js';
import { Switch } from '../components/ui/switch.js';
import { useDraft, useLabel, useT, type Configuration } from './context.js';
import { ErrorAlert, SettingsCard } from './shared.js';

const OPERATIONS = ['insert', 'update', 'delete'] as const;

/**
 * The business operations the application registered as safe to open in a read-only demo, each allowed per operation
 * and limited to a scope such as the demo's own records.
 */
export function CapabilitiesCard({
  configuration,
}: {
  readonly configuration: Configuration;
}): ReactElement {
  const t = useT();
  const label = useLabel();
  const { view } = configuration;
  const draft = useDraft('rules', 'writeRules', view.rules, configuration);
  const rules = draft.draft;
  const disabled = !configuration.canEdit || draft.saving || view.busy;
  const ruleOf = (capability: string, operation: string) =>
    rules.find(
      (rule) => rule.capability === capability && rule.operation === operation,
    );
  const without = (capability: string, operation: string) =>
    rules.filter(
      (rule) =>
        !(rule.capability === capability && rule.operation === operation),
    );
  const describe = (rule: DemoWriteRule) => {
    const item = view.capabilities.find(({ id }) => id === rule.capability);
    const scope = item?.scopes.find(({ id }) => id === rule.scope);
    return `${label('capability', rule.capability, item?.title)} · ${t(`writes.operation.${rule.operation}`)} · ${label('scope', rule.scope, scope?.title)}`;
  };
  const key = (rule: DemoWriteRule) =>
    `${rule.capability}:${rule.operation}:${rule.scope}`;
  const before = new Set(view.rules.map(key));
  const after = new Set(rules.map(key));
  const changes = [
    ...rules
      .filter((rule) => !before.has(key(rule)))
      .map((rule) => `${t('writes.allow')}: ${describe(rule)}`),
    ...view.rules
      .filter((rule) => !after.has(key(rule)))
      .map((rule) => `${t('writes.revoke')}: ${describe(rule)}`),
  ];
  return (
    <SettingsCard
      title={t('writes.capabilities.title')}
      description={t('writes.capabilities.description')}
      draft={draft}
      canEdit={configuration.canEdit}
      busy={view.busy}
      confirmation={{
        title: t('writes.confirmTitle'),
        description: t('writes.confirmDescription'),
        changes,
        destructive: rules.some((rule) => !before.has(key(rule))),
      }}
    >
      {!view.capabilities.length ? (
        <Empty className='border border-dashed'>
          <EmptyHeader>
            <EmptyTitle>{t('writes.capabilities.empty')}</EmptyTitle>
            <EmptyDescription>
              {t('writes.capabilities.emptyHelp')}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className='divide-y rounded-lg border'>
          {view.capabilities.map((item) => (
            <li key={item.id} className='flex flex-col gap-3 p-4'>
              <div className='flex flex-wrap items-baseline gap-2'>
                <span className='font-medium'>
                  {label('capability', item.id, item.title)}
                </span>
                <code className='text-xs text-muted-foreground'>
                  {item.collection}
                </code>
              </div>
              <div className='grid gap-2 sm:grid-cols-3'>
                {OPERATIONS.filter((operation) =>
                  item.operations.includes(operation),
                ).map((operation) => {
                  const rule = ruleOf(item.id, operation);
                  const id = `demo-rule-${item.id}-${operation}`;
                  return (
                    <div
                      key={operation}
                      className='flex flex-col gap-2 rounded-md bg-muted/40 p-3'
                    >
                      <label
                        htmlFor={id}
                        className='flex items-center justify-between gap-2 text-sm'
                      >
                        {t(`writes.operation.${operation}`)}
                        <Switch
                          id={id}
                          checked={Boolean(rule)}
                          disabled={disabled}
                          onCheckedChange={(checked) =>
                            draft.setDraft(
                              checked
                                ? [
                                    ...without(item.id, operation),
                                    {
                                      capability: item.id,
                                      operation,
                                      scope: item.scopes[0]?.id ?? 'all',
                                    },
                                  ]
                                : without(item.id, operation),
                            )
                          }
                        />
                      </label>
                      {rule && item.scopes.length > 1 ? (
                        <Select
                          value={rule.scope}
                          disabled={disabled}
                          onValueChange={(scope) => {
                            if (scope !== null)
                              draft.setDraft([
                                ...without(item.id, operation),
                                { ...rule, scope },
                              ]);
                          }}
                        >
                          <SelectTrigger
                            size='sm'
                            className='w-full'
                            aria-label={`${label('capability', item.id, item.title)} · ${t(`writes.operation.${operation}`)} · ${t('writes.scope')}`}
                          >
                            <SelectValue>
                              {label(
                                'scope',
                                rule.scope,
                                item.scopes.find(({ id }) => id === rule.scope)
                                  ?.title,
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {item.scopes.map((scope) => (
                              <SelectItem key={scope.id} value={scope.id}>
                                {label('scope', scope.id, scope.title)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : rule ? (
                        <span className='text-xs text-muted-foreground'>
                          {label('scope', rule.scope, item.scopes[0]?.title)}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </SettingsCard>
  );
}

/**
 * Physical collections any authorized request may write, for state no visitor can harm such as a user's view preferences;
 * the deployment's own exceptions are listed and stay as they are.
 */
export function CollectionsCard({
  configuration,
}: {
  readonly configuration: Configuration;
}): ReactElement {
  const t = useT();
  const api = useApiClient();
  const { view } = configuration;
  const draft = useDraft(
    'collections',
    'collections',
    view.collections,
    configuration,
  );
  const [catalog, setCatalog] = useState<
    readonly { name: string; title?: string }[] | null
  >(null);
  const [catalogError, setCatalogError] = useState<unknown>();
  useEffect(() => {
    let active = true;
    api
      .request<{ data: { name: string; title?: string }[] }>({
        path: '/demoMode/configuration/collections',
      })
      .then(({ data }) => {
        if (active) setCatalog(data);
      })
      .catch((cause: unknown) => {
        if (active) setCatalogError(cause);
      });
    return () => {
      active = false;
    };
  }, [api]);
  const collections = draft.draft;
  const before = new Set(view.collections);
  const options = [
    ...new Set([...(catalog ?? []).map((item) => item.name), ...collections]),
  ].sort();
  const collectionLabel = (name: string) => {
    const title = catalog?.find((item) => item.name === name)?.title;
    return title ? `${title} (${name})` : name;
  };
  return (
    <SettingsCard
      title={t('writes.collections.title')}
      description={t('writes.collections.description')}
      draft={draft}
      canEdit={configuration.canEdit}
      busy={view.busy}
      confirmation={{
        title: t('writes.confirmTitle'),
        description: t('writes.confirmDescription'),
        changes: [
          ...collections
            .filter((table) => !before.has(table))
            .map((table) => `${t('writes.allow')}: ${table}`),
          ...view.collections
            .filter((table) => !collections.includes(table))
            .map((table) => `${t('writes.revoke')}: ${table}`),
        ],
        destructive: collections.some((table) => !before.has(table)),
      }}
    >
      <ErrorAlert error={catalogError} />
      <MultiSelect
        aria-label={t('writes.collections.label')}
        placeholder={t('writes.collections.placeholder')}
        emptyText={t('writes.collections.noMatch')}
        options={options}
        label={collectionLabel}
        value={collections}
        disabled={
          !configuration.canEdit || draft.saving || view.busy || !catalog
        }
        onChange={(value) => draft.setDraft(value.slice(0, 100))}
      />
      <div className='flex flex-col gap-2'>
        <p className='text-sm font-medium'>{t('writes.collections.fixed')}</p>
        <div className='flex flex-wrap gap-1.5'>
          {view.fixedCollections.map((table) => (
            <Badge key={table} variant='secondary'>
              {table}
            </Badge>
          ))}
        </div>
        <p className='text-sm text-muted-foreground'>
          {t('writes.collections.fixedHelp')}
        </p>
      </div>
    </SettingsCard>
  );
}
