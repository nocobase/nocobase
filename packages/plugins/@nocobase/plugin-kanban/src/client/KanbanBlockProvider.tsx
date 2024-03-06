import { ArrayField } from '@formily/core';
import { Schema, useField, useFieldSchema } from '@formily/react';
import { Spin } from 'antd';
import uniq from 'lodash/uniq';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  useACLRoleContext,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  FixedBlockWrapper,
  BlockProvider,
  useBlockRequestContext,
} from '@nocobase/client';
import { toColumns } from './Kanban';

export const KanbanBlockContext = createContext<any>({});
KanbanBlockContext.displayName = 'KanbanBlockContext';

const useGroupField = (props) => {
  const { getField } = useCollection_deprecated();
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
    <FixedBlockWrapper>
      <KanbanBlockContext.Provider
        value={{
          props: {
            resource: props.resource,
          },
          field,
          service,
          resource,
          groupField,
          fixedBlock: field?.decoratorProps?.fixedBlock,
          sortField: props?.sortField,
        }}
      >
        {props.children}
      </KanbanBlockContext.Provider>
    </FixedBlockWrapper>
  );
};

const recursiveProperties = (schema: Schema, component = 'CollectionField', associationFields, appends: any = []) => {
  schema.mapProperties((s: any) => {
    const name = s.name.toString();
    if (s['x-component'] === component && !appends.includes(name)) {
      // 关联字段和关联的关联字段
      const [firstName] = name.split('.');
      if (associationFields.has(name)) {
        appends.push(name);
      } else if (associationFields.has(firstName) && !appends.includes(firstName)) {
        appends.push(firstName);
      }
    } else {
      recursiveProperties(s, component, associationFields, appends);
    }
  });
};

const useAssociationNames = (collection) => {
  const { getCollectionFields } = useCollectionManager_deprecated(collection.dataSource);
  const collectionFields = getCollectionFields(collection);
  const associationFields = new Set();
  for (const collectionField of collectionFields) {
    if (collectionField.target) {
      associationFields.add(collectionField.name);
      const fields = getCollectionFields(collectionField.target);
      for (const field of fields) {
        if (field.target) {
          associationFields.add(`${collectionField.name}.${field.name}`);
        }
      }
    }
  }
  const fieldSchema = useFieldSchema();
  const kanbanSchema = fieldSchema.reduceProperties((buf, schema) => {
    if (schema['x-component'].startsWith('Kanban')) {
      return schema;
    }
    return buf;
  }, new Schema({}));
  const gridSchema: any = kanbanSchema?.properties?.card?.properties?.grid;
  const appends = [];
  if (gridSchema) {
    recursiveProperties(gridSchema, 'CollectionField', associationFields, appends);
  }

  return uniq(appends);
};

export const KanbanBlockProvider = (props) => {
  const params = { ...props.params };
  const appends = useAssociationNames(props.collection);
  if (!Object.keys(params).includes('appends')) {
    params['appends'] = appends;
  }
  return (
    <BlockProvider name="kanban" {...props} params={params}>
      <InternalKanbanBlockProvider {...props} params={params} />
    </BlockProvider>
  );
};

export const useKanbanBlockContext = () => {
  return useContext(KanbanBlockContext);
};

const useDisableCardDrag = () => {
  const ctx = useKanbanBlockContext();
  const { allowAll, allowConfigure, parseAction } = useACLRoleContext();
  if (allowAll || allowConfigure) {
    return false;
  }
  const result = parseAction(`${ctx?.props?.resource}:update`, { ignoreScope: true });
  return !result;
};

export const useKanbanBlockProps = () => {
  const field = useField<ArrayField>();
  const ctx = useKanbanBlockContext();
  const [dataSource, setDataSource] = useState([]);
  const primaryKey = useCollection_deprecated().getPrimaryKey();
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = toColumns(ctx.groupField, ctx?.service?.data?.data, primaryKey);
      setDataSource(toColumns(ctx.groupField, ctx?.service?.data?.data, primaryKey));
    }
    // field.loading = ctx?.service?.loading;
  }, [ctx?.service?.loading]);
  return {
    setDataSource,
    dataSource,
    groupField: ctx.groupField,
    disableCardDrag: useDisableCardDrag(),
    async onCardDragEnd({ columns, groupField }, { fromColumnId, fromPosition }, { toColumnId, toPosition }) {
      const sourceColumn = columns.find((column) => column.id === fromColumnId);
      const destinationColumn = columns.find((column) => column.id === toColumnId);
      const sourceCard = sourceColumn?.cards?.[fromPosition];
      const targetCard = destinationColumn?.cards?.[toPosition];
      const values = {
        sourceId: sourceCard.id,
        sortField: ctx?.sortField || `${groupField.name}_sort`,
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
