/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowModelContext } from '@nocobase/flow-engine';
import { Select } from 'antd';
import { Button, CheckList, Popup, SearchBar } from 'antd-mobile';
import React, { useEffect, useMemo, useState } from 'react';

export function MobileSelect(props) {
  const { value, onChange, disabled, options = [], mode } = props;
  const ctx = useFlowModelContext();
  const t = ctx.t;
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
    if (visible) {
      setSelected(value || []);
    } else {
      setSearchText(null);
    }
  }, [visible]);

  return (
    <>
      <div onClick={() => !disabled && setVisible(true)}>
        <Select {...props} dropdownStyle={{ display: 'none' }} showSearch={false} />
      </div>
      <Popup
        visible={visible}
        onMaskClick={() => {
          setVisible(false);
          if (!value || value?.length === 0) {
            setSelected([]);
          }
        }}
        destroyOnClose
      >
        <div style={{ margin: '10px' }}>
          <SearchBar placeholder={t('search')} value={searchText} onChange={(v) => setSearchText(v)} showCancelButton />
        </div>
        <div
          style={{
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
        >
          <CheckList
            multiple={['multiple', 'tags'].includes(mode)}
            value={Array.isArray(selected) ? selected : [selected]}
            onChange={(val) => {
              if (['multiple', 'tags'].includes(mode)) {
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
        {['multiple', 'tags'].includes(mode) && (
          <Button block color="primary" onClick={handleConfirm} style={{ marginTop: '16px' }}>
            {t('Confirm')}
          </Button>
        )}
      </Popup>
    </>
  );
}
