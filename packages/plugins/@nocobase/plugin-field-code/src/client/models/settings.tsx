/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Button, Divider, Input, InputNumber, Space } from 'antd';
import React, { useState } from 'react';
import { NAMESPACE } from '../../common/constants';

export const HEIGHT_VALUES = ['auto', '100px', '200px', '300px', '400px', '500px'];

export const INDENT_UNIT_OPTIONS = [2, 4, 6, 8].map((value) => ({
  label: value,
  value,
}));

export const normalizeHeight = (value?: string) => {
  return value?.trim() || 'auto';
};

export const normalizeIndentUnit = (value?: number) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) && nextValue > 0 ? Math.trunc(nextValue) : 2;
};

const getPluginT = (ctx) => {
  return (key: string, options = {}) => ctx.t(key, { ...options, ns: NAMESPACE });
};

export const getHeightOptions = (ctx) => {
  const t = getPluginT(ctx);

  return HEIGHT_VALUES.map((value) => ({
    label: value === 'auto' ? t('Auto') : value,
    value,
  }));
};

export const CustomHeight = ({ defaultValue, handleChange, setOpen, t }) => {
  const [height, setHeight] = useState(defaultValue);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
      onMouseLeave={() => {
        setOpen(true);
      }}
    >
      <Space.Compact block>
        <Input
          placeholder={t('e.g. 300px or 50%')}
          value={height}
          onChange={(event) => setHeight(event.target.value)}
          style={{ width: '100%', minWidth: 200 }}
        />
        <Button type="primary" onClick={() => handleChange(normalizeHeight(height))}>
          OK
        </Button>
      </Space.Compact>
    </div>
  );
};

export const CustomIndentUnit = ({ defaultValue, handleChange, setOpen, t }) => {
  const [indentUnit, setIndentUnit] = useState(defaultValue);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
      onMouseLeave={() => {
        setOpen(true);
      }}
    >
      <Space.Compact block>
        <InputNumber
          placeholder={t('Custom indent unit')}
          value={indentUnit}
          min={1}
          precision={0}
          onChange={(value) => setIndentUnit(value)}
          style={{ width: '100%', minWidth: 200 }}
        />
        <Button type="primary" onClick={() => handleChange(normalizeIndentUnit(indentUnit))}>
          OK
        </Button>
      </Space.Compact>
    </div>
  );
};

export const renderHeightDropdown = (ctx, menu, setOpen, handleChange, currentHeight?: string) => {
  const normalizedHeight = normalizeHeight(currentHeight);
  const t = getPluginT(ctx);
  return (
    <>
      {menu}
      <Divider style={{ margin: '4px 0' }} />
      <CustomHeight
        setOpen={setOpen}
        handleChange={handleChange}
        t={t}
        defaultValue={HEIGHT_VALUES.includes(normalizedHeight) ? null : normalizedHeight}
      />
    </>
  );
};

export const renderIndentDropdown = (ctx, menu, setOpen, handleChange, currentIndentUnit?: number) => {
  const normalizedIndentUnit = normalizeIndentUnit(currentIndentUnit);
  const t = getPluginT(ctx);
  return (
    <>
      {menu}
      <Divider style={{ margin: '4px 0' }} />
      <CustomIndentUnit
        setOpen={setOpen}
        handleChange={handleChange}
        t={t}
        defaultValue={
          INDENT_UNIT_OPTIONS.some((option) => option.value === normalizedIndentUnit) ? null : normalizedIndentUnit
        }
      />
    </>
  );
};
