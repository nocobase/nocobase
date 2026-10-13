import { useState, type ReactElement } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import type { LifecycleDescription } from '@nocobase/lifecycle';
import { parameterApi } from '../lib/parameter-api.js';
import { useLoader } from '../lib/use-loader.js';
import { NAMESPACE } from '../lib/format.js';
import { ParameterEditor } from './parameter-editor.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog.js';

export function boundParameterGroups(
  description: LifecycleDescription,
  kind: 'state' | 'transition',
  name: string,
): readonly string[] {
  return (description.parameterConfiguration?.groups ?? [])
    .filter((group) =>
      Object.values(group.fields).some((field) =>
        field.bindings?.some((binding) => binding[kind] === name),
      ),
    )
    .map((group) => group.key);
}
export function useParameterBindingEditor(
  description: LifecycleDescription,
  actor: string,
  onSaved?: () => void,
): {
  readonly refresh: number;
  readonly onBinding: (kind: 'state' | 'transition', name: string) => boolean;
  readonly editor: ReactElement;
} {
  const client = useApiClient();
  const api = parameterApi(client, actor);
  const { t } = useTranslation(NAMESPACE);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [opening, setOpening] = useState(0);
  const [selected, setSelected] = useState<readonly string[]>([]);
  const { data, error } = useLoader(
    selected.length
      ? () => Promise.all(selected.map((key) => api.read(key)))
      : undefined,
    `binding:${actor}:${opening}:${selected.join(',')}`,
  );
  return {
    refresh,
    onBinding: (kind, name) => {
      const groups = boundParameterGroups(description, kind, name);
      if (!groups.length) return false;
      // A fresh key prevents the previous opening from initializing a new form with stale values.
      setOpening((value) => value + 1);
      setSelected(groups);
      return true;
    },
    editor: (
      <Dialog
        open={selected.length > 0}
        onOpenChange={(open) => {
          if (!open && !busy) setSelected([]);
        }}
      >
        <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>{t('parameters.editCurrent')}</DialogTitle>
            <DialogDescription>
              {t('parameters.historyBoundary')}
            </DialogDescription>
          </DialogHeader>
          <div className='min-h-0 divide-y overflow-y-auto'>
            {error && (
              <p role='alert' className='text-sm text-destructive'>
                {error}
              </p>
            )}
            {selected.length > 0 && !data && !error && (
              <p role='status' className='text-sm text-muted-foreground'>
                {t('parameters.loading')}
              </p>
            )}
            {data?.map((group) => (
              <ParameterEditor
                key={`${actor}:${group.key}`}
                embedded
                onBusyChange={setBusy}
                group={group}
                api={api}
                actor={actor}
                onSaved={() => {
                  setSelected([]);
                  setRefresh((current) => current + 1);
                  onSaved?.();
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    ),
  };
}
