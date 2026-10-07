/**
 * Where a Docker environment's release images come from: the registry it pulls each release's image from by digest,
 * with that registry's pull credentials, so it runs the very image CI pushed and another environment ran. Registries
 * are managed only here: "New registry" opens its settings, and "Edit" next to a chosen one opens its address and
 * credentials; the environment form adds or saves the registry just before saving the environment.
 */
import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { RegistryRecord } from '../../shared/releases.js';
import {
  RegistryCheckButton,
  RegistryCheckOutcome,
  RegistryFields,
} from './registry-fields.js';
import { useRegistryCheck } from '../hooks/use-registry-check.js';
import {
  registryDraft,
  registryInput,
  type RegistryDraft,
} from '../lib/registry-draft.js';
import { Button } from './ui/button.js';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from './ui/field.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';

const NONE = '__none__';
const NEW = '__new__';

/** A stored registry (or none), with changes to save to it, or a new one to add with the environment. */
export type ImageSource =
  | { readonly registryId: string | null; readonly edit?: RegistryDraft }
  | { readonly draft: RegistryDraft };

export function ImageSourceFields({
  registries,
  value,
  onChange,
}: {
  readonly registries: readonly RegistryRecord[];
  readonly value: ImageSource;
  readonly onChange: (value: ImageSource) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const check = useRegistryCheck();
  const items = [
    { value: NONE, label: t('ui.environments.noRegistry') },
    ...registries.map((registry) => ({
      value: registry.id,
      label: `${registry.name} (${registry.host}${registry.namespace ? `/${registry.namespace}` : ''})`,
    })),
    { value: NEW, label: t('ui.environments.newRegistry') },
  ];
  const selected = 'draft' in value ? NEW : (value.registryId ?? NONE);
  const stored =
    'draft' in value || !value.registryId
      ? undefined
      : registries.find((registry) => registry.id === value.registryId);
  const editing = 'draft' in value ? value.draft : value.edit;
  return (
    <FieldSet data-slot='image-source'>
      <FieldLegend>{t('ui.environments.imageSource')}</FieldLegend>
      <FieldDescription>
        {t('ui.environments.imageSourceDescription')}
      </FieldDescription>
      <FieldGroup className='gap-3'>
        <Field>
          <FieldLabel htmlFor='rel-env-registry'>
            {t('ui.environments.registry')}
          </FieldLabel>
          <Select
            items={items}
            value={selected}
            onValueChange={(next: string | null) => {
              check.reset();
              onChange(
                next === NEW
                  ? { draft: registryDraft() }
                  : { registryId: !next || next === NONE ? null : next },
              );
            }}
          >
            <SelectTrigger id='rel-env-registry' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              {items.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {stored && !('draft' in value) ? (
          <Button
            type='button'
            size='sm'
            variant='link'
            className='self-start px-0'
            onClick={() => {
              check.reset();
              onChange(
                value.edit
                  ? { registryId: stored.id }
                  : { registryId: stored.id, edit: registryDraft(stored) },
              );
            }}
          >
            {value.edit
              ? t('ui.environments.cancelRegistryEdit')
              : t('ui.environments.editRegistry')}
          </Button>
        ) : null}
        {editing ? (
          <div
            className='flex flex-col gap-4 rounded-lg border p-4'
            data-slot={'draft' in value ? 'new-registry' : 'edit-registry'}
          >
            {stored ? (
              <FieldDescription>
                {t('ui.environments.registryShared')}
              </FieldDescription>
            ) : null}
            <RegistryFields
              idPrefix='rel-env-registry'
              draft={editing}
              registry={stored}
              onChange={(draft) => {
                check.reset();
                onChange(
                  'draft' in value
                    ? { draft }
                    : { registryId: value.registryId, edit: draft },
                );
              }}
            />
            <div>
              <RegistryCheckButton
                checking={check.checking}
                disabled={!editing.url.trim()}
                onClick={() =>
                  void check.run(
                    registryInput(editing, stored?.name ?? ''),
                    stored?.id,
                  )
                }
              />
            </div>
            {check.outcome ? (
              <RegistryCheckOutcome result={check.outcome} />
            ) : null}
          </div>
        ) : null}
      </FieldGroup>
    </FieldSet>
  );
}
