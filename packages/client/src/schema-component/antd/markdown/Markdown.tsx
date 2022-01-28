import { LoadingOutlined } from '@ant-design/icons';
import { connect, mapProps, mapReadPretty, observer, useField, useFieldSchema } from '@formily/react';
import { Button, Input as AntdInput, Space } from 'antd';
import { marked } from 'marked';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ReadPretty as InputReadPretty } from '../input';

export function markdown(text) {
  if (!text) {
    return '';
  }
  return marked.parse(text);
}

export const Markdown: any = connect(
  AntdInput.TextArea,
  mapProps((props: any, field) => {
    return {
      ...props,
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
    };
  }),
  mapReadPretty((props) => {
    let text = props.value;
    let value = <div className={'nb-markdown'} dangerouslySetInnerHTML={{ __html: markdown(text) }} />;
    return <InputReadPretty.TextArea {...props} text={text} value={value} />;
  }),
);

function MarkdownTextArea(props: any) {
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
            props.onCancel && props.onCancel(e);
          }}
        >
          {t('Cancel')}
        </Button>
        <Button
          type={'primary'}
          onClick={() => {
            props.onSubmit && props.onSubmit(value);
          }}
        >
          {t('Save')}
        </Button>
      </Space>
    </div>
  );
}

Markdown.Void = observer((props: any) => {
  const schema = useFieldSchema();
  const field = useField<any>();
  const text = schema['x-component-props']?.['content'] ?? schema['default'];
  let value = <div className={'nb-markdown'} dangerouslySetInnerHTML={{ __html: markdown(text) }} />;
  const { onSave, onCancel } = props;
  return field?.pattern !== 'readPretty' ? (
    <MarkdownTextArea
      {...props}
      defaultValue={text}
      onCancel={() => {
        field.readPretty = true;
        onCancel?.();
      }}
      onSubmit={async (value) => {
        field.readPretty = true;
        schema['x-component-props'] ?? (schema['x-component-props'] = {});
        schema['x-component-props']['content'] = value;
        onSave?.(schema);
      }}
    />
  ) : (
    <InputReadPretty.TextArea {...props} text={text} value={value} />
  );
});

export default Markdown;
