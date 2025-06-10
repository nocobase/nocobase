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
import { lazy } from '../../../lazy-helper';
import { isVariable } from '../../../variables/utils/isVariable';
import { Input, ReadPretty as InputReadPretty } from '../input';
import { useStyles } from './style';

const ReactQuill = lazy(() => import('react-quill'));

export const RichText = connect(
  (props) => {
    const { wrapSSR, hashId, componentCls } = useStyles();
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
    return wrapSSR(
      <ReactQuill
        className={`${componentCls} ${hashId}`}
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
