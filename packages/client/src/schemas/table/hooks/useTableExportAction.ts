import { useField } from '@formily/react';
import { useContext } from 'react';
import { useTable } from './useTable';
import { TableRowContext } from '../context';
import { useCollectionContext } from '../../../constate';

export const useTableExportAction = () => {
  const {
    resource,
    field,
    service,
    selectedRowKeys,
    setSelectedRowKeys,
    refresh,
    schema,
    props: { refreshRequestOnChange, rowKey },
  } = useTable();
  const ctx = useContext(TableRowContext);

  const actionField = useField();
  const fieldNames = actionField.componentProps.fieldNames || [];
  const { getField } = useCollectionContext();

  const columns = fieldNames
    .map((name) => {
      const f = getField(name);
      return {
        title: f?.uiSchema.title,
        name,
        sort: f?.sort,
      };
    })
    .sort((a, b) => a.sort - b.sort);

  return {
    async run() {
      const rowKeys = selectedRowKeys || [];
      const { filter = {}, ...others } = service.params[0];
      if (rowKeys.length) {
        filter[`${rowKey}.in`] = rowKeys;
      }
      await resource.export({
        ...others,
        columns,
        perPage: -1,
        page: 1,
        filter,
      });
    },
  };
};
