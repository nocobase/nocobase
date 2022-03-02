import { LoadingOutlined } from '@ant-design/icons';
import { createForm, Field, onFormSubmit } from '@formily/core';
import {
  connect,
  FieldContext,
  FormContext,
  mapProps,
  mapReadPretty,
  observer,
  RecursionField,
  useField,
  useFieldSchema,
  useForm
} from '@formily/react';
import { toArr } from '@formily/shared';
import { Button, Drawer, Select, Space } from 'antd';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAttach } from '../../hooks/useAttach';
import { ActionContext, useActionContext } from '../action';

const findRowSelection = (fieldSchema) => {
  return fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'Table.RowSelection') {
      return s;
    }
    const r = findRowSelection(s);
    if (r) {
      return r;
    }
    return buf;
  }, null);
};

const InputRecordPicker: React.FC<any> = (props) => {
  const { multiple, onChange } = props;
  const fieldNames = { label: 'label', value: 'value', ...props.fieldNames };
  const [visible, setVisible] = useState(false);
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const s = findRowSelection(fieldSchema);
  const [value, setValue] = useState(field.value);
  const form = useMemo(
    () =>
      createForm({
        initialValues: s?.name
          ? {
              [s.name]: field.value,
            }
          : {},
        effects() {
          onFormSubmit((form) => {
            setValue(form.values[s.name]);
            onChange?.(form.values[s.name]);
          });
        },
      }),
    [],
  );
  const toValue = (value) => {
    if (!value) {
      return;
    }
    if (Array.isArray(value)) {
      return value.map((item) => {
        return {
          label: item[fieldNames.label] || item[fieldNames.value],
          value: item[fieldNames.value],
        };
      });
    }
    return {
      label: value[fieldNames.label] || value[fieldNames.value],
      value: value[fieldNames.value],
    };
  };
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  return (
    <div>
      <Select
        size={props.size}
        mode={multiple ? 'multiple' : props.mode}
        fieldNames={fieldNames}
        onClick={() => {
          setVisible(true);
        }}
        labelInValue={true}
        value={toValue(value)}
        open={false}
      ></Select>
      <FormContext.Provider value={form}>
        <FieldContext.Provider value={f}>
          <ActionContext.Provider value={{ visible, setVisible }}>
            <RecursionField
              onlyRenderProperties
              basePath={f.address}
              schema={fieldSchema}
              filterProperties={(s) => {
                return s['x-component'] === 'RecordPicker.Options';
              }}
            />
          </ActionContext.Provider>
        </FieldContext.Provider>
      </FormContext.Provider>
    </div>
  );
};

const RowContext = createContext<any>({});

const ReadPrettyRecordPicker: React.FC = (props) => {
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  return (
    <div>
      <Space size={0} split={<span style={{ marginRight: 4, color: '#aaa' }}>, </span>}>
        {toArr(field.value).map((record, index) => {
          return (
            <RowContext.Provider key={index} value={{ record, field, props }}>
              <RecursionField
                schema={fieldSchema}
                onlyRenderProperties
                filterProperties={(s) => {
                  return s['x-component'] === 'RecordPicker.SelectedItem';
                }}
              />
            </RowContext.Provider>
          );
        })}
      </Space>
    </div>
  );
};

const mapSuffixProps = (props, field) => {
  return {
    ...props,
    suffix: <span>{field?.['loading'] || field?.['validating'] ? <LoadingOutlined /> : props.suffix}</span>,
  };
};

export const RecordPicker: any = connect(
  InputRecordPicker,
  mapProps(mapSuffixProps),
  mapReadPretty(ReadPrettyRecordPicker),
);

RecordPicker.Options = observer((props) => {
  const field = useField();
  const form = useForm();
  const { visible, setVisible } = useActionContext();
  const { t } = useTranslation();
  return (
    <Drawer
      width={'50%'}
      placement={'right'}
      title={field.title}
      {...props}
      destroyOnClose
      visible={visible}
      onClose={() => setVisible(false)}
      footer={
        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button
            onClick={async () => {
              setVisible(false);
            }}
          >
            {t('Cancel')}
          </Button>
          <Button
            type={'primary'}
            onClick={async () => {
              await form.submit();
              setVisible(false);
            }}
          >
            {t('Submit')}
          </Button>
        </Space>
      }
    />
  );
});

RecordPicker.SelectedItem = () => {
  const ctx = useContext(RowContext);
  const fieldSchema = useFieldSchema();
  const [visible, setVisible] = useState(false);
  const fieldNames = ctx.field.componentProps.fieldNames;
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <a style={{ cursor: 'pointer' }} onClick={() => setVisible(true)}>
        {ctx.record[fieldNames?.label || 'id']}
      </a>
      <RecursionField onlyRenderProperties schema={fieldSchema}></RecursionField>
    </ActionContext.Provider>
  );
};
