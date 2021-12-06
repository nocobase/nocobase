import React, { createContext } from 'react';
import { findIndex } from 'lodash';
import { RecursionField, Schema } from '@formily/react';
import { useDesignable } from '../..';
import { useTable } from './useTable';
import { TableRowContext } from '../context';
import { useCollectionContext } from '../../../constate';
import { Table } from '../Table';
import { isColumn } from '../utils';
import { AddColumn } from '../AddColumn';
import { CollectionFieldContext } from '../context';

export const useTableColumns = () => {
  const {
    field,
    schema,
    props: { rowKey },
  } = useTable();
  const { designable } = useDesignable();

  const { getField } = useCollectionContext();

  const columnSchemas = schema.reduceProperties((columns, current) => {
    if (isColumn(current)) {
      if (!current['x-component-props']) {
        current['x-component-props'] = {};
      }
      current['x-component-props']['ellipsis'] = true;
      if (current['x-hidden']) {
        return columns;
      }
      if (current['x-display'] && current['x-display'] !== 'visible') {
        return columns;
      }
      return [...columns, current];
    }
    return [...columns];
  }, []);

  const columns: any[] = [].concat(
    columnSchemas.map((column: Schema) => {
      const columnProps = column['x-component-props'] || {};
      const collectionField = getField(columnProps.fieldName);
      return {
        title: (
          <CollectionFieldContext.Provider value={collectionField}>
            <RecursionField name={column.name} schema={column} onlyRenderSelf />
          </CollectionFieldContext.Provider>
        ),
        dataIndex: column.name,
        ...columnProps,
        ellipsis: true,
        render: (_: any, record: any) => {
          const index = findIndex(field.value, (item) => item[rowKey] === record[rowKey]);
          return (
            <CollectionFieldContext.Provider value={collectionField}>
              <TableRowContext.Provider value={{ index, record }}>
                <Table.Cell schema={column} />
              </TableRowContext.Provider>
            </CollectionFieldContext.Provider>
          );
        },
      };
    }),
  );

  if (designable && schema['x-designable-bar'] && schema['x-designable-bar'] !== 'Table.SimpleDesignableBar') {
    columns.push({
      title: <AddColumn />,
      dataIndex: 'addnew',
    });
  }
  return columns;
};
