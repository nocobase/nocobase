import { css } from '@nocobase/client';
import { useDebounceFn } from 'ahooks';
import { message, Select } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useMapTranslation } from '../../locale';

interface SearchProps {
  aMap: any;
  toCenter: (p: any) => void;
}

export const Search = (props: SearchProps) => {
  const { aMap, toCenter } = props;
  const { t } = useMapTranslation();
  const placeSearch = useRef<any>();
  const [options, setOptions] = useState([]);

  useEffect(() => {
    aMap?.plugin('AMap.PlaceSearch', () => {
      placeSearch.current = new aMap.PlaceSearch({
        city: '全国',
        pageSize: 30,
      });
    });
  }, [aMap]);

  const { run: onSearch } = useDebounceFn(
    (keyword) => {
      if (!placeSearch.current) {
        return;
      }
      placeSearch.current.search(keyword || ' ', (status, result) => {
        if (status === 'complete') {
          setOptions(
            result.poiList.pois.map((item) => {
              return {
                ...item,
                label: `${item.name}-${item.address}`,
                value: item.id,
              };
            }),
          );
        } else {
          if (status === 'no_data') {
            setOptions([]);
            return;
          }
          message.error(t('Please configure the AMap securityCode or securityHost correctly'));
        }
      });
    },
    {
      wait: 300,
    },
  );

  const onSelect = (value) => {
    const place = options.find((o) => {
      return o.value === value;
    });

    if (place?.location) {
      toCenter(place.location);
    }
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
        style={{
          background: 'rgba(255, 255, 255, 0.8)',
        }}
        placeholder={t('Enter keywords to search')}
        filterOption={false}
        onSearch={onSearch}
        onSelect={onSelect}
        options={options}
        popupMatchSelectWidth={false}
      ></Select>
    </div>
  );
};
