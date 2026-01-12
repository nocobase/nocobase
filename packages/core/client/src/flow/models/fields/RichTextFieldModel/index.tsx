/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { largeField, EditableItemModel } from '@nocobase/flow-engine';
import { lazy } from '../../../../lazy-helper';
import { useRichTextStyles } from './style';
import { FieldModel } from '../../base';

const ReactQuill = lazy(async () => {
  const Quill = (await import('quill')).default;

  const Size = Quill.import('formats/size');
  Size.whitelist = ['12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px'];
  Quill.register(Size, true);

  return import('react-quill');
});

export const RichTextField = (props) => {
  const richTextClass = useRichTextStyles();
  const modules = {
    toolbar: [
      [
        { header: [1, 2, 3, false] },
        {
          size: ['12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px'],
        },
      ],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }, 'link'],
      ['clean', 'image'],
    ],
  };
  const formats = [
    'header',
    'size',
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

@largeField()
export class RichTextFieldModel extends FieldModel {
  render() {
    return <RichTextField {...this.props} />;
  }
}

EditableItemModel.bindModelToInterface('RichTextFieldModel', ['richText'], {
  isDefault: true,
});
