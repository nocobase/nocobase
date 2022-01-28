import { LoadingOutlined } from '@ant-design/icons';
import { createForm, Field, onFormSubmit } from '@formily/core';
import {
  connect,
  FieldContext,
  FormContext,
  mapProps,
  mapReadPretty,
  RecursionField,
  Schema,
  useField,
  useFieldSchema
} from '@formily/react';
import { toArr } from '@formily/shared';
import { Button, Drawer, Select, Tag } from 'antd';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { useAttach } from '../../hooks/useAttach';
import { VisibleContext } from '../action';

const InputRecordPicker: React.FC = (props) => {
  const [visible, setVisible] = useState(false);
  const fieldSchema = useFieldSchema();
  const field = useField<Field>();
  const s = fieldSchema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'RowSelection') {
      return s;
    }
    return buf;
  }, new Schema({}));
  const form = useMemo(
    () =>
      createForm({
        initialValues: {
          [s.name]: field.value,
        },
        effects() {
          onFormSubmit((form) => {
            field.value = form.values[s.name];
            console.log('field.value', form.values[s.name]);
          });
        },
      }),
    [],
  );
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  return (
    <div>
      <Select
        onClick={() => {
          setVisible(true);
        }}
        open={false}
      ></Select>
      <FormContext.Provider value={form}>
        <FieldContext.Provider value={f}>
          <Drawer
            placement={'right'}
            destroyOnClose
            visible={visible}
            onClose={() => setVisible(false)}
            footer={
              <Button
                onClick={async () => {
                  await form.submit();
                  setVisible(false);
                }}
              >
                提交
              </Button>
            }
          >
            <RecursionField
              onlyRenderProperties
              basePath={f.address}
              schema={fieldSchema}
              filterProperties={(s) => {
                return s['x-component'] === 'RowSelection';
              }}
            />
          </Drawer>
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

RecordPicker.SelectedItem = () => {
  const ctx = useContext(RowContext);
  const fieldSchema = useFieldSchema();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <VisibleContext.Provider value={[visible, setVisible]}>
        <Tag style={{ cursor: 'pointer' }} onClick={() => setVisible(true)}>
          {ctx.record?.name}
        </Tag>
        <RecursionField onlyRenderProperties schema={fieldSchema}></RecursionField>
      </VisibleContext.Provider>
    </>
  );
};
