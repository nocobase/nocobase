/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo, useState } from 'react';
import { Button, CheckList, Popup, SearchBar } from 'antd-mobile';
import { connect, mapProps } from '@formily/react';
import { Select } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

const MobilePicker = connect(
  (props) => {
    const { value, onChange, options = [], mode } = props;
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(value || []); // 默认值为空数组
    const [searchText, setSearchText] = useState('');

    // 过滤选项
    const filteredItems = useMemo(() => {
      if (searchText) {
        return options.filter((item) => item.label.toLowerCase().includes(searchText.toLowerCase()));
      }
      return options;
    }, [options, searchText]);

    const handleConfirm = () => {
      onChange(selected);
      setVisible(false);
    };
    return (
      <>
        <Select
          onClick={() => setVisible(true)}
          placeholder={t('Select')}
          value={value}
          dropdownStyle={{ display: 'none' }}
          multiple={mode === 'multiple'}
        />
        <Popup visible={visible} onMaskClick={() => setVisible(false)} destroyOnClose>
          <div>
            <SearchBar placeholder={t('search')} value={searchText} onChange={(v) => setSearchText(v)} />
          </div>
          <div>
            <CheckList
              multiple={mode === 'multiple'}
              value={selected}
              onChange={(val) => {
                if (mode === 'multiple') {
                  setSelected(val);
                } else {
                  setSelected(val[0]);
                  onChange(val[0]);
                  setVisible(false);
                }
              }}
            >
              {filteredItems.map((item) => (
                <CheckList.Item key={item.value} value={item.value}>
                  {item.label}
                </CheckList.Item>
              ))}
            </CheckList>
          </div>
          {mode === 'multiple' && (
            <Button block color="primary" onClick={handleConfirm} style={{ marginTop: '16px' }}>
              {t('Confirm')}
            </Button>
          )}
        </Popup>
      </>
    );
  },
  mapProps({ dataSource: 'options' }),
);

export { MobilePicker };
