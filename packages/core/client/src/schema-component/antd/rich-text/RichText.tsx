/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { connect, mapProps, mapReadPretty } from '@formily/react';
import React from 'react';
import { css } from '@emotion/css';
import classNames from 'classnames';
import { lazy } from '../../../lazy-helper';
import { isVariable } from '../../../variables/utils/isVariable';
import { ReadPretty as InputReadPretty } from '../input';
import { useStyles } from './style';

const ReactQuill = lazy(() => import('react-quill'));

export const RichText = connect(
  (props) => {
    const { wrapSSR, hashId, componentCls } = useStyles();
    const boundsClass = React.useMemo(() => `quill-bounds-${Math.random().toString(36).slice(2, 9)}`, []);
    const modules = {
      toolbar: [['bold', 'italic', 'underline', 'link'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']],
    };
    const formats = [
      'header',
      'bold',
      'italic',
      'underline',
      'strike',
      'blockquote',
      'list',
      'bullet',
      'indent',
      'link',
      'image',
    ];
    const { value, defaultValue, onChange, disabled, modules: propsModules, formats: propsFormats } = props;
    const resultValue = isVariable(value || defaultValue) ? undefined : value || '';
    const quillDisabled = css`
      .ql-container.ql-disabled {
        background-color: #f5f5f5; /* 灰色背景 */
        color: #999;
        opacity: 0.7;
        cursor: not-allowed;
        pointer-events: none;
        border: 1px solid #d9d9d9; /* 模拟 input 的禁用边框 */
        border-radius: 6px;
      }
    `;

    return wrapSSR(
      <ReactQuill
        className={classNames(componentCls, hashId, quillDisabled, boundsClass, {
          'is-disabled': disabled,
        })}
        modules={propsModules || modules}
        formats={propsFormats || formats}
        value={resultValue}
        onChange={(value) => {
          if (value === '<p><br></p>') {
            onChange('');
          } else {
            onChange(value);
          }
        }}
        readOnly={disabled}
        bounds={`.${boundsClass}`}
      />,
    );
  },
  mapProps({
    initialValue: 'defaultValue',
  }),
  mapReadPretty((props) => {
    return <InputReadPretty.Html {...props} />;
  }),
);
