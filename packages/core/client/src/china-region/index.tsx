import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import { error } from '@nocobase/utils/client';
import React from 'react';
import { SchemaComponentOptions } from '..';
import { useAPIClient, useRequest } from '../api-client';

const useChinaRegionDataSource = (options) => {
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
    },
  );
};

const useChinaRegionLoadData = () => {
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
      })
      .catch((err) => {
        error(err);
      });
  };
};

export const ChinaRegionProvider = (props) => {
  return (
    <SchemaComponentOptions scope={{ useChinaRegionDataSource, useChinaRegionLoadData }}>
      {props.children}
    </SchemaComponentOptions>
  );
};
