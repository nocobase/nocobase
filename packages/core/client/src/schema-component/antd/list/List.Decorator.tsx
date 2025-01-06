/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css, cx } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { FormContext, useField } from '@formily/react';
import _ from 'lodash';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { BlockProvider, useBlockRequestContext } from '../../../block-provider/BlockProvider';
import { useParsedFilter } from '../../../block-provider/hooks/useParsedFilter';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';

export const ListBlockContext = createContext<any>({});
ListBlockContext.displayName = 'ListBlockContext';

const InternalListBlockProvider = (props) => {
  const { resource, service } = useBlockRequestContext();

  const field = useField();
  const form = useMemo(() => {
    return createForm({
      readPretty: true,
    });
  }, []);

  useEffect(() => {
    if (!service?.loading) {
      form.query(/\.list$/).forEach((field) => {
        // @ts-ignore
        field.setValue?.(service?.data?.data);
      });
    }
  }, [field.address, form, service?.data?.data, service?.loading]);

  return (
    <ListBlockContext.Provider
      value={{
        service,
        resource,
      }}
    >
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'}>
          <div
            className={cx(css`
              .ant-formily-item-feedback-layout-loose {
                margin-bottom: 12px;
              }
            `)}
          >
            {props.children}
          </div>
        </FormLayout>
      </FormContext.Provider>
    </ListBlockContext.Provider>
  );
};

export const ListBlockProvider = withDynamicSchemaProps((props) => {
  const { params } = props;
  const { filter: parsedFilter, parseVariableLoading } = useParsedFilter({
    filterOption: params?.filter,
  });
  const paramsWithFilter = useMemo(() => {
    return {
      ...params,
      filter: parsedFilter,
    };
  }, [parsedFilter, params]);

  // parse filter 的过程是异步的，且一开始 parsedFilter 是一个空对象，所以当 parsedFilter 为空 params.filter 不为空时，
  // 说明 filter 还未解析完成，此时不应该渲染，防止重复请求多次
  if ((_.isEmpty(parsedFilter) && !_.isEmpty(params?.filter)) || parseVariableLoading) {
    return null;
  }

  return (
    <BlockProvider name="list" {...props} params={paramsWithFilter}>
      <InternalListBlockProvider {...props} />
    </BlockProvider>
  );
});

export const useListBlockContext = () => {
  return useContext(ListBlockContext);
};

export const useListItemProps = () => {
  return {};
};
