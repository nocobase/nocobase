/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Button, CheckList, Popup, SearchBar } from 'antd-mobile';
import { connect, mapProps } from '@formily/react';
import { Select } from '@nocobase/client';
import { useTranslation } from 'react-i18next';

const MobilePicker = connect(
  (props) => {
    const { value, onChange, options = [], mode } = props;
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [selected, setSelected] = useState(value || []);
    const [searchText, setSearchText] = useState(null);

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
    useEffect(() => {
      !visible && setSearchText(null);
    }, [visible]);

    return (
      <>
        <Select
          onClick={() => setVisible(true)}
          placeholder={t('Select')}
          value={value}
          dropdownStyle={{ display: 'none' }}
          multiple={mode === 'multiple'}
          onClear={() => {
            setVisible(false);
            onChange(null);
            setSelected(null);
          }}
          onFocus={(e) => e.preventDefault()} // 禁用输入法
        />
        <Popup visible={visible} onMaskClick={() => setVisible(false)} destroyOnClose>
          <div>
            <SearchBar placeholder={t('search')} value={searchText} onChange={(v) => setSearchText(v)} />
          </div>
          <div
            style={{
              maxHeight: '70vh', // 设置最大高度为屏幕的 70%
              overflowY: 'auto', // 启用垂直滚动
            }}
          >
            <CheckList
              multiple={mode === 'multiple'}
              value={selected || ''}
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
