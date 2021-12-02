import { useTable } from './useTable';
import { useForm } from '@formily/react';

export function useTableFilterAction() {
  const {
    field,
    service,
    refresh,
    props: { refreshRequestOnChange },
  } = useTable();
  const form = useForm();
  return {
    async run() {
      console.log('useTableFilterAction', form.values);
      if (refreshRequestOnChange) {
        return service.run({
          ...service.params[0],
          // filter,
        });
      }
    },
  };
}
