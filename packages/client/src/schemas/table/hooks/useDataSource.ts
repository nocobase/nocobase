import { useTable } from './useTable';

export const useDataSource = () => {
  const {
    pagination,
    field,
    props: { clientSidePagination, dataRequest },
  } = useTable();
  let dataSource = field.value;
  // if (pagination && (clientSidePagination || !dataRequest)) {
  //   const { page = 1, pageSize } = pagination;
  //   const startIndex = (page - 1) * pageSize;
  //   const endIndex = startIndex + pageSize - 1;
  //   dataSource = field.value?.slice(startIndex, endIndex + 1);
  // }
  return dataSource;
};
