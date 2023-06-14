import { createForm } from '@formily/core';
import { FormContext, useField, useForm } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { BlockProvider, useBlockRequestContext } from '../../../block-provider';
import { FormLayout } from '@formily/antd';
import { css } from '@emotion/css';
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
              // .ant-formily-item-layout-vertical {
              //   margin-bottom: 0px;
              // }
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
  return (
    <BlockProvider {...props}>
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
