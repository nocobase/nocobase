import { FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { FormContext, useField } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { BlockProvider, useBlockRequestContext, useParsedFilter } from '../../../block-provider';
import { useRecord } from '../../../record-provider';
import useStyles from './GridCard.Decorator.style';
export const GridCardBlockContext = createContext<any>({});

const InternalGridCardBlockProvider = (props) => {
  const { resource, service } = useBlockRequestContext();
  const field = useField();
  const { wrapSSR, componentCls, hashId } = useStyles();

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

  return wrapSSR(
    <GridCardBlockContext.Provider
      value={{
        service,
        resource,
        columnCount: props.columnCount,
      }}
    >
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'}>
          <div className={`${componentCls} ${hashId}`}>{props.children}</div>
        </FormLayout>
      </FormContext.Provider>
    </GridCardBlockContext.Provider>,
  );
};

export const GridCardBlockProvider = (props) => {
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
    <BlockProvider name="grid-card" {...props} params={paramsWithFilter}>
      <InternalGridCardBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useGridCardBlockContext = () => {
  return useContext(GridCardBlockContext);
};

export const useGridCardItemProps = () => {
  return {};
};
