import { useApiClient } from '@nocobase/app-client';
import { useEffect, useState, type ReactElement } from 'react';

import { MultiSelect } from '../components/multi-select.js';
import { Badge } from '../components/ui/badge.js';
import { useDraft, useT, type Configuration } from './context.js';
import { ErrorAlert, SettingsCard } from './shared.js';

/** Logical collections that authorized requests may write; deployment exceptions remain fixed. */
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
