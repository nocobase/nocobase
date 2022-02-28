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
import { Button, Drawer, Select, Space, Tag } from 'antd';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAttach } from '../../hooks/useAttach';
import { ActionContext, useActionContext } from '../action';

const InputRecordPicker: React.FC<any> = (props) => {
  const { onChange } = props;
  const fieldNames = { label: 'label', value: 'value', ...props.fieldNames };
  const [visible, setVisible] = useState(false);
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const s = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'RecordPicker.Options') {
      return s.reduceProperties((buf, s) => {
        if (s['x-component'] === 'Table.RowSelection') {
          return s;
        }
        return buf;
      }, null);
    }
    return buf;
  }, null);
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
        mode={props.mode}
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
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <Tag style={{ cursor: 'pointer' }} onClick={() => setVisible(true)}>
        {ctx.record?.name}
      </Tag>
      <RecursionField onlyRenderProperties schema={fieldSchema}></RecursionField>
    </ActionContext.Provider>
  );
};
