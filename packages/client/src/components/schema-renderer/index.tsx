import { ArrayField, createForm } from '@formily/core';
import {
  createSchemaField,
  FormProvider,
  Schema,
  SchemaOptionsContext,
  useField,
  useFieldSchema,
  useForm,
} from '@formily/react';
import { uid } from '@formily/shared';
import constate from 'constate';
import { get } from 'lodash';
import React, { createContext } from 'react';
import { useState } from 'react';
import { useContext } from 'react';
import { useMemo } from 'react';

import { CodeOutlined } from '@ant-design/icons';
import Editor from '@monaco-editor/react';

import { ArrayItems, ArrayCollapse, FormLayout, FormItem as FormilyFormItem } from '@formily/antd';

import { Space, Card, Modal, Spin } from 'antd';
import { ArrayTable } from '../../schemas/array-table';
import { Action } from '../../schemas/action';
import { AddNew } from '../../schemas/add-new';
import { Calendar } from '../../schemas/calendar';
import { Cascader } from '../../schemas/cascader';
import { Checkbox } from '../../schemas/checkbox';
import { ColorSelect } from '../../schemas/color-select';
import { DatabaseField, DatabaseCollection } from '../../schemas/database-field';
import { DatePicker } from '../../schemas/date-picker';
import { Filter } from '../../schemas/filter';
import { Form } from '../../schemas/form';
import { ActionLogs } from '../../schemas/action-logs';
import { Grid } from '../../schemas/grid';
import { IconPicker } from '../../schemas/icon-picker';
import { Input } from '../../schemas/input';
import { InputNumber } from '../../schemas/input-number';
import { Markdown } from '../../schemas/markdown';
import { Kanban } from '../../schemas/kanban';
import { Menu } from '../../schemas/menu';
import { Password } from '../../schemas/password';
import { Radio } from '../../schemas/radio';
import { Select } from '../../schemas/select';
import { Table } from '../../schemas/table';
import { CollectionFieldContext, TableRowContext } from '../../schemas/table';
import { Tabs } from '../../schemas/tabs';
import { TimePicker } from '../../schemas/time-picker';
import { Upload } from '../../schemas/upload';
import { FormItem } from '../../schemas/form-item';
import { BlockItem } from '../../schemas/block-item';
import { CardItem } from '../../schemas/card-item';
import { DragAndDrop } from '../../schemas/drag-and-drop';
import { TreeSelect } from '../../schemas/tree-select';
import { Page } from '../../schemas/page';
import { Chart } from '../../schemas/chart';
import { useDesignableSwitchContext } from '../../constate/DesignableSwitch';
import { action } from '@formily/reactive';
import { ISchema, FormilyISchema } from '../../schemas';
import { Resource } from '../../resource';
import { useRequest } from 'ahooks';
import { CascaderOptionType } from 'antd/lib/cascader';
import { useClient, useCollectionContext, useResourceRequest } from '../../constate';
import { i18n } from '../../i18n';

export const BlockContext = createContext({ dragRef: null });

const Div = (props) => <div {...props} />;

interface DesignableContextProps {
  schema?: Schema;
  refresh?: any;
}

export const useAsyncDataSource = (service: any) => (field: any) => {
  field.loading = true;
  const disableAsyncDataSource = field.componentProps.disableAsyncDataSource;
  if (disableAsyncDataSource) {
    return;
  }
  service(field).then(
    action.bound((data: any) => {
      field.dataSource = data;
      field.loading = false;
    }),
  );
};

export const loadChinaRegionDataSource = function () {
  const resource = useResourceRequest('china_regions');
  return async (field: ArrayField) => {
    if (field.readPretty) {
      return [];
    }
    const maxLevel = field.componentProps.maxLevel || 3;
    const { data } = await resource.list({
      perPage: -1,
      filter: {
        level: 1,
      },
    });
    console.log('loadChinaRegions', data, field.value);
    return (
      data?.map((item) => {
        if (maxLevel !== 1) {
          item.isLeaf = false;
        }
        return item;
      }) || []
    );
  };
};

export const loadChinaRegionData = function () {
  const resource = useResourceRequest('china_regions');
  return (selectedOptions: CascaderOptionType[], field: ArrayField) => {
    const maxLevel = field.componentProps.maxLevel || 3;
    const targetOption = selectedOptions[selectedOptions.length - 1];
    targetOption.loading = true;
    resource
      .list({
        perPage: -1,
        filter: {
          parent_code: targetOption['code'],
        },
      })
      .then((data) => {
        targetOption.loading = false;
        targetOption.children =
          data?.data?.map((item) => {
            if (maxLevel > item.level) {
              item.isLeaf = false;
            }
            return item;
          }) || [];
        field.dataSource = [...field.dataSource];
      });
  };
};

const useChinaRegionFieldValue = (field: ArrayField) => {
  if (field.readPretty) {
    field.value = field?.value?.sort((a, b) => a.level - b.level);
  }
  console.log('useChinaRegionFieldValue', field);
};

const useAssociationResource = (options) => {
  const { schema } = useDesignable();
  const collectionField = useContext(CollectionFieldContext);
  const { collection } = useCollectionContext();
  const ctx = useContext(TableRowContext);
  const associatedIndex = ctx?.record?.id;
  console.log('useAssociationResource', collection, collectionField, schema['x-component-props']);
  const { associatedName, resourceName } = schema['x-component-props'] || {};
  const resource = useResourceRequest({
    associatedName,
    resourceName,
    associatedIndex,
  });
  const service = useRequest((params) => resource.list(params), {
    manual: schema['x-component'] === 'Form',
    formatResult: (data) => data?.data?.[0] || {},
    onSuccess: options?.onSuccess,
  });
  return { resource, service, initialValues: service.data, ...service };
};

export const SchemaField = createSchemaField({
  scope: {
    t: i18n.t.bind(i18n),
    Table,
    Calendar,
    Kanban,
    useAsyncDataSource,
    useClient,
    useResourceRequest,
    ChinaRegion: {
      useFieldValue: useChinaRegionFieldValue,
      loadData: loadChinaRegionData,
      loadDataSource: loadChinaRegionDataSource,
    },
    Select,
    Association: {
      useResource: useAssociationResource,
    },
  },
  components: {
    Card,
    Div,
    Space,
    Page,
    Chart,

    ArrayItems,
    ArrayCollapse,
    ArrayTable,
    FormLayout,
    TreeSelect,
    FormilyFormItem,

    DragAndDrop,

    BlockItem,
    CardItem,
    FormItem,

    Action,
    AddNew,
    Calendar,
    Cascader,
    Checkbox,
    ColorSelect,
    DatabaseField,
    DatabaseCollection,
    DatePicker,
    Filter,
    Form,
    Grid,
    IconPicker,
    Input,
    InputNumber,
    Kanban,
    Markdown,
    Menu,
    Password,
    Radio,
    Select,
    Table,
    Tabs,
    TimePicker,
    Upload,

    ActionLogs,
  },
});

export const DesignableContext = createContext<DesignableContextProps>({});

export function useSchema(path?: any) {
  const { schema, refresh } = useContext(DesignableContext);
  return { schema, refresh };
}

export function pathToArray(path): string[] {
  if (Array.isArray(path)) {
    return [...path];
  }

  if (typeof path === 'string') {
    return path.split('.');
  }
}

export function findPropertyByPath(schema: Schema, path?: any): Schema {
  if (!path) {
    return schema;
  }
  const arr = pathToArray(path);
  let property = schema;
  while (arr.length) {
    const name = arr.shift();
    if (!property.properties) {
      console.warn('property does not exist.');
      return null;
    }
    property = property.properties[name];
    if (!property) {
      console.warn('property does not exist.');
      return null;
    }
  }
  return property;
}

export function addPropertyBefore(target: Schema, data: ISchema | FormilyISchema) {
  Object.keys(target.parent.properties).forEach((name) => {
    if (name === target.name) {
      target.parent.addProperty(data.name, data);
    }
    const property = target.parent.properties[name];
    property.parent.removeProperty(property.name);
    target.parent.addProperty(property.name, property.toJSON());
  });
}

export function addPropertyAfter(target: Schema, data: ISchema | FormilyISchema) {
  Object.keys(target.parent.properties).forEach((name) => {
    const property = target.parent.properties[name];
    property.parent.removeProperty(property.name);
    target.parent.addProperty(property.name, property.toJSON());
    if (name === target.name) {
      target.parent.addProperty(data.name, data);
    }
  });
}

function setKeys(schema: ISchema | FormilyISchema, parentKey = null) {
  if (!schema['key']) {
    schema['key'] = uid();
  }
  if (parentKey) {
    schema['parentKey'] = parentKey;
  }
  Object.keys(schema.properties || {}).forEach((name) => {
    setKeys(schema.properties[name], schema['key']);
  });
}

export function useSchemaComponent(component: string) {
  if (!component) {
    return null;
  }
  const options = useContext(SchemaOptionsContext);
  return get(options.components, component);
}

export function useDesignable(path?: any) {
  let { designable = true } = useDesignableSwitchContext();
  const { schema = new Schema({}), refresh } = useContext(DesignableContext);
  const schemaPath = path || useSchemaPath();
  const fieldSchema = useFieldSchema();
  let current;
  let currentSchema = (current = findPropertyByPath(schema, schemaPath) || ({} as Schema));
  if (!currentSchema) {
    currentSchema = fieldSchema;
  }
  if (Object.keys(currentSchema).length === 0) {
    currentSchema = fieldSchema;
  }
  // console.log('useDesignable', { schema, schemaPath, currentSchema });
  const options = useContext(SchemaOptionsContext);
  let DesignableBar = get(options.components, currentSchema['x-designable-bar']);
  if (!designable) {
    DesignableBar = () => null;
  }
  if (!DesignableBar) {
    DesignableBar = () => null;
  }
  return {
    designable,
    root: schema,
    currentSchema: current,
    DesignableBar,
    schema: currentSchema,
    refresh,
    prepend: (property: ISchema | FormilyISchema, targetPath?: any): Schema => {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      if (!property.name) {
        property.name = uid();
      }
      if (target['key']) {
        property['parentKey'] = target['key'];
        setKeys(property);
        property['__prepend__'] = true;
        // if (!property['key']) {
        //   property['key'] = uid();
        // }
      }
      const properties = {};
      properties[property.name] = property;
      Object.keys(target.properties).forEach((name, index) => {
        const current = target.properties[name];
        current.parent.removeProperty(current.name);
        properties[current.name] = current.toJSON();
      });
      // console.log({ properties }, target.properties);
      target.setProperties(properties);
      refresh();
      return target.properties[property.name];
    },
    appendChild: (property: ISchema | FormilyISchema, targetPath?: any): Schema => {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      if (!property.name) {
        property.name = uid();
      }
      if (target['key']) {
        property['parentKey'] = target['key'];
        // if (!property['key']) {
        //   property['key'] = uid();
        // }
        setKeys(property);
      }
      target.addProperty(property.name, property);
      // BUG: 空 properties 时，addProperty 无反应。
      const tmp = { name: uid() };
      addPropertyAfter(target, tmp);
      target.parent.removeProperty(tmp.name);
      refresh();
      return target.properties[property.name];
    },
    insertAfter: (property: ISchema | FormilyISchema, targetPath?: any): Schema => {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      if (!property.name) {
        property.name = uid();
      }
      console.log('target.parentKey', target);
      if (target['parentKey']) {
        property['parentKey'] = target['parentKey'];
        setKeys(property);
        property['__insertAfter__'] = target['key'];
      }
      addPropertyAfter(target, property);
      refresh();
      return target.parent.properties[property.name];
    },
    insertBefore(property: ISchema | FormilyISchema, targetPath?: any): Schema {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      if (!property.name) {
        property.name = uid();
      }
      if (target['parentKey']) {
        property['parentKey'] = target['parentKey'];
        setKeys(property);
        property['__insertBefore__'] = target['key'];
      }
      addPropertyBefore(target, property);
      refresh();
      return target.parent.properties[property.name];
    },
    deepRemoveIfEmpty(targetPath) {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      const removed = [];
      const remove = (s: Schema) => {
        if (!s.parent) {
          return;
        }
        s.parent.removeProperty(s.name);
        removed.push(s);
        if (s['x-component'] === 'Grid.Row') {
          return;
        }
        if (Object.keys(s.parent.properties || {}).length === 0) {
          remove(s.parent);
        }
      };
      console.log({ removed });
      if (Object.keys(target.properties || {}).length === 0) {
        remove(target);
      }
      refresh();
      return removed;
    },
    deepRemove(targetPath?: any) {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      const removed = [];
      const remove = (s: Schema) => {
        if (!s.parent) {
          return;
        }
        s.parent.removeProperty(s.name);
        removed.push(s);
        if (s['x-component'] === 'Grid.Row') {
          return;
        }
        if (Object.keys(s.parent.properties || {}).length === 0) {
          remove(s.parent);
        }
      };
      console.log({ removed });
      remove(target);
      refresh();
      return removed;
    },
    remove(targetPath?: any) {
      let target = currentSchema;
      if (targetPath) {
        target = findPropertyByPath(schema, targetPath);
      }
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      target.parent.removeProperty(target.name);
      refresh();
      return target;
    },
    moveToBefore(path1, path2) {
      const source = findPropertyByPath(schema, path1);
      const property = source.toJSON() as ISchema;
      const target = findPropertyByPath(schema, path2);
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      if (!property.name) {
        property.name = uid();
      }
      if (target['parentKey']) {
        property['parentKey'] = target['parentKey'];
        setKeys(property);
        property['__insertBefore__'] = target['key'];
      }
      addPropertyBefore(target, property);
      refresh();
      return target.parent.properties[property.name];
    },
    moveToAfter(path1, path2) {
      const source = findPropertyByPath(schema, path1);
      const property = source.toJSON() as ISchema;
      const target = findPropertyByPath(schema, path2);
      if (!target) {
        console.error('target schema does not exist.');
        return;
      }
      if (!property.name) {
        property.name = uid();
      }
      if (target['parentKey']) {
        property['parentKey'] = target['parentKey'];
        setKeys(property);
        property['__insertAfter__'] = target['key'];
      }
      addPropertyAfter(target, property);

      refresh();
      return target.parent.properties[property.name];
    },
  };
}

export function getSchemaPath(schema: Schema) {
  const path = schema['x-path'] || [schema.name];
  let parent = schema.parent;
  while (parent) {
    // if (!parent.name) {
    //   break;
    // }
    if (parent['x-path']) {
      path.unshift(...parent['x-path']);
    } else if (parent.name) {
      path.unshift(parent.name);
    }
    parent = parent.parent;
  }
  // console.log('getSchemaPath', path, schema);
  return [...path];
}

export function useSchemaPath() {
  const schema = useFieldSchema();
  const path = getSchemaPath(schema);
  return [...path];
}

const FormValues = () => {
  const form = useForm();
  const [visible, setVisible] = useState(false);
  return (
    <>
      <CodeOutlined onClick={() => setVisible(true)} />
      <Modal width={'50%'} onOk={() => setVisible(false)} onCancel={() => setVisible(false)} visible={visible}>
        <Editor height="60vh" defaultLanguage="json" value={JSON.stringify(form.values, null, 2)} />
        {/* <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre> */}
      </Modal>
    </>
  );
};

const CodePreview = ({ schema }) => {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <CodeOutlined style={{ position: 'relative', zIndex: 100 }} onClick={() => setVisible(true)} />
      <Modal width={'50%'} onOk={() => setVisible(false)} onCancel={() => setVisible(false)} visible={visible}>
        <Editor height="60vh" defaultLanguage="json" value={JSON.stringify(schema.toJSON(), null, 2)} />
        {/* <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre> */}
      </Modal>
    </>
  );
};

export interface SchemaRendererProps {
  schema: Schema | ISchema | FormilyISchema;
  form?: any;
  render?: any;
  components?: any;
  scope?: any;
  debug?: boolean;
  onlyRenderProperties?: boolean;
  onRefresh?: any;
  [key: string]: any;
}

export const SchemaRenderer = (props: SchemaRendererProps) => {
  const { designable = true } = useDesignableSwitchContext();
  const [, refresh] = useState(uid());
  const form = useMemo(() => props.form || createForm(), []);
  const schema = useMemo(() => {
    if (Schema.isSchemaInstance(props.schema)) {
      return props.schema;
    }
    let s = props.schema;
    if (props.onlyRenderProperties) {
      s = {
        type: 'object',
        properties: s.properties,
      };
    } else if (s.name) {
      s = {
        type: 'object',
        properties: {
          [s.name]: s,
        },
      };
    }
    return new Schema(s);
  }, []);

  const resource = useResourceRequest('china_regions');

  const loadChinaRegionDataSource = function () {
    return async (field: ArrayField) => {
      if (field.readPretty) {
        return [];
      }
      const maxLevel = field.componentProps.maxLevel || 3;
      const { data } = await resource.list({
        perPage: -1,
        filter: {
          level: 1,
        },
      });
      console.log('loadChinaRegions', data, field.value);
      return (
        data?.map((item) => {
          if (maxLevel !== 1) {
            item.isLeaf = false;
          }
          return item;
        }) || []
      );
    };
  };

  const loadChinaRegionData = function () {
    return (selectedOptions: CascaderOptionType[], field: ArrayField) => {
      const maxLevel = field.componentProps.maxLevel || 3;
      const targetOption = selectedOptions[selectedOptions.length - 1];
      targetOption.loading = true;
      resource
        .list({
          perPage: -1,
          filter: {
            parent_code: targetOption['code'],
          },
        })
        .then((data) => {
          targetOption.loading = false;
          targetOption.children =
            data?.data?.map((item) => {
              if (maxLevel > item.level) {
                item.isLeaf = false;
              }
              return item;
            }) || [];
          field.dataSource = [...field.dataSource];
        });
    };
  };

  // useEffect(() => {
  //   refresh(uid());
  // }, [designable]);
  console.log({ designable }, 'designable');
  const defaultRender = ({ schema }) => (
    <FormProvider form={form}>
      <SchemaField
        components={props.components}
        scope={{
          ...props.scope,
          ChinaRegion: {
            useFieldValue: useChinaRegionFieldValue,
            loadData: loadChinaRegionData,
            loadDataSource: loadChinaRegionDataSource,
          },
        }}
        schema={schema}
      />
      {props.debug && <CodePreview schema={schema} />}
      {props.debug && <FormValues />}
    </FormProvider>
  );
  return (
    <DesignableContext.Provider
      value={{
        schema,
        refresh: () => {
          props.onRefresh && props.onRefresh(schema);
          refresh(uid());
        },
      }}
    >
      <DesignableContext.Consumer>{props.render || defaultRender}</DesignableContext.Consumer>
    </DesignableContext.Provider>
  );
};
