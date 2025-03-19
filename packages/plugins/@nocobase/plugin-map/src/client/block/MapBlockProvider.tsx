/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { useField, useFieldSchema } from '@formily/react';
import { BlockProvider, SchemaComponentOptions, useBlockRequestContext, useParsedFilter } from '@nocobase/client';
import { theme } from 'antd';
import React, { createContext, useContext, useState } from 'react';

export const MapBlockContext = createContext<any>({});
MapBlockContext.displayName = 'MapBlockContext';

const InternalMapBlockProvider = (props) => {
  const { fieldNames } = props;
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { resource, service } = useBlockRequestContext();
  const [selectedRecordKeys, setSelectedRecordKeys] = useState([]);
  const { token } = theme.useToken();

  return (
    <SchemaComponentOptions scope={{ selectedRecordKeys }}>
      <MapBlockContext.Provider
        value={{
          field,
          service,
          resource,
          fieldNames,
          fixedBlock: fieldSchema?.['x-decorator-props']?.fixedBlock,
          selectedRecordKeys,
          setSelectedRecordKeys,
        }}
      >
        {' '}
        <div
          className={css`
            .nb-action-bar {
              margin-bottom: ${token.margin}px;
            }
          `}
        >
          {props.children}
        </div>
      </MapBlockContext.Provider>
    </SchemaComponentOptions>
  );
};

const useMapBlockParams = (params: Record<string, any>) => {
  const { filter: parsedFilter, parseVariableLoading } = useParsedFilter({
    filterOption: params?.filter,
  });

  return {
    params: {
      ...params,
      filter: parsedFilter,
    } as Record<string, any>,
    parseVariableLoading,
  };
};

export const MapBlockProvider = (props) => {
  const uField = useField();
  const { fieldNames } = props;
  const { params, parseVariableLoading } = useMapBlockParams(props.params);

  // 在解析变量的时候不渲染，避免因为重复请求数据导致的资源浪费
  if (parseVariableLoading) {
    return null;
  }

  const appends = params.appends || [];
  const { field } = fieldNames || {};

  if (Array.isArray(field) && field.length > 1) {
    appends.push(field[0]);
  }
  return (
    <BlockProvider
      name="map"
      {...props}
      runWhenParamsChanged
      params={{ ...params, appends, paginate: false, sort: uField.componentProps.lineSort }}
    >
      <InternalMapBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useMapBlockContext = () => {
  return useContext(MapBlockContext);
};

export const useMapBlockProps = () => {
  const ctx = useMapBlockContext();

  return {
    ...ctx,
    dataSource: ctx?.service?.data?.data,
    zoom: ctx?.field?.componentProps?.zoom || 13,
    lineSort: ctx?.field?.componentProps?.lineSort,
  };
};
