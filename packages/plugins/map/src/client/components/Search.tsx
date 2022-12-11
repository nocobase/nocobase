import { Select } from 'antd';
import { css } from '@emotion/css';
import React, { useEffect, useRef, useState } from 'react';
import { useDebounceFn } from 'ahooks';
import { useMapTranslation } from '../locales';

interface SearchProps {
  aMap: any;
  toCenter: (p: any) => void;
}
const Search = (props: SearchProps) => {
  const { aMap, toCenter } = props;
  const { t } = useMapTranslation();
  const autocomplete = useRef<any>();
  const [options, setOptions] = useState([]);

  useEffect(() => {
    aMap?.plugin('AMap.AutoComplete', (...args) => {
      autocomplete.current = new aMap.AutoComplete({
        city: '全国',
      });
    });
  }, [aMap]);

  const { run: onSearch } = useDebounceFn(
    (keyword) => {
      if (!autocomplete.current) {
        return;
      }
      autocomplete.current.search(keyword || ' ', (status, result) => {
        if (status === 'complete') {
          setOptions(
            result.tips.map((item) => {
              return {
                ...item,
                label: `${item.district}-${item.name}`,
                value: item.id,
              };
            }),
          );
        } else {
          setOptions([]);
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
        width: 400px;
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
      ></Select>
    </div>
  );
};

export default Search;
