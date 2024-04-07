import { css, cx } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { FormContext, useField } from '@formily/react';
import _ from 'lodash';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { BlockProvider, useBlockRequestContext, useParsedFilter } from '../../../block-provider';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';

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
      form.setValuesIn(field.address.concat('list').toString(), service?.data?.data);
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
              .ant-description-input {
                line-height: 34px;
              }
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
  const { filter: parsedFilter } = useParsedFilter({
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
  if (_.isEmpty(parsedFilter) && !_.isEmpty(params?.filter)) {
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
