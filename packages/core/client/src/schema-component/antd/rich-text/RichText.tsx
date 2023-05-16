import { connect, mapReadPretty, ObjectField, FormProvider, Field, useField, useFieldSchema } from '@formily/react';
import React from 'react';
import { createForm } from '@formily/core';
import { Editable } from '@formily/antd';
import ReactQuill from 'react-quill';
import { css } from '@emotion/css';

import { ReadPretty as InputReadPretty } from '../input';
import './style.less';

export const RichText = connect(
  (props) => <InputRichText {...props} />,
  mapReadPretty((props) => {
    return <InputReadPretty.Html {...props} />;
  }),
);

const InputRichText = (props) => {
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
  const { value, onChange, disabled } = props;
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
              const value = field.value?.richText || props?.value;
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
                ReactQuill,
                {
                  modules,
                  formats,
                  value: typeof value === 'string' ? value : '',
                  onChange,
                  readOnly: disabled,
                },
              ]}
              {...props}
              name="richText"
            />
          </ObjectField>
        </FormProvider>
      </div>
    );
  }, []);

  return isDisplayInTable ? (
    FieldWithEditable
  ) : (
    <ReactQuill
      modules={modules}
      formats={formats}
      value={typeof value === 'string' ? value : ''}
      onChange={onChange}
      readOnly={disabled}
    />
  );
};
