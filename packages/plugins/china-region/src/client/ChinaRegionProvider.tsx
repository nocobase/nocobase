import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import { useAPIClient, useRequest } from '@nocobase/client';

export const useChinaRegionDataSource = (options) => {
  const field = useField<ArrayField>();
  const maxLevel = field.componentProps.maxLevel;
  return useRequest(
    {
      resource: 'chinaRegions',
      action: 'list',
      params: {
        sort: 'code',
        paginate: false,
        filter: {
          level: 1,
        },
      },
    },
    {
      ...options,
      onSuccess(data) {
        options?.onSuccess({
          data:
            data?.data?.map((item) => {
              if (maxLevel !== 1) {
                item.isLeaf = false;
              }
              return item;
            }) || [],
        });
      },
      manual: true,
    },
  );
};

export const useChinaRegionLoadData = () => {
  const api = useAPIClient();
  const field = useField<ArrayField>();
  const maxLevel = field.componentProps.maxLevel;
  return (selectedOptions) => {
    const targetOption = selectedOptions[selectedOptions.length - 1];
    if (targetOption?.children?.length > 0) {
      return;
    }
    targetOption.loading = true;
    api
      .resource('chinaRegions')
      .list({
        sort: 'code',
        paginate: false,
        filter: {
          parentCode: targetOption.code,
        },
      })
      .then(({ data }) => {
        targetOption.loading = false;
        targetOption.children =
          data?.data?.map((item) => {
            if (maxLevel > item.level) {
              item.isLeaf = false;
            }
            return item;
          }) || [];
        field.dataSource = [...field.dataSource];
      });
  };
};
