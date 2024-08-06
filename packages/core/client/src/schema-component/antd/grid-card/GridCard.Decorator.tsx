/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { FormContext, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { BlockProvider, useBlockRequestContext } from '../../../block-provider/BlockProvider';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { useGridCardBlockParams } from '../../../modules/blocks/data-blocks/grid-card/hooks/useGridCardBlockParams';
import useStyles from './GridCard.Decorator.style';

export const GridCardBlockContext = createContext<any>({});
GridCardBlockContext.displayName = 'GridCardBlockContext';

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
      // @ts-ignore
      form.fields[field.address.concat('list').toString()]?.setValue(service?.data?.data);
    }
  }, [field.address, form, service?.data?.data, service?.loading]);

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

/**
 * 用于兼容旧版 UISchema（旧版本没有 x-use-decorator-props）
 * @param props
 */
const useCompatGridCardBlockParams = (props) => {
  const schema = useFieldSchema();

  // 因为 x-use-decorator-props 的值是固定的，所以可以在条件中使用 hooks
  if (schema['x-use-decorator-props']) {
    return { params: props.params, parseVariableLoading: props.parseVariableLoading };
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useGridCardBlockParams(props);
  }
};

export const GridCardBlockProvider = withDynamicSchemaProps((props) => {
  const { params, parseVariableLoading } = useCompatGridCardBlockParams(props);

  if (parseVariableLoading) {
    return null;
  }

  return (
    <BlockProvider name="grid-card" {...props} params={params}>
      <InternalGridCardBlockProvider {...props} />
    </BlockProvider>
  );
});

export const useGridCardBlockContext = () => {
  return useContext(GridCardBlockContext);
};

export const useGridCardItemProps = () => {
  return {};
};
