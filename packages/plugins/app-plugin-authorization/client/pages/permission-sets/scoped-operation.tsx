import { CustomFilterEditor } from '../../components/filter-editor.js';
import { emptyFilter } from '../../components/filter-ast.js';
import { useId, type RefObject, type ReactElement } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import type {
  DataScopeOption,
  ResourceOption,
  SelectOption,
} from '../../authorization-client.js';
import { scopeKey, scopeValue, withScopeValue } from './composite-policy.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.js';
import { SelectionMark } from '../../components/selection-marks.js';
import { useAuthorizationTranslation } from '../../i18n.js';
import type { GrantDraft } from './types.js';

export function ScopedOperation({
  container,
  item,
  action,
  config,
  grant,
  disabled,
  onToggle,
  onChange,
}: {
  container: RefObject<HTMLDivElement | null>;
  item: ResourceOption;
  action: SelectOption;
  config: readonly DataScopeOption[];
  grant: GrantDraft;
  disabled: boolean;
  onToggle: (grant: GrantDraft, action: string, mode: string) => void;
  onChange: (grant: GrantDraft) => void;
}): ReactElement {
  const t = useAuthorizationTranslation();
  const choiceId = useId();
  const granted = grant.actions.includes(action.value);
  const policy = grant.policies?.[action.value];
  const unrestricted = config.every(
    (field) =>
      scopeKey(scopeValue(policy, field.key), field.defaultValue) ===
      'allRecords',
  );
  return (
    <Dialog.Root modal={false}>
      <Dialog.Trigger
        className='inline-flex items-center gap-1 rounded-md py-1 pl-1 pr-2 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring'
        aria-label={`${item.label}: ${action.label}`}
      >
        <SelectionMark
          value={!granted ? 'none' : unrestricted ? 'all' : 'scoped'}
        />
        <span>{action.label}</span>
      </Dialog.Trigger>
      <Dialog.Portal container={container}>
        <Dialog.Popup className='absolute inset-y-0 right-0 z-30 flex w-full max-w-md flex-col overflow-hidden border-l bg-popover shadow-xl'>
          <header className='flex items-center justify-between border-b p-3'>
            <Dialog.Title className='text-sm font-semibold'>
              {item.label} · {action.label}
            </Dialog.Title>
            <Dialog.Close
              aria-label={t('permissionWorkspace.backResources')}
              className='rounded-md p-1 hover:bg-muted'
            >
              <X className='size-4' />
            </Dialog.Close>
          </header>
          <div className='min-h-0 flex-1 space-y-4 overflow-auto p-4'>
            <fieldset className='space-y-3'>
              <legend className='sr-only'>
                {item.label} · {action.label}
              </legend>
              <div className='flex flex-wrap gap-6 text-sm'>
                {[false, true].map((enabled) => (
                  <label
                    key={String(enabled)}
                    className='flex cursor-pointer items-center gap-2'
                  >
                    <input
                      type='radio'
                      name={choiceId}
                      checked={granted === enabled}
                      disabled={disabled}
                      className='size-4 accent-primary'
                      onChange={() =>
                        onToggle(grant, action.value, enabled ? 'all' : 'none')
                      }
                    />
                    {t(
                      enabled
                        ? 'permissionWorkspace.configurePermission'
                        : 'permissionWorkspace.moduleNotGranted',
                    )}
                  </label>
                ))}
              </div>
              {!granted && (
                <p className='rounded-md bg-muted/30 px-3 py-3 text-sm leading-6 text-muted-foreground'>
                  {t('permissionWorkspace.noOperationGrant')}
                </p>
              )}
            </fieldset>
            {granted &&
              config.map((field) => {
                const selected = scopeKey(
                  scopeValue(policy, field.key),
                  field.defaultValue,
                );
                const enabled = selected !== '';
                const choices = field.options.filter(
                  (option) => option.value !== '',
                );
                const initial =
                  choices.find(
                    (option) => option.value === field.defaultValue,
                  ) ??
                  choices.find((option) => option.value !== 'allRecords') ??
                  choices[0];
                const change = (value: string) =>
                  onChange({
                    ...grant,
                    policies: {
                      ...grant.policies,
                      [action.value]: withScopeValue(
                        policy,
                        field.key,
                        value === 'customFilter'
                          ? {
                              type: 'recordAccess',
                              key: value,
                              params: { filter: emptyFilter() },
                            }
                          : value,
                      ),
                    },
                  });
                return (
                  <section key={field.key} className='space-y-2 text-sm'>
                    {
                      <label className='flex cursor-pointer items-center gap-2'>
                        <input
                          type='checkbox'
                          className='size-4 accent-primary'
                          checked={enabled}
                          disabled={disabled || !initial}
                          onChange={(event) =>
                            change(event.target.checked ? initial.value : '')
                          }
                        />
                        {t('permissionWorkspace.specifyScope', {
                          scope: field.label,
                        })}
                      </label>
                    }
                    {!enabled && (
                      <p className='pl-6 text-xs leading-5 text-muted-foreground'>
                        {t('permissionWorkspace.inheritScope')}
                      </p>
                    )}
                    {enabled && (
                      <div className='space-y-2 pl-6'>
                        <Select
                          disabled={disabled}
                          value={selected}
                          onValueChange={(value) => {
                            if (typeof value === 'string') change(value);
                          }}
                        >
                          <SelectTrigger
                            aria-label={field.label}
                            className='w-full'
                          >
                            <SelectValue>
                              {
                                field.options.find(
                                  (option) => option.value === selected,
                                )?.label
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                            {choices.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selected === 'customFilter' &&
                          field.collectionFields && (
                            <CustomFilterEditor
                              fields={field.collectionFields}
                              value={scopeValue(policy, field.key)}
                              onChange={(selection) =>
                                onChange({
                                  ...grant,
                                  policies: {
                                    ...grant.policies,
                                    [action.value]: withScopeValue(
                                      policy,
                                      field.key,
                                      selection,
                                    ),
                                  },
                                })
                              }
                            />
                          )}
                      </div>
                    )}
                  </section>
                );
              })}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
