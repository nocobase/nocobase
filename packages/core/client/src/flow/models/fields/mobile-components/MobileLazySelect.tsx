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
import type { CSSProperties } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, CheckList, Popup, SearchBar, SpinLoading } from 'antd-mobile';
import { css } from '@emotion/css';
import {
  LabelByField,
  resolveOptions,
  toSelectValue,
  type AssociationOption,
  type LazySelectProps,
  type PopupScrollEvent,
} from '../AssociationFieldModel/recordSelectShared';
import _ from 'lodash';

const labelClassName = css`
  div {
    white-space: nowrap !important;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

function buildDropdownStyle(source?: CSSProperties) {
  if (!source) {
    return { display: 'none' } as CSSProperties;
  }
  return { ...source, display: 'none' };
}

function getValueKey(fieldNames: LazySelectProps['fieldNames']) {
  return fieldNames?.value ?? 'value';
}

function deriveRecordsFromValue(
  value: LazySelectProps['value'],
  valueKey: string,
  optionMap: Map<any, AssociationOption>,
  isMultiple: boolean,
  valueMode: LazySelectProps['valueMode'] = 'record',
) {
  if (isMultiple) {
    if (Array.isArray(value)) {
      return (value.filter(Boolean) as any[]).map((item) => {
        if (valueMode === 'value') {
          return optionMap.get(item) ?? { [valueKey]: item };
        }
        const key = item?.[valueKey];
        return optionMap.get(key) ?? item;
      });
    }
    return [];
  }

  if (valueMode === 'value' && (typeof value === 'string' || typeof value === 'number')) {
    return [optionMap.get(value) ?? { [valueKey]: value }].filter(Boolean);
  }

  if (value && typeof value === 'object') {
    const key = (value as AssociationOption)[valueKey];
    const resolved = optionMap.get(key) ?? (value as AssociationOption);
    return resolved ? [resolved] : [];
  }

  return [];
}

export function MobileLazySelect(props: Readonly<LazySelectProps>) {
  const {
    fieldNames,
    value,
    multiple,
    allowMultiple,
    options,
    onChange,
    onDropdownVisibleChange,
    onPopupScroll,
    onSearch,
    disabled,
    dropdownStyle,
    loading = false,
    valueMode = 'record',
    ...restProps
  } = props;
  const ctx = useFlowModelContext();
  const t = ctx.t;
  const isMultiple = Boolean(multiple && allowMultiple);
  const valueKey = getValueKey(fieldNames);
  const realOptions = resolveOptions(options, value, isMultiple);
  const optionMap = useMemo(() => {
    const map = new Map<any, AssociationOption>();
    for (const item of realOptions) {
      map.set(item?.[valueKey], item);
    }
    return map;
  }, [realOptions, valueKey]);
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const derivedRecords = useMemo(
    () => deriveRecordsFromValue(value, valueKey, optionMap, isMultiple, valueMode),
    [value, valueKey, optionMap, isMultiple, valueMode],
  );

  const [selectedRecords, setSelectedRecords] = useState<AssociationOption[]>(() => derivedRecords);

  useEffect(() => {
    if (visible) {
      setSelectedRecords(derivedRecords);
    }
  }, [derivedRecords, visible]);

  useEffect(() => {
    if (!visible) {
      setSearchText('');
    }
  }, [visible]);

  const selectedValueIds = useMemo(() => {
    if (!selectedRecords.length) {
      return [] as (string | number)[];
    }
    const ids: Array<string | number> = [];
    for (const item of selectedRecords) {
      const identifier = item?.[valueKey];
      if (identifier !== undefined && identifier !== null) {
        ids.push(identifier as string | number);
      }
    }
    return ids;
  }, [selectedRecords, valueKey]);

  const handleOpen = useCallback(() => {
    if (disabled) {
      return;
    }
    setVisible(true);
    onDropdownVisibleChange?.(true);
  }, [disabled, onDropdownVisibleChange]);

  const handleClose = useCallback(() => {
    setVisible(false);
    onDropdownVisibleChange?.(false);
  }, [onDropdownVisibleChange]);

  const handleConfirm = useCallback(() => {
    if (valueMode === 'value') {
      if (isMultiple) {
        const values = selectedRecords
          .map((item) => item?.[valueKey])
          .filter((item) => item !== undefined && item !== null);
        onChange(values as any);
      } else {
        onChange(selectedRecords?.[0]?.[valueKey]);
      }
      handleClose();
      return;
    }
    onChange(selectedRecords);
    handleClose();
  }, [handleClose, isMultiple, onChange, selectedRecords, valueKey, valueMode]);

  const handleListChange = useCallback(
    (vals: (string | number)[]) => {
      if (isMultiple) {
        setSelectedRecords((prev) => {
          const prevMap = new Map<any, AssociationOption>();
          for (const item of prev) {
            prevMap.set(item?.[valueKey], item);
          }
          const result: AssociationOption[] = [];
          for (const id of vals) {
            const nextItem = optionMap.get(id) ?? prevMap.get(id);
            if (nextItem) {
              result.push(nextItem);
            }
          }
          return result;
        });
        return;
      }
      const selectedId = vals[0];
      const record = optionMap.get(selectedId);
      if (record) {
        if (valueMode === 'value') {
          onChange(record?.[valueKey]);
        } else {
          onChange(record);
        }
      }
      handleClose();
    },
    [handleClose, isMultiple, onChange, optionMap, valueKey, valueMode],
  );

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (!onPopupScroll) {
        return;
      }
      const target = event.currentTarget;
      if (target.scrollTop + target.clientHeight < target.scrollHeight - 20) {
        return;
      }
      onPopupScroll({ target } as unknown as PopupScrollEvent);
    },
    [onPopupScroll],
  );

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      onSearch?.(text);
    },
    [onSearch],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (disabled) {
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOpen();
      }
    },
    [disabled, handleOpen],
  );

  return (
    <>
      <Select
        {...restProps}
        dropdownStyle={buildDropdownStyle(dropdownStyle)}
        fieldNames={fieldNames}
        options={realOptions}
        value={toSelectValue(value, fieldNames, isMultiple, valueMode, realOptions)}
        mode={isMultiple ? 'multiple' : undefined}
        open={false}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        onChange={(nextValue, option) => {
          if (valueMode === 'value') {
            if (Array.isArray(option)) {
              onChange(
                option.map((item) => item?.[valueKey] ?? item?.value).filter((item) => item !== undefined) as any,
              );
              return;
            }
            onChange((option as AssociationOption)?.[valueKey] ?? (option as any)?.value);
            return;
          }
          onChange(option);
        }}
        loading={loading}
        optionRender={({ data }) => <LabelByField option={data} fieldNames={fieldNames} />}
        labelRender={(data) => <div className={labelClassName}>{data.label}</div>}
        showSearch={false}
      />
      <Popup visible={visible} onMaskClick={handleClose} destroyOnClose>
        <div style={{ margin: '10px' }}>
          <SearchBar
            placeholder={t('search')}
            value={searchText}
            onChange={handleSearchChange}
            onCancel={handleClose}
            showCancelButton
          />
        </div>
        <div
          style={{
            maxHeight: '60vh',
            overflowY: 'auto',
          }}
          onScroll={handleScroll}
        >
          <CheckList multiple={isMultiple} value={selectedValueIds} onChange={handleListChange}>
            {realOptions.map((item) => {
              const optionValue = item?.[valueKey];
              return (
                <CheckList.Item key={optionValue} value={optionValue}>
                  <LabelByField option={item} fieldNames={fieldNames} />
                </CheckList.Item>
              );
            })}
          </CheckList>
          {loading && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '12px 0',
              }}
            >
              <SpinLoading color="primary" />
            </div>
          )}
        </div>
        {isMultiple && (
          <Button block color="primary" onClick={handleConfirm} style={{ marginTop: '16px' }}>
            {t('Confirm')}
          </Button>
        )}
      </Popup>
    </>
  );
}
