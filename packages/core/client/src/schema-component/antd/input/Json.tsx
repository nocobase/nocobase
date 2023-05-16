import React, { Ref } from 'react';
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
import { Editable } from '@formily/antd';
import { Input } from 'antd';
import { css } from '@emotion/css';
import { createForm } from '@formily/core';
import { TextAreaProps } from 'antd/lib/input';

export type JSONTextAreaProps = TextAreaProps & { value?: string; space?: number };

export const Json = React.forwardRef<typeof Input.TextArea, JSONTextAreaProps>(
  ({ value, onChange, space = 2, ...props }: JSONTextAreaProps, ref: Ref<any>) => {
    const fieldSchema = useFieldSchema();
    const targetField: any = useField();
    const isDisplayInTable = fieldSchema.parent?.['x-component'] === 'TableV2.Column';
    const form = createForm();
    const field = useField<Field>();
    const JSONWithEditable = React.useMemo(() => {
      return (
        <div>
          <FormProvider form={form}>
            <ObjectField
              name={fieldSchema.name}
              reactions={(field) => {
                const value = field.value?.json || props?.value;
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
              <Field
                component={[
                  Input.TextArea,
                  {
                    ...props,
                    ref,
                    defaultValue: value != null ? JSON.stringify(value, null, space) : '',
                    onChange: (ev) => {
                      try {
                        const v = ev.target.value.trim() !== '' ? JSON.parse(ev.target.value) : null;
                        field.setFeedback({});
                        onChange?.(v);
                      } catch (err) {
                        field.setFeedback({
                          type: 'error',
                          code: 'JSONSyntaxError',
                          messages: [err.message],
                        });
                      }
                    },
                  },
                ]}
                {...props}
                name="json"
              />
            </ObjectField>
          </FormProvider>
        </div>
      );
    }, []);
    return isDisplayInTable ? (
      JSONWithEditable
    ) : (
      <Input.TextArea
        {...props}
        ref={ref}
        defaultValue={value != null ? JSON.stringify(value, null, space) : ''}
        onChange={(ev) => {
          try {
            const v = ev.target.value.trim() !== '' ? JSON.parse(ev.target.value) : null;
            field.setFeedback({});
            onChange?.(v);
          } catch (err) {
            field.setFeedback({
              type: 'error',
              code: 'JSONSyntaxError',
              messages: [err.message],
            });
          }
        }}
      />
    );
  },
);
