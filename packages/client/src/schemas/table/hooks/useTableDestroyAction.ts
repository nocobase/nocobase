import { useContext } from "react";
import { useTable } from "./useTable";
import { TableRowContext } from "../context";
import { VisibleContext } from '../../../context';
import { findIndex } from 'lodash';

export const useTableDestroyAction = () => {
  const {
    resource,
    field,
    service,
    selectedRowKeys,
    setSelectedRowKeys,
    refresh,
    props: { refreshRequestOnChange, rowKey },
  } = useTable();
  const ctx = useContext(TableRowContext);
  const [, setVisible] = useContext(VisibleContext);
  return {
    async run() {
      if (refreshRequestOnChange) {
        const rowKeys = selectedRowKeys || [];
        if (ctx) {
          rowKeys.push(ctx.record[rowKey]);
        }
        await resource.destroy({
          [`${rowKey}.in`]: rowKeys,
        });
        setSelectedRowKeys([]);
        setVisible && setVisible(false);
        return service.refresh();
      }
      if (ctx) {
        console.log('ctx.index', ctx.index);
        field.remove(ctx.index);
        refresh();
      }
      const rowKeys = [...selectedRowKeys];
      while (rowKeys.length) {
        const key = rowKeys.shift();
        const index = findIndex(field.value, (item) => item[rowKey] === key);
        field.remove(index);
      }
      setSelectedRowKeys([]);
      refresh();
      return;
    },
  };
};
