import { createForm } from '@formily/core';
import { Spin } from 'antd';
import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { Schema, useField, useFieldSchema } from '@formily/react';
import uniq from 'lodash/uniq';
import { useCollection, useCollectionManager } from '../collection-manager';
import { RecordProvider } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { isAssocField } from '../filter-provider/utils';

export const KanbanV2BlockContext = createContext<any>({});

const InternalKanbanV2BlockProvider = (props) => {
  const { action, readPretty } = props;
  const field = useField<any>();
  const form = useMemo(
    () =>
      createForm({
        readPretty,
      }),
    [],
  );
  const { resource, service } = useBlockRequestContext();
  if (service.loading && !field.loaded) {
    return <Spin />;
  }
  field.loaded = true;
  return (
    <KanbanV2BlockContext.Provider
      value={{
        ...props,
        action,
        form,
        field,
        service,
        resource,
      }}
    >
      <RecordProvider record={service?.data?.data?.[0] || {}}>{props.children}</RecordProvider>
    </KanbanV2BlockContext.Provider>
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
  const { getCollectionFields } = useCollectionManager();
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
    if (schema['x-component'].startsWith('KanbanV2')) {
      return schema;
    }
    return buf;
  }, new Schema({}));
  const gridSchema: any = kanbanSchema?.properties?.grid;
  const appends = [];
  if (gridSchema) {
    recursiveProperties(gridSchema, 'CollectionField', associationFields, appends);
  }

  return uniq(appends);
};

const useGroupField = (props) => {
  const { getCollectionFields } = useCollectionManager();
  const { groupField, collection } = props;
  const fields = getCollectionFields(collection);
  return fields.find((v) => v.name === groupField[0]);
};

export const KanbanV2BlockProvider = (props) => {
  const { columns, collection } = props;
  const params = { ...props.params };
  const appends = useAssociationNames(collection);
  const groupField: any = useGroupField(props);
  const isAssociationField = isAssocField(groupField);
  if (!groupField) {
    return null;
  }
  if (isAssociationField) {
    params['filter'] = {
      $and: [{ [groupField.name]: { id: { $notExists: true } } }],
    };
  } else {
    params['filter'] = {
      $and: [{ [groupField.name]: { $empty: true } }],
    };
  }
  if (!Object.keys(params).includes('appends')) {
    params['appends'] = appends;
  }
  return (
    <BlockProvider {...props} params={params}>
      <InternalKanbanV2BlockProvider
        {...props}
        params={params}
        groupField={groupField}
        associateCollectionField={props.groupField}
        columns={columns}
      />
    </BlockProvider>
  );
};

export const useKanbanV2BlockContext = () => {
  return useContext(KanbanV2BlockContext);
};

export const useKanbanV2BlockProps = () => {
  const ctx = useKanbanV2BlockContext();
  const { columns } = ctx;
  useEffect(() => {
    if (!ctx.service.loading) {
      columns.push({
        value: '__unknown__',
        label: 'Unknnwn',
        color: 'default',
        cards: ctx?.service?.data?.data,
      });
      ctx.form.reset().then(() => {
        ctx.form.setValues(ctx.service?.data?.data?.[0] || {});
      });
    }
  }, [ctx.service.loading]);
  return {
    columns: columns,
    groupField: ctx.groupField,
    form: ctx.form,
  };
};
