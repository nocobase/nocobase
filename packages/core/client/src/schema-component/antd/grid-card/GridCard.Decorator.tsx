import { createForm } from '@formily/core';
import { FormContext, useField, useForm } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BlockProvider, useBlockRequestContext } from '../../../block-provider';
import { FormLayout } from '@formily/antd';
import { css } from '@emotion/css';
import { useAssociationNames } from '../../../block-provider/hooks';

export const GridCardBlockContext = createContext<any>({});

const InternalGridCardBlockProvider = (props) => {
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
    <GridCardBlockContext.Provider
      value={{
        service,
        resource,
        columnCount: props.columnCount,
      }}
    >
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'}>
          <div
            className={css`
              & > .nb-block-item {
                margin-bottom: var(--nb-spacing);
                & > .nb-action-bar:has(:first-child:not(:empty)) {
                  padding: var(--nb-spacing);
                  background: #fff;
                }
                .ant-list-pagination {
                  padding: var(--nb-spacing);
                  background: #fff;
                }
              }
            `}
          >
            {props.children}
          </div>
        </FormLayout>
      </FormContext.Provider>
    </GridCardBlockContext.Provider>
  );
};

export const GridCardBlockProvider = (props) => {
  const params = { ...props.params };
  const { collection } = props;
  const { appends } = useAssociationNames(collection);
  if (!Object.keys(params).includes('appends')) {
    params['appends'] = appends;
  }

  return (
    <BlockProvider {...props} params={params}>
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
