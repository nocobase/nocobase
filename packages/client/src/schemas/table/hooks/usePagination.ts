import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';

export const usePagination = () => {
  const field = useField<ArrayField>();
  const paginationProps = field.componentProps.pagination;

  let pagination = paginationProps;

  // const [pagination, setPagination] = useState(() => {
  //   if (!paginationProps) {
  //     return false;
  //   }
  //   const { defaultPageSize = 10, ...others } = paginationProps;
  //   return { page: 1, pageSize: defaultPageSize, ...others };
  // });

  // useEffect(() => {
  //   if (!paginationProps) {
  //     return setPagination(false);
  //   }
  //   const { defaultPageSize = 10, ...others } = paginationProps;
  //   setPagination({ page: 1, pageSize: defaultPageSize, ...others });
  // }, [paginationProps]);

  return [
    pagination,
    (params) => {
      const defaults = field.componentProps.pagination;
      field.componentProps.pagination = { ...defaults, ...params };
    },
  ];
};
