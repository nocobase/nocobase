import { css } from '@emotion/css';
import { ArrayField, Field } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Table, TableColumnProps } from 'antd';
import cls from 'classnames';
import React, { useState } from 'react';
import { DndContext } from '../..';
import { RecordProvider, useRequest, useSchemaInitializer } from '../../../';

const isColumnComponent = (schema: Schema) => {
  return schema['x-component']?.endsWith('.Column') > -1;
};

const useTableColumns = () => {
  const field = useField<ArrayField>();
  const schema = useFieldSchema();
  const { exists, render } = useSchemaInitializer(schema['x-initializer']);
  const columns = schema
    .reduceProperties((buf, s) => {
      if (isColumnComponent(s)) {
        return buf.concat([s]);
      }
    }, [])
    .map((s: Schema) => {
      return {
        title: <RecursionField name={s.name} schema={s} onlyRenderSelf />,
        dataIndex: s.name,
        key: s.name,
        render: (v, record) => {
          const index = field.value?.indexOf(record);
          return (
            <RecordProvider record={record}>
              <RecursionField schema={s} name={index} onlyRenderProperties />
            </RecordProvider>
          );
        },
      } as TableColumnProps<any>;
    });
  console.log(columns);
  if (!exists) {
    return columns;
  }
  return columns.concat({
    title: render(),
    dataIndex: 'TABLE_COLUMN_INITIALIZER',
    key: 'TABLE_COLUMN_INITIALIZER',
  });
};

export const components = {
  header: {
    wrapper: (props) => {
      return (
        <DndContext>
          <thead {...props} />
        </DndContext>
      );
    },
    cell: (props) => {
      return (
        <th
          {...props}
          className={cls(
            props.className,
            css`
              &:hover .general-schema-designer {
                display: block;
              }
            `,
          )}
        />
      );
    },
  },
  body: {
    wrapper: (props) => {
      return (
        <DndContext>
          <tbody {...props} />
        </DndContext>
      );
    },
  },
};

const useDef = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  return [selectedRowKeys, setSelectedRowKeys];
};

const useDefDataSource = (options, props) => {
  const field = useField<Field>();
  return useRequest(() => {
    return Promise.resolve({
      data: field.value,
    });
  }, options);
};

export const TableArray: React.FC<any> = observer((props) => {
  const field = useField<ArrayField>();
  const columns = useTableColumns();
  const { useSelectedRowKeys = useDef, useDataSource = useDefDataSource, onChange, ...others } = props;
  const [selectedRowKeys, setSelectedRowKeys] = useSelectedRowKeys();
  useDataSource({
    onSuccess(data) {
      field.value = data?.data || [];
    },
  });
  const restProps = {
    rowSelection: props.rowSelection
      ? {
          type: 'checkbox',
          selectedRowKeys,
          onChange(selectedRowKeys: any[]) {
            setSelectedRowKeys(selectedRowKeys);
          },
          ...props.rowSelection,
        }
      : undefined,
  };
  return (
    <div>
      <Table
        {...others}
        {...restProps}
        components={components}
        columns={columns}
        dataSource={field?.value?.slice?.()}
      />
    </div>
  );
});
