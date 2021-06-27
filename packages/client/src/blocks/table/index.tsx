import React from 'react';
import {
  useFieldSchema,
  Schema,
  observer,
  RecursionField,
  useField,
} from '@formily/react';
import { Table as AntdTable } from 'antd';
import { DesignableBar } from './DesignableBar';
import { ColumnDesignableBar } from './ColumnDesignableBar';

function useTableColumns(props) {
  const schema = useFieldSchema();
  const { dataSource } = props;

  function findColumns(schema: Schema): Schema[] {
    return schema.reduceProperties((columns, current) => {
      if (current['x-component'] === 'Table.Column') {
        return [...columns, current];
      }
      return [...columns, ...findColumns(current)];
    }, []);
  }

  return findColumns(schema).map((item) => {
    const columnProps = item['x-component-props'] || {};
    return {
      title: item.title,
      dataIndex: item.name,
      ...columnProps,
      render(value, record) {
        console.log({ item });
        const index = dataSource.indexOf(record);
        item.mapProperties((s) => {
          s['title'] = undefined;
          s['x-read-pretty'] = true;
          return s;
        })
        return (
          <RecursionField schema={item} name={index} onlyRenderProperties />
        );
      },
    };
  });
}

function useTableActionBars() {
  const schema = useFieldSchema();

  function findActionBars(schema: Schema) {
    const actionBars = {
      top: [],
      bottom: [],
    };
    return schema.reduceProperties((bars, current) => {
      if (current['x-component'] === 'Table.ActionBar') {
        const align = current['x-component-props']?.['align'] || 'top';
        bars[align].push(current);

        return bars;
      }

      const nested = findActionBars(current);

      Object.keys(nested).forEach((align) => {
        bars[align].push(...nested[align]);
      });

      return bars;
    }, actionBars);
  }

  return findActionBars(schema);
}

function useTableDetails() {
  const schema = useFieldSchema();

  function findDetails(schema: Schema) {
    return schema.reduceProperties((items, current) => {
      if (current['x-component'] === 'Table.Details') {
        return [...items, current];
      }
      return [...items, ...findDetails(current)];
    }, []);
  }

  return findDetails(schema);
}

export const Table: any = observer((props) => {
  const field = useField<Formily.Core.Models.ArrayField>();
  const dataSource = field.value;
  const columns = useTableColumns({ dataSource });
  const actionBars = useTableActionBars();
  const details = useTableDetails();
  console.log({ columns, actionBars, details });
  return (
    <>
      <AntdTable columns={columns} dataSource={dataSource} />
    </>
  );
});

Table.Column = () => null;
Table.Column.DesignableBar = ColumnDesignableBar;
Table.DesignableBar = DesignableBar;
