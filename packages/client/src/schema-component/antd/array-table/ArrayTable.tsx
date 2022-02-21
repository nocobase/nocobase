import { css } from '@emotion/css';
import { ArrayField } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema } from '@formily/react';
import { Table, TableColumnProps } from 'antd';
import cls from 'classnames';
import React from 'react';
import { DndContext } from '../..';
import { RecordProvider } from '../../../';
import { useComponent } from '../../hooks';

const isColumnComponent = (schema: Schema) => {
  return schema['x-component']?.endsWith('.Column') > -1;
};

const useTableColumns = () => {
  const field = useField<ArrayField>();
  const schema = useFieldSchema();
  const Initializer = useComponent(schema['x-column-initializer']);
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
  if (!Initializer) {
    return columns;
  }
  return columns.concat({
    title: <Initializer />,
    dataIndex: 'TABLE_COLUMN_INITIALIZER',
    key: 'TABLE_COLUMN_INITIALIZER',
  });
};

type ArrayTableType = React.FC<any> & {
  Column?: React.FC<any>;
  mixin?: (T: any) => void;
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

export const ArrayTable: ArrayTableType = observer((props) => {
  const field = useField<ArrayField>();
  const columns = useTableColumns();
  const { onChange, ...others } = props;
  return (
    <div>
      <Table {...others} components={components} columns={columns} dataSource={field.value?.slice()} />
    </div>
  );
});

ArrayTable.Column = (props) => {
  const field = useField();
  console.log('field.title', field.title);
  return <div>{field.title}</div>;
};

ArrayTable.mixin = (Table: any) => {
  Table.Column = ArrayTable.Column;
};
