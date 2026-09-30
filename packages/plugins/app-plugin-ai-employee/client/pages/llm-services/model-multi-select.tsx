import type { ReactElement } from 'react';
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
  useComboboxAnchor,
} from '../../components/ui/combobox.js';
import type { EnabledModel } from '../../llm-service-service.js';
import { useT } from '../../locales/index.js';

export interface ModelMultiSelectProps {
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly models: EnabledModel[];
  readonly value: EnabledModel[];
  readonly onChange: (value: EnabledModel[]) => void;
  readonly onSearch: (value: string) => void;
}

export function ModelMultiSelect({
  disabled,
  loading,
  models,
  value,
  onChange,
  onSearch,
}: ModelMultiSelectProps): ReactElement {
  const t = useT();
  const anchor = useComboboxAnchor();
  return (
    <Combobox
      multiple
      disabled={disabled}
      items={models}
      value={value}
      onValueChange={onChange}
      onInputValueChange={onSearch}
      isItemEqualToValue={(item, selected) => item.value === selected.value}
      filter={(item, query) =>
        `${item.label} ${item.value}`
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase())
      }
    >
      <ComboboxChips ref={anchor}>
        <ComboboxValue>
          {(selected: EnabledModel[]) => (
            <>
              {selected.map((model) => (
                <ComboboxChip
                  key={model.value}
                  aria-label={model.label}
                  removeLabel={`${t('Remove')} ${model.label}`}
                >
                  <span className='max-w-48 truncate' title={model.value}>
                    {model.label}
                  </span>
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                aria-label={t('Search provider models')}
                placeholder={
                  selected.length
                    ? t('Search models')
                    : t('Select models to enable')
                }
              />
            </>
          )}
        </ComboboxValue>
        <ComboboxTrigger aria-label={t('Select models')} />
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        {loading ? (
          <p role='status' className='px-3 py-2 text-sm text-muted-foreground'>
            {t('Loading…')}
          </p>
        ) : (
          <ComboboxEmpty>{t('No models')}</ComboboxEmpty>
        )}
        <ComboboxList aria-label={t('Select models')}>
          {(model: EnabledModel) => (
            <ComboboxItem key={model.value} value={model}>
              <span className='min-w-0 truncate' title={model.value}>
                {model.label}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
