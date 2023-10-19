import { css, cx } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { FormContext, useField } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { BlockProvider, useBlockRequestContext, useParsedFilter } from '../../../block-provider';
import { useRecord } from '../../../record-provider';

export const ListBlockContext = createContext<any>({});

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
  }, [service?.data?.data, service?.loading]);

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

export const ListBlockProvider = (props) => {
  const { params } = props;
  const record = useRecord();

  const { filter: parsedFilter } = useParsedFilter({
    filterOption: params?.filter,
    currentRecord: { __parent: record, __collectionName: props.collection },
  });
  const paramsWithFilter = useMemo(() => {
    return {
      ...params,
      filter: parsedFilter,
    };
  }, [parsedFilter, params]);

  return (
    <BlockProvider name="list" {...props} params={paramsWithFilter}>
      <InternalListBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useListBlockContext = () => {
  return useContext(ListBlockContext);
};

export const useListItemProps = () => {
  return {};
};
