import { LoadingOutlined } from '@ant-design/icons';
import {
  connect,
  mapProps,
  mapReadPretty,
  ObjectField,
  FormProvider,
  Field,
  useField,
  useFieldSchema,
} from '@formily/react';
import { css } from '@emotion/css';
import { Input as AntdInput, Spin } from 'antd';
import React from 'react';
import { createForm } from '@formily/core';
import { Editable } from '@formily/antd';
import { ReadPretty as InputReadPretty } from '../input';
import { MarkdownVoid } from './Markdown.Void';
import { convertToText, useParseMarkdown } from './util';

import './style.less';

export const Markdown: any = connect(
  (props) => <InputMarkdown {...props} />,
  mapProps((props: any, field) => {
    return {
      autoSize: {
        maxRows: 10,
        minRows: 3,
      },
      ...props,
      suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
    };
  }),
  mapReadPretty((props) => {
    const { html, loading } = useParseMarkdown(props.value);
    const text = convertToText(html);
    const value = <div className={'nb-markdown'} dangerouslySetInnerHTML={{ __html: html }} />;
    if (loading) {
      return <Spin />;
    }
    return <InputReadPretty.TextArea {...props} autop={false} text={text} value={value} />;
  }),
);

const InputMarkdown = (props) => {
  const fieldSchema = useFieldSchema();
  const targetField: any = useField();
  const isDisplayInTable = fieldSchema.parent?.['x-component'] === 'TableV2.Column';
  const form = createForm();
  const FieldWithEditable = React.useMemo(() => {
    return (
      <div>
        <FormProvider form={form}>
          <ObjectField
            name={fieldSchema.name}
            reactions={(field) => {
              const value = field.value?.markDowm || props?.value;
              field.title = value;
              targetField.value = value;
            }}
            component={[
              Editable.Popover,
              {
                overlayClassName: css`
                  .ant-popover-title {
                    display: none;
                  }
                `,
              },
            ]}
          >
            <Field component={[AntdInput.TextArea, { ...props }]} name="markDowm" />
          </ObjectField>
        </FormProvider>
      </div>
    );
  }, []);

  return isDisplayInTable ? FieldWithEditable : <AntdInput.TextArea {...props} />;
};

Markdown.Void = MarkdownVoid;

export default Markdown;
