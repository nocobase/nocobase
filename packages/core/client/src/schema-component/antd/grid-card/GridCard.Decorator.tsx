import { FormLayout } from '@formily/antd-v5';
import { createForm } from '@formily/core';
import { FormContext, useField, useFieldSchema } from '@formily/react';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { BlockProvider, useBlockRequestContext, useParsedFilter } from '../../../block-provider';
import useStyles from './GridCard.Decorator.style';
import { useGridCardBlockParams } from '../../../modules/blocks/data-blocks/grid-card/hooks/useGridCardBlockParams';
import { withDynamicSchemaProps } from '../../../application/hoc/withDynamicSchemaProps';

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
      form.setValuesIn(field.address.concat('list').toString(), service?.data?.data);
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
    return props.params;
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useGridCardBlockParams(props);
  }
};

export const GridCardBlockProvider = withDynamicSchemaProps((props) => {
  const params = useCompatGridCardBlockParams(props);

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
