import { observer, useField, useFieldSchema } from '@formily/react';
import { Button, Input as AntdInput, Space } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDesignable } from '../../hooks/useDesignable';
import { MarkdownVoidDesigner } from './Markdown.Void.Designer';
import { markdown } from './util';

const MarkdownEditor = (props: any) => {
  const { t } = useTranslation();
  const [value, setValue] = useState(props.defaultValue);
  return (
    <div className={'mb-markdown'} style={{ position: 'relative' }}>
      <AntdInput.TextArea
        autoSize={{ minRows: 3 }}
        {...props}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
      <Space style={{ position: 'absolute', bottom: 5, right: 5 }}>
        <Button
          onClick={(e) => {
            props.onCancel?.(e);
          }}
        >
          {t('Cancel')}
        </Button>
        <Button
          type={'primary'}
          onClick={() => {
            props.onSubmit?.(value);
          }}
        >
          {t('Save')}
        </Button>
      </Space>
    </div>
  );
};

export const MarkdownVoid: any = observer((props: any) => {
  const { content } = props;
  const field = useField();
  const schema = useFieldSchema();
  const { dn } = useDesignable();
  const { onSave, onCancel } = props;
  return field?.editable ? (
    <MarkdownEditor
      {...props}
      defaultValue={content}
      onCancel={() => {
        field.editable = false;
        onCancel?.();
      }}
      onSubmit={async (value) => {
        field.editable = false;
        schema['x-component-props'] ?? (schema['x-component-props'] = {});
        schema['x-component-props']['content'] = value;
        field.componentProps.content = value;
        onSave?.(schema);
        dn.emit('patch', {
          schema: {
            'x-uid': schema['x-uid'],
            'x-component-props': {
              content: value,
            },
          },
        });
      }}
    />
  ) : (
    <div className={'nb-markdown'} dangerouslySetInnerHTML={{ __html: markdown(content) }} />
  );
});

MarkdownVoid.Designer = MarkdownVoidDesigner;
