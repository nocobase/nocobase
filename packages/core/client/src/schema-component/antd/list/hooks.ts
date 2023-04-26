import { css } from '@emotion/css';
import { useListBlockContext } from './List.Decorator';
import { useInfiniteScroll } from 'ahooks';
import { useField } from '@formily/react';

export const useListActionBarProps = () => {
  return {
    size: 'large',
  };
};

export const useService = () => {
  const { service } = useListBlockContext();
  const field = useField();
  const { data, loading, loadingMore, noMore } = useInfiniteScroll(
    async (d) => {
      const data = await service.runAsync({
        ...service?.params?.[0],
        page: d ? d.meta.page + 1 : 1,
      });
      return {
        list: data?.data,
        meta: data?.meta,
      };
    },
    {
      threshold: 200,
      manual: true,
      // target: window.document.querySelector('#nb-mobile-scroll-wrapper'),
      isNoMore: (d) => {
        const total = d?.meta?.total;
        const pageSize = d?.meta?.pageSize;
        const curSize = d?.list?.length;
        return curSize !== pageSize || curSize === total;
      },
      reloadDeps: [field.decoratorProps?.params],
    },
  );

  return {
    loading: service.loading || loading,
    data: service?.data?.data || data?.list,
    loadingMore,
    noMore,
    meta: service?.data?.meta || data?.meta,
  };
};
