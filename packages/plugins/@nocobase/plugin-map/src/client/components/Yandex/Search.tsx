import React, { useState } from 'react';
import { Select } from 'antd';
import { useDebounceFn } from 'ahooks';
import { css } from '@nocobase/client';
import { useMapTranslation } from '../../locale';

interface SearchProps {
  map: any;
  toCenter: (p: number[]) => void;
}

export const Search = ({ map, toCenter }: SearchProps) => {
  const { t } = useMapTranslation();
  const [options, setOptions] = useState<any[]>([]);

  const { run: onSearch } = useDebounceFn((keyword) => {
    if (!(window as any).ymaps || !keyword) return;
    (window as any).ymaps.geocode(keyword).then((res) => {
      const results = res.geoObjects.toArray();
      setOptions(
        results.map((item: any) => ({
          label: item.getAddressLine(),
          value: item.getAddressLine(),
          position: item.geometry.getCoordinates(),
        }))
      );
    });
  }, { wait: 300 });

  const onSelect = (value: string) => {
    const place = options.find((o) => o.value === value);
    place && toCenter(place.position);
  };

  return (
    <div
      className={css`
        position: absolute;
        top: 10px;
        left: 10px;
        z-index: 10;
        width: calc(100% - 20px);
      `}
    >
      <Select
        showSearch
        allowClear
        placeholder={t('Enter keywords to search')}
        filterOption={false}
        onSearch={onSearch}
        onSelect={onSelect}
        options={options}
      />
    </div>
  );
};
