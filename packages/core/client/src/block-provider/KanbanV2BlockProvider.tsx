import { createForm } from '@formily/core';
import { Schema, useField, useForm } from '@formily/react';
import { Spin } from 'antd';
import flat from 'flat';
import { isEqual, uniqBy } from 'lodash';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SchemaComponentOptions } from '../';
import { useAssociationCreateActionProps as useCAP } from '../block-provider/hooks';
import { mergeFilter } from '../block-provider/SharedFilterProvider';
import { useCollectionManager } from '../collection-manager';
import { useFilterActionProps as useFAP } from '../';
import { RecordProvider } from '../record-provider';
import { useAPIClient } from '../api-client';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';
import { mergeArrays } from '../schema-initializer/components/KanbanOptions';

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

export const KanbanCardContext = createContext<any>({});

export const KanbanCardBlockProvider = (props) => {
  const { item } = props;
  const field = useField<any>();
  const form = useMemo(
    () =>
      createForm({
        readPretty: true,
        initialValues: item,
      }),
    [item],
  );

  field.loaded = true;
  return (
    <KanbanCardContext.Provider
      value={{
        ...props,
        form,
        field,
      }}
    >
      <RecordProvider record={item || {}}>{props.children}</RecordProvider>
    </KanbanCardContext.Provider>
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

const useGroupField = (props) => {
  const { getCollectionFields } = useCollectionManager();
  const { groupField, collection } = props;
  const fields = getCollectionFields(collection);
  return fields.find((v) => v.name === groupField[0]);
};

export const KanbanV2BlockProvider = (props) => {
  const { columns } = props;
  const api = useAPIClient();
  const groupField: any = useGroupField(props);
  const [targetColumn, setTargetColumn] = useState(null);
  const [params, setParams] = useState(props.params);
  const [kanbanColumns, setKanbanColumns] = useState([]);
  useEffect(() => {
    if (isEqual(params, props.params)) {
      return;
    }
    setParams(props.params);
  }, [props.params]);

  useEffect(() => {
    if (groupField.target) {
      const enableColumns = columns?.filter((v) => v.enabled) || [];
      const resource = api.resource(groupField.target);
      // eslint-disable-next-line promise/catch-or-return
      resource.list({ paginate: false }).then(({ data }) => {
        const optionsData = uniqBy(data?.data, props.groupField[1]).map((v: any) => {
          return {
            ...v,
            value: v[props.groupField[1]],
            label: v[props.groupField[1]],
          };
        });
        const result = mergeArrays(enableColumns, optionsData);
        result.push({
          value: '__unknown__',
          label: 'Unknown',
          color: 'default',
          cards: null,
        });
        setKanbanColumns(result);
      });
    } else {
      const enableColumns = columns?.filter((v) => v.enabled) || [];
      setKanbanColumns(
        enableColumns.concat([
          {
            value: '__unknown__',
            label: 'Unknown',
            color: 'default',
            cards: null,
          },
        ]),
      );
    }
  }, [groupField]);

  if (!groupField) {
    return null;
  }
  const useCreateActionProps = () => {
    const form = useForm();
    const { onClick } = useCAP();
    const values = flat(form.values);
    return {
      async onClick() {
        await onClick();
        const targetKey = props.groupField.join('.');
        const target = values[targetKey] || '__unknown__';
        setTargetColumn(target);
      },
    };
  };

  const useFilterActionProps = () => {
    const { options } = useFAP();
    return {
      options,
      onSubmit: (values) => {
        setParams({
          ...params,
          filter: mergeFilter([params.filter, values?.filter]),
        });
      },
      onReset: () => {
        setParams({
          ...params,
          filter: mergeFilter([params.filter]),
        });
      },
    };
  };

  return (
    <SchemaComponentOptions scope={{ useCreateActionProps, useFilterActionProps }}>
      <BlockProvider {...props} params={params} requestOptions={{ manual: true }}>
        {kanbanColumns.length > 0 && (
          <InternalKanbanV2BlockProvider
            {...props}
            params={params}
            groupField={groupField}
            associateCollectionField={props.groupField}
            columns={kanbanColumns}
            targetColumn={targetColumn}
            setTargetColumn={setTargetColumn}
          />
        )}
      </BlockProvider>
    </SchemaComponentOptions>
  );
};

export const useKanbanV2BlockContext = () => {
  return useContext(KanbanV2BlockContext);
};

export const useKanbanV2BlockProps = () => {
  const ctx = useKanbanV2BlockContext();
  const field: any = useField();
  const { columns } = ctx;
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = ctx?.service?.data?.data;
      // eslint-disable-next-line promise/catch-or-return
      ctx.form?.reset().then(() => {
        ctx.form.setValues(ctx.service?.data?.data?.[0] || {});
      });
    }
  }, [ctx?.service?.loading]);
  return {
    columns: columns,
    groupField: ctx.groupField,
    form: ctx.form,
  };
};
