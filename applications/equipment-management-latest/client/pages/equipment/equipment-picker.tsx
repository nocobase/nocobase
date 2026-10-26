import { useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import {
  Combobox,
  ComboboxTrigger,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from '#components/ui/combobox';
import { useEquipment, type Row, type AssetView } from './api.js';
import { LoadState } from './shared.js';
/** Server search, rather than a capped client catalog. The selected record is fetched under the same policy. */
export function EquipmentPicker({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const result = useEquipment<Row[]>(
    'assets?pageSize=20&q=' + encodeURIComponent(search),
  );
  const selected = useEquipment<AssetView>(
    value ? 'assets/' + encodeURIComponent(value) : null,
  );
  const records = result.data?.data || [];
  const record = selected.data?.data.record;
  const items = [
    ...new Set([...records.map((r) => r.id), ...(record ? [record.id] : [])]),
  ];
  const label = (key: string) => {
    const asset =
      records.find((r) => r.id === key) ||
      (record?.id === key ? record : undefined);
    return asset
      ? String(asset.assetNumber) + ' · ' + asset.name
      : t('equipment.select');
  };
  return (
    <Combobox
      items={items}
      filter={null}
      value={value || null}
      disabled={disabled}
      itemToStringLabel={label}
      onValueChange={(v) => onChange(v || '')}
    >
      <ComboboxTrigger
        id={id}
        aria-label={t('equipment.fields.deviceId')}
        render={
          <Button
            variant='outline'
            className='w-full justify-between font-normal'
          />
        }
      >
        <span className='truncate'>
          {value ? label(value) : t('equipment.select')}
        </span>
      </ComboboxTrigger>
      <ComboboxContent>
        <ComboboxInput
          aria-label={t('equipment.search')}
          placeholder={t('equipment.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          showTrigger={false}
        />
        <LoadState
          loading={result.isPending}
          error={result.error}
          retry={() => void result.refetch()}
        />
        <ComboboxEmpty>{t('equipment.noResults')}</ComboboxEmpty>
        <ComboboxList>
          {(key: string) => (
            <ComboboxItem key={key} value={key}>
              <span className='whitespace-normal break-words'>
                {label(key)}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
