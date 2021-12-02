import { useForm } from "@formily/react";
import { useContext } from "react";
import { useTable } from "./useTable";
import { TableRowContext } from "../context";
import { DescriptionsContext } from '../../form';

export const useTableUpdateAction = () => {
  const {
    resource,
    field,
    service,
    refresh,
    props: { refreshRequestOnChange, rowKey },
  } = useTable();
  const ctx = useContext(TableRowContext);
  const form = useForm();
  const { service: formService } = useContext(DescriptionsContext);

  return {
    async run() {
      if (refreshRequestOnChange) {
        await resource.save(form.values, {
          resourceKey: ctx.record[rowKey],
        });
        if (formService) {
          await formService.refresh();
        }
        await service.refresh();
        return;
      }
      field.value[ctx.index] = form.values;
      // refresh();
    },
  };
};
