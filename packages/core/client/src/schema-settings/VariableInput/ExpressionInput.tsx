/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Variable } from '../../schema-component';

interface ExpressionComponentProps {
  value: any;
  onChange: (value: any) => void;
  scope: any;
  style?: React.CSSProperties;
}

export const ExpressionInput: React.FC<ExpressionComponentProps> = ({
  value,
  onChange,
  scope,
  style,
}) => {
  const { t } = useTranslation();

  const defaultStyle = useMemo(() => {
    return {
      minWidth: 150,
      maxWidth: 430,
      fontSize: 13,
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    };
  }, [style]);

  const textAreaStyle = useMemo(() => {
    return { minWidth: 390, borderRadius: 0 };
  }, []);

  return (
    <div
      role="button"
      aria-label="dynamic-component-linkage-rules"
      style={defaultStyle}
      className={css`
        .x-button {
          height: auto !important;
        }
      `}
    >
      <Variable.TextArea
        value={value}
        onChange={onChange}
        scope={scope}
        style={textAreaStyle}
      />
      <div>
        <span style={{ marginLeft: '.25em' }} className={'ant-formily-item-extra'}>
          {t('Syntax references')}:
        </span>
        <a href="https://docs.nocobase.com/handbook/calculation-engines/formula" target="_blank" rel="noreferrer">
          Formula.js
        </a>
      </div>
    </div>
  );
};
