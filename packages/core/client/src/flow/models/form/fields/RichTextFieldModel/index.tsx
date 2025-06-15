/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormItem } from '@formily/antd-v5';
import React from 'react';
import { FormFieldModel } from '../../../FormFieldModel';
import { lazy } from '../../../../../lazy-helper';
import { useRichTextStyles } from './style';

const ReactQuill = lazy(() => import('react-quill'));

const RichText = (props) => {
  const richTextClass = useRichTextStyles();
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
  const { value, onChange, disabled, modules: propsModules, formats: propsFormats } = props;
  return (
    <ReactQuill
      className={richTextClass}
      modules={propsModules || modules}
      formats={propsFormats || formats}
      value={value}
      onChange={(value) => {
        if (value === '<p><br></p>') {
          onChange('');
        } else {
          onChange(value);
        }
      }}
      readOnly={disabled}
    />
  );
};

export class RichTextFieldModel extends FormFieldModel {
  createField() {
    return this.form.createField({
      name: this.collectionField.name,
      ...this.props,
      decorator: [
        FormItem,
        {
          title: this.props.title,
        },
      ],
      component: [
        RichText,
        {
          ...this.props,
        },
      ],
    }) as any;
  }
}
