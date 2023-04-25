import { Divider, Input } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '../collection-manager';

export const SelectCollection = ({ value, onChange, setSelected }) => {
  const { t } = useTranslation();
  const { collections } = useCollectionManager();

  return (
    <div style={{ width: 210 }}>
      <Input
        allowClear
        style={{ padding: '0 4px 6px' }}
        bordered={false}
        placeholder={t('Search and select collection')}
        value={value}
        onChange={(e) => {
          const names = collections
            .filter((collection) => {
              if (!collection.title) {
                return;
              }
              return collection.title.toUpperCase().includes(e.target.value.toUpperCase());
            })
            .map((item) => item.name);
          setSelected(names);
          onChange(e.target.value);
        }}
      />
      <Divider style={{ margin: 0 }} />
    </div>
  );
};
