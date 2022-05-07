import { ArrayField } from '@formily/core';
import { useField } from '@formily/react';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect } from 'react';
import { useACLRoleContext } from '../acl';
import { useCollection } from '../collection-manager';
import { toColumns } from '../schema-component/antd/kanban/Kanban';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';

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
  const field = useField<any>();
  const { resource, service } = useBlockRequestContext();
  const groupField = useGroupField(props);
  if (!groupField) {
    return null;
  }
  if (service.loading && !field.loaded) {
    return <Spin />;
  }
  field.loaded = true;
  return (
    <KanbanBlockContext.Provider
      value={{
        props: {
          resource: props.resource,
        },
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

const useDisableCardDrag = () => {
  const ctx = useKanbanBlockContext();
  const { allowAll, allowConfigure, getActionParams } = useACLRoleContext();
  if (allowAll || allowConfigure) {
    return false;
  }
  const result = getActionParams(`${ctx?.props?.resource}:update`, { skipOwnCheck: true });
  return !result;
}

export const useKanbanBlockProps = () => {
  const field = useField<ArrayField>();
  const ctx = useKanbanBlockContext();
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = toColumns(ctx.groupField, ctx?.service?.data?.data);
    }
    // field.loading = ctx?.service?.loading;
  }, [ctx?.service?.loading]);
  return {
    groupField: ctx.groupField,
    disableCardDrag: useDisableCardDrag(),
    async onCardDragEnd({ columns, groupField }, { fromColumnId, fromPosition }, { toColumnId, toPosition }) {
      const sourceColumn = columns.find((column) => column.id === fromColumnId);
      const destinationColumn = columns.find((column) => column.id === toColumnId);
      const sourceCard = sourceColumn?.cards?.[fromPosition];
      const targetCard = destinationColumn?.cards?.[toPosition];
      const values = {
        sourceId: sourceCard.id,
        sortField: `${groupField.name}_sort`,
      };
      if (targetCard) {
        values['targetId'] = targetCard.id;
      } else {
        values['targetScope'] = {
          [groupField.name]: toColumnId,
        };
      }
      await ctx.resource.move(values);
    },
  };
};
