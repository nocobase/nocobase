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
import { sanitizeRichTextHtml } from '@nocobase/utils/client';
import { lazy } from '../../../../flow-compat';
import { useRichTextStyles } from './style';
import { FieldModel } from '../../base';
import { registerSmartBreak, lineBreakMatcher, handleEnter, handleLinebreak } from './registerSmartBreak';
import { registerFontSize } from './registerFontSize';
import { registerImageResize } from './registerImageResize';

const ReactQuill = lazy(async () => {
  const Quill = (await import('quill')).default;

  registerFontSize(Quill);
  registerSmartBreak(Quill);
  await registerImageResize(Quill);

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
  const previousIncomingValueRef = React.useRef(value);
  const pendingEditorValueRef = React.useRef<{ value: unknown }>();
  const [editorValue, setEditorValue] = React.useState<unknown>(() =>
    typeof value === 'string' ? sanitizeRichTextHtml(value) : value,
  );

  React.useEffect(() => {
    if (Object.is(value, previousIncomingValueRef.current)) {
      return;
    }
    previousIncomingValueRef.current = value;
    const pendingEditorValue = pendingEditorValueRef.current;
    pendingEditorValueRef.current = undefined;
    if (pendingEditorValue && Object.is(value, pendingEditorValue.value)) {
      return;
    }
    setEditorValue(typeof value === 'string' ? sanitizeRichTextHtml(value) : value);
  }, [value]);

  return (
    <ReactQuill
      className={`${richTextClass} ${boundsClass}`}
      modules={propsModules || modules}
      formats={propsFormats || formats}
      value={editorValue}
      onChange={(value) => {
        const nextValue = value === '<p><br></p>' ? '' : value;
        pendingEditorValueRef.current = { value: nextValue };
        setEditorValue(nextValue);
        onChange(nextValue);
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
