import { LoadingOutlined } from '@ant-design/icons';
import {
  connect,
  mapProps,
  mapReadPretty,
  useFieldSchema,
  ObjectField,
  FormProvider,
  Field,
  useField,
} from '@formily/react';
import { css } from '@emotion/css';
import { Editable } from '@formily/antd';
import { Input as AntdInput } from 'antd';
import { InputProps, TextAreaProps } from 'antd/lib/input';
import React from 'react';
import { createForm } from '@formily/core';
import { ReadPretty } from './ReadPretty';
import { Json, JSONTextAreaProps } from './Json';

type ComposedInput = React.FC<InputProps> & {
  TextArea: React.FC<any>;
  URL: React.FC<InputProps>;
  JSON: React.FC<JSONTextAreaProps>;
};

export const Input: ComposedInput = Object.assign(
  connect(
    AntdInput,
    mapProps((props, field) => {
      return {
        ...props,
        suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
      };
    }),
    mapReadPretty(ReadPretty.Input),
  ),
  {
    TextArea: connect(
      (props) => <InputTextArea {...props} />,
      mapProps((props, field) => {
        return {
          autoSize: {
            maxRows: 10,
            minRows: 3,
          },
          ...props,
        };
      }),
      mapReadPretty(ReadPretty.TextArea),
    ),
    URL: connect(AntdInput, mapReadPretty(ReadPretty.URL)),
    JSON: connect(Json, mapReadPretty(ReadPretty.JSON)),
  },
);

const InputTextArea = (props) => {
  const fieldSchema = useFieldSchema();
  const targetField:any = useField();
  const isDisplayInTable = fieldSchema.parent?.['x-component'] === 'TableV2.Column';
  const form = createForm();
  const FieldWithEditable = React.useMemo(() => {
    return (
      <div>
        <FormProvider form={form}>
          <ObjectField
            name={fieldSchema.name}
            reactions={(field) => {
              const value = field.value?.textArea || props?.value;
              field.title = value;
              targetField.value = value;
            }}
            component={[Editable.Popover,{
              overlayClassName: css`
                .ant-popover-title {
                  display: none;
                }
              `,
            }]}
          >
            <Field component={[AntdInput.TextArea]} {...props} name="textArea" />
          </ObjectField>
        </FormProvider>
      </div>
    );
  }, []);

  return isDisplayInTable ? FieldWithEditable : <AntdInput.TextArea {...props} />;
};
export default Input;
