/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tag } from 'antd';
import { CloseCircleFilled } from '@ant-design/icons';
import { cx } from '@emotion/css';
import type { VariableTagProps } from './types';
import { variableContainerStyle, variableTagContainerStyle } from './styles/variableInput.styles';
import { parseValueToPath, buildFullTagTitle } from './utils';

export const VariableTag: React.FC<VariableTagProps> = ({ value, onClear, className, style, contextSelectorItem }) => {
  const displayedValue = React.useMemo(() => {
    if (contextSelectorItem) {
      return buildFullTagTitle(contextSelectorItem);
    }
    if (!value) return String(value);
    const path = parseValueToPath(value);
    return path ? path.join('/') : String(value);
  }, [value, contextSelectorItem]);

  return (
    <div className={cx('variable', variableContainerStyle(!onClear), className)} style={style}>
      <div
        role="button"
        aria-label="variable-tag"
        style={variableTagContainerStyle(!onClear)}
        className={cx('variable-input-container', { 'ant-input-disabled': !onClear })}
      >
        <Tag
          color="blue"
          style={{
            display: 'inline-block',
            lineHeight: '19px',
            margin: '4px 6px',
            padding: '2px 7px',
            borderRadius: '10px',
            width: 'fit-content',
            minWidth: 'unset',
            maxWidth: 'none',
            flex: 'none',
            overflow: 'visible',
            textOverflow: 'clip',
            whiteSpace: 'nowrap',
            boxSizing: 'content-box',
          }}
        >
          {displayedValue}
        </Tag>
      </div>
      {onClear && (
        <span
          role="button"
          aria-label="close"
          className="clear-button"
          style={{ userSelect: 'none' }}
          onClick={onClear}
        >
          <CloseCircleFilled />
        </span>
      )}
    </div>
  );
};
