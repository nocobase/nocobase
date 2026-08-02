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

const mobileSelectSafeAreaPaddingBottom = 'calc(12px + env(safe-area-inset-bottom, 0px))';

const mobileSelectConfirmFooterStyle: React.CSSProperties = {
  paddingBottom: mobileSelectSafeAreaPaddingBottom,
};

function getMobileSelectListStyle(hasConfirmFooter: boolean): React.CSSProperties {
  return {
    maxHeight: '60vh',
    overflowY: 'auto',
    paddingBottom: hasConfirmFooter ? undefined : mobileSelectSafeAreaPaddingBottom,
  };
}

export function MobileSelect(props) {
  const { value, displayValue, onChange, onChangeComplete, disabled, options = [], mode } = props;
  const isMultiple = ['multiple', 'tags'].includes(mode);
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
    onChangeComplete?.();
    setVisible(false);
  };
  useEffect(() => {
    if (visible) {
      setSelected(value || []);
    } else {
      setSearchText(null);
    }
  }, [visible, value]);

  return (
    <>
      <div onClick={() => !disabled && setVisible(true)}>
        <Select
          {...props}
          value={displayValue ?? value}
          open={false}
          dropdownStyle={{ display: 'none' }}
          showSearch={false}
          style={{ pointerEvents: 'none', width: '100%' }}
        />
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
        <div style={getMobileSelectListStyle(isMultiple)}>
          <CheckList
            multiple={isMultiple}
            value={Array.isArray(selected) ? selected : [selected]}
            onChange={(val) => {
              if (isMultiple) {
                setSelected(val);
              } else {
                setSelected(val[0]);
                onChange(val[0]);
                onChangeComplete?.();
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
        {isMultiple && (
          <div style={mobileSelectConfirmFooterStyle}>
            <Button block color="primary" onClick={handleConfirm} style={{ marginTop: '16px' }}>
              {t('Confirm')}
            </Button>
          </div>
        )}
      </Popup>
    </>
  );
}
