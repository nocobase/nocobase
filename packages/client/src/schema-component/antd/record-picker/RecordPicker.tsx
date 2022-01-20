import { LoadingOutlined } from '@ant-design/icons';
import { Field } from '@formily/core';
import { connect, mapProps, mapReadPretty, RecursionField, useField, useFieldSchema } from '@formily/react';
import { toArr } from '@formily/shared';
import { Drawer, Select, Tag } from 'antd';
import React, { createContext, useContext, useState } from 'react';
import { VisibleContext } from '../action';

const InputRecordPicker: React.FC = (props) => {
  const [visible, setVisible] = useState(false);
  const fieldSchema = useFieldSchema();
  return (
    <div>
      <Select
        onClick={() => {
          setVisible(true);
        }}
        open={false}
      ></Select>
      <Drawer placement={'right'} destroyOnClose visible={visible} onClose={() => setVisible(false)}>
        <RecursionField
          onlyRenderProperties
          schema={fieldSchema}
          filterProperties={(s) => {
            return s['x-component'] === 'RowSelection';
          }}
        ></RecursionField>
      </Drawer>
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
