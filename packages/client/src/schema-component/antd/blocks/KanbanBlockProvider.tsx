import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect } from 'react';
import { useCollection } from '../../../collection-manager';
import { BlockProvider, ResourceContext, useResourceAction } from './BlockProvider';
import { toColumns } from './KanbanBlock';

export const KanbanBlockContext = createContext<any>({});

const useGroupField = (props) => {
  const { getField } = useCollection();
  const { groupField } = props;
  if (typeof groupField === 'string') {
    return getField(groupField);
  }
  if (groupField?.name) {
    return getField(groupField?.name);
  }
};

const InternalKanbanBlockProvider = (props) => {
  const field = useField();
  const resource = useContext(ResourceContext);
  const service = useResourceAction({ ...props, resource });
  const groupField = useGroupField(props);
  if (!groupField) {
    return null;
  }
  if (service.loading) {
    return <Spin />;
  }
  return (
    <KanbanBlockContext.Provider
      value={{
        field,
        service,
        resource,
        groupField,
      }}
    >
      {props.children}
    </KanbanBlockContext.Provider>
  );
};

export const KanbanBlockProvider = (props) => {
  return (
    <BlockProvider {...props}>
      <InternalKanbanBlockProvider {...props} />
    </BlockProvider>
  );
};

export const useKanbanBlockContext = () => {
  return useContext(KanbanBlockContext);
};

export const useKanbanBlockProps = () => {
  const field = useField<ArrayField>();
  const ctx = useKanbanBlockContext();
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = toColumns(ctx.groupField, ctx?.service?.data?.data);
    }
    field.loading = ctx?.service?.loading;
  }, [ctx?.service?.loading]);
  return {};
};
