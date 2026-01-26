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
import { registerSmartBreak, lineBreakMatcher, handleEnter, handleLinebreak } from './registerSmartBreak';
import { registerFontSize } from './registerFontSize';
import { registerImageResize } from './registerImageResize';

const ReactQuill = lazy(async () => {
  const Quill = (await import('quill')).default;

  registerFontSize(Quill);
  registerSmartBreak(Quill);
  registerImageResize(Quill);

  return import('react-quill');
});

export const RichTextField = (props) => {
  const richTextClass = useRichTextStyles();
  const boundsClass = React.useMemo(() => `quill-bounds-${Math.random().toString(36).slice(2, 9)}`, []);
  const modules = {
    toolbar: [
      [
        { header: [1, 2, 3, false] },
        {
          size: [false, '12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px'],
        },
      ],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }, 'link'],
      ['clean', 'image'],
    ],
    // Ignore the registration of imageResize in the test environment to avoid errors
    ...(process.env.NODE_ENV !== 'test' && {
      imageResize: {
        modules: ['Resize', 'DisplaySize'],
      },
    }),
    clipboard: {
      matchers: [['BR', lineBreakMatcher]],
      matchVisual: false,
    },
    keyboard: {
      bindings: {
        handleEnter: {
          key: 13,
          handler: handleEnter,
        },
        handleLinebreak: {
          key: 13,
          shiftKey: true,
          handler: handleLinebreak,
        },
      },
    },
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
    'width',
    'height',
    'break',
  ];
  const { value, onChange, disabled, modules: propsModules, formats: propsFormats } = props;

  return (
    <ReactQuill
      className={`${richTextClass} ${boundsClass}`}
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
      bounds={`.${boundsClass}`}
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
