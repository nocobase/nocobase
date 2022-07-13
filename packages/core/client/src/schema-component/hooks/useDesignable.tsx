import { ISchema, Schema, SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { message } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { APIClient, useAPIClient } from '../../api-client';
import { SchemaComponentContext } from '../context';

interface CreateDesignableProps {
  current: Schema;
  api?: APIClient;
  refresh?: () => void;
  onSuccess?: any;
  i18n?: any;
  t?: any;
}

export function createDesignable(options: CreateDesignableProps) {
  return new Designable(options);
}

/**
 *
 */
type Position = 'beforeBegin' | 'afterBegin' | 'beforeEnd' | 'afterEnd';

interface InsertAdjacentOptions {
  wrap?: (s: ISchema) => ISchema;
  removeParentsIfNoChildren?: boolean;
  breakRemoveOn?: ISchema | BreakFn;
  onSuccess?: any;
}

type BreakFn = (s: ISchema) => boolean;

interface RemoveOptions {
  removeParentsIfNoChildren?: boolean;
  breakRemoveOn?: ISchema | BreakFn;
}

interface RecursiveRemoveOptions {
  breakRemoveOn?: ISchema | BreakFn;
}

const generateUid = (s: ISchema) => {
  if (!s['x-uid']) {
    s['x-uid'] = uid();
  }
  Object.keys(s.properties || {}).forEach((key) => {
    generateUid(s.properties[key]);
  });
};

const defaultWrap = (s: ISchema) => s;

const matchSchema = (source: ISchema, target: ISchema) => {
  if (!source || !target) {
    return;
  }
  for (const key in target) {
    if (Object.prototype.hasOwnProperty.call(target, key)) {
      const value = target[key];
      if (value !== source?.[key]) {
        return false;
      }
    }
  }
  return true;
};

export const splitWrapSchema = (wrapped: Schema, schema: ISchema) => {
  if (wrapped['x-uid'] && wrapped['x-uid'] === schema['x-uid']) {
    return [null, wrapped.toJSON()];
  }
  const wrappedJson: ISchema = wrapped.toJSON();
  let schema1 = { ...wrappedJson, properties: {} };
  let schema2 = null;
  const findSchema = (properties, parent) => {
    Object.keys(properties || {}).forEach((key) => {
      const current = properties[key];
      if (current['x-uid'] === schema['x-uid']) {
        schema2 = properties[key];
        return;
      } else {
        parent.properties[key] = { ...current, properties: {} };
        findSchema(current?.properties, parent.properties[key]);
      }
    });
  };
  findSchema(wrappedJson.properties, schema1);
  return [schema1, schema2];
};

const translate = (v?: any) => v;

export class Designable {
  current: Schema;
  options: CreateDesignableProps;
  events = {};

  constructor(options: CreateDesignableProps) {
    this.options = options;
    this.current = options.current;
  }

  loadAPIClientEvents() {
    const { refresh, api, t = translate } = this.options;
    if (!api) {
      return;
    }
    this.on('insertAdjacent', async ({ onSuccess, current, position, schema, wrap, removed }) => {
      refresh();
      if (!current['x-uid']) {
        return;
      }
      await api.request({
        url: `/uiSchemas:insertAdjacent/${current['x-uid']}?position=${position}`,
        method: 'post',
        data: {
          schema,
          wrap,
        },
      });
      if (removed?.['x-uid']) {
        await api.request({
          url: `/uiSchemas:remove/${removed['x-uid']}`,
          method: 'post',
        });
      }
      onSuccess?.();
      message.success(t('Saved successfully'), 0.2);
    });
    this.on('patch', async ({ schema }) => {
      refresh();
      if (!schema?.['x-uid']) {
        return;
      }
      await api.request({
        url: `/uiSchemas:patch`,
        method: 'post',
        data: {
          ...schema,
        },
      });
      message.success(t('Saved successfully'), 0.2);
    });
    this.on('remove', async ({ removed }) => {
      refresh();
      if (!removed?.['x-uid']) {
        return;
      }
      await api.request({
        url: `/uiSchemas:remove/${removed['x-uid']}`,
        method: 'post',
      });
      message.success(t('Saved successfully'), 0.2);
    });
  }

  prepareProperty(schema: ISchema) {
    if (!schema.type) {
      schema.type = 'void';
    }
    if (!schema.name) {
      schema.name = uid();
    }
    // x-uid 仅用于后端查询 schema，如果 current 没有 x-uid 不处理
    if (!this.current['x-uid']) {
      return;
    }
    // if (Schema.isSchemaInstance(schema)) {
    //   return;
    // }
    generateUid(schema);
  }

  on(name: 'insertAdjacent' | 'remove' | 'error' | 'patch', listener: any) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    this.events[name].push(listener);
  }

  emit(name: 'insertAdjacent' | 'remove' | 'error' | 'patch', ...args) {
    if (!this.events[name]) {
      return;
    }
    const [opts, ...others] = args;
    this.events[name].forEach((fn) => fn.bind(this)({ current: this.current, ...opts }, ...others));
  }

  parentsIn(schema: Schema) {
    if (!schema) {
      return false;
    }
    if (!Schema.isSchemaInstance(schema)) {
      return false;
    }
    let s = this.current;
    while (s?.parent) {
      if (s.parent === schema) {
        return true;
      }
      s = s.parent;
    }
    return false;
  }

  refresh() {
    const { refresh } = this.options;
    return refresh?.();
  }

  insertAdjacent(position: Position, schema: ISchema, options: InsertAdjacentOptions = {}) {
    switch (position) {
      case 'beforeBegin':
        return this.insertBeforeBegin(schema, options);
      case 'afterBegin':
        return this.insertAfterBegin(schema, options);
      case 'beforeEnd':
        return this.insertBeforeEnd(schema, options);
      case 'afterEnd':
        return this.insertAfterEnd(schema, options);
    }
  }

  recursiveRemoveIfNoChildren(schema?: Schema, options?: RecursiveRemoveOptions) {
    if (!schema) {
      return;
    }
    let s = schema;
    let removed: Schema;
    const breakRemoveOn = options?.breakRemoveOn;
    while (s) {
      if (typeof breakRemoveOn === 'function') {
        if (breakRemoveOn(s)) {
          break;
        }
      } else {
        if (matchSchema(s, breakRemoveOn)) {
          break;
        }
      }
      const count = Object.keys(s.properties || {}).length;
      if (count > 0) {
        break;
      }
      if (s.parent) {
        removed = s.parent.removeProperty(s.name);
      }
      s = s.parent;
    }
    return removed;
  }

  remove(schema?: Schema, options: RemoveOptions = {}) {
    const { breakRemoveOn, removeParentsIfNoChildren } = options;
    let s = schema || this.current;
    let removed = s.parent.removeProperty(s.name);
    if (removeParentsIfNoChildren) {
      const parent = this.recursiveRemoveIfNoChildren(s.parent, { breakRemoveOn });
      if (parent) {
        removed = parent;
      }
    }
    this.emit('remove', { removed });
  }

  removeWithoutEmit(schema?: Schema, options: RemoveOptions = {}) {
    const { breakRemoveOn, removeParentsIfNoChildren } = options;
    let s = schema || this.current;
    let removed = s.parent.removeProperty(s.name);
    if (removeParentsIfNoChildren) {
      const parent = this.recursiveRemoveIfNoChildren(s.parent, { breakRemoveOn });
      if (parent) {
        removed = parent;
      }
    }
    return removed;
  }

  insertBeforeBeginOrAfterEnd(schema: ISchema, options: InsertAdjacentOptions = {}) {
    if (!Schema.isSchemaInstance(this.current)) {
      return;
    }
    if (!Schema.isSchemaInstance(schema)) {
      return;
    }
    if (this.current.parent !== schema.parent) {
      return;
    }
    let fromIndex = 0;
    let toIndex = 0;
    this.current.parent.mapProperties((property, key, index) => {
      if (this.current.name === key) {
        toIndex = index;
      }
      if (schema.name === key) {
        fromIndex = index;
      }
    });
    return fromIndex > toIndex ? this.insertBeforeBegin(schema, options) : this.insertAfterEnd(schema, options);
  }

  /**
   * Before the current schema itself.
   */
  insertBeforeBegin(schema: ISchema, options: InsertAdjacentOptions = {}) {
    if (!Schema.isSchemaInstance(this.current)) {
      return;
    }
    const opts = { onSuccess: options.onSuccess };
    const { wrap = defaultWrap, breakRemoveOn, removeParentsIfNoChildren } = options;
    if (Schema.isSchemaInstance(schema)) {
      if (this.parentsIn(schema)) {
        this.emit('error', {
          code: 'parent_is_not_allowed',
          schema,
        });
        return;
      }
      schema.parent.removeProperty(schema.name);
      if (removeParentsIfNoChildren) {
        opts['removed'] = this.recursiveRemoveIfNoChildren(schema.parent, { breakRemoveOn });
      }
    } else if (schema) {
      schema = cloneDeep(schema);
    }
    const properties = {};
    let start = false;
    let order = 0;
    let newOrder = 0;
    this.current.parent.mapProperties((property, key) => {
      if (key === this.current.name) {
        newOrder = order;
        start = true;
        ++order;
      }
      property['x-index'] = order;
      ++order;
      if (start) {
        properties[key] = property;
        this.current.parent.removeProperty(key);
      }
    });
    this.prepareProperty(schema);
    const wrapped = wrap(schema);
    const s = this.current.parent.addProperty(wrapped.name || uid(), wrapped);
    s['x-index'] = newOrder;
    s.parent = this.current.parent;
    this.current.parent.setProperties(properties);
    const [schema1, schema2] = splitWrapSchema(s, schema);
    this.emit('insertAdjacent', {
      position: 'beforeBegin',
      schema: schema2,
      wrap: schema1,
      ...opts,
    });
  }

  /**
   * Just inside the current schema, before its first child.
   *
   * @param schema
   * @returns
   */
  insertAfterBegin(schema: ISchema, options: InsertAdjacentOptions = {}) {
    if (!Schema.isSchemaInstance(this.current)) {
      return;
    }
    const opts = { onSuccess: options.onSuccess };
    const { wrap = defaultWrap, breakRemoveOn, removeParentsIfNoChildren } = options;
    if (Schema.isSchemaInstance(schema)) {
      if (this.parentsIn(schema)) {
        this.emit('error', {
          code: 'parent_is_not_allowed',
          schema,
        });
        return;
      }
      schema.parent.removeProperty(schema.name);
      if (removeParentsIfNoChildren) {
        opts['removed'] = this.recursiveRemoveIfNoChildren(schema.parent, { breakRemoveOn });
      }
    } else if (schema) {
      schema = cloneDeep(schema);
    }
    const properties = {};
    let order = 1;
    this.current.mapProperties((s, key) => {
      s['x-index'] = order;
      ++order;
      properties[key] = s;
    });
    this.current.properties = {};
    this.prepareProperty(schema);
    const wrapped = wrap(schema);
    const s = this.current.addProperty(wrapped.name || uid(), wrapped);
    s['x-index'] = 0;
    s.parent = this.current;
    this.current.setProperties(properties);
    const [schema1, schema2] = splitWrapSchema(s, schema);
    this.emit('insertAdjacent', {
      position: 'afterBegin',
      schema: schema2,
      wrap: schema1,
      ...opts,
    });
  }

  /**
   * Just inside the targetElement, after its last child.
   *
   * @param schema
   * @returns
   */
  insertBeforeEnd(schema: ISchema, options: InsertAdjacentOptions = {}) {
    if (!Schema.isSchemaInstance(this.current)) {
      return;
    }
    const opts = { onSuccess: options.onSuccess };
    const { wrap = defaultWrap, breakRemoveOn, removeParentsIfNoChildren } = options;
    if (Schema.isSchemaInstance(schema)) {
      if (this.parentsIn(schema)) {
        this.emit('error', {
          code: 'parent_is_not_allowed',
          schema,
        });
        return;
      }
      schema.parent.removeProperty(schema.name);
      if (removeParentsIfNoChildren) {
        opts['removed'] = this.recursiveRemoveIfNoChildren(schema.parent, { breakRemoveOn });
      }
    } else if (schema) {
      schema = cloneDeep(schema);
    }
    this.prepareProperty(schema);
    const wrapped = wrap(schema);
    const s = this.current.addProperty(wrapped.name || uid(), wrapped);
    s.parent = this.current;
    const [schema1, schema2] = splitWrapSchema(s, schema);
    this.emit('insertAdjacent', {
      position: 'beforeEnd',
      schema: schema2,
      wrap: schema1,
      ...opts,
    });
  }

  /**
   * After the current schema itself.
   */
  insertAfterEnd(schema: ISchema, options: InsertAdjacentOptions = {}) {
    if (!Schema.isSchemaInstance(this.current)) {
      return;
    }
    const opts = { onSuccess: options?.onSuccess };
    const { wrap = defaultWrap, breakRemoveOn, removeParentsIfNoChildren } = options;

    let order = 0;
    let newOrder = 0;
    let start = false;
    const properties = {};

    this.current.parent.mapProperties((property, key) => {
      property['x-index'] = order;
      if (key === this.current.name) {
        ++order;
        newOrder = order;
        start = true;
      }
      ++order;
      if (start && key !== this.current.name) {
        properties[key] = property;
        this.current.parent.removeProperty(key);
      }
    });

    if (Schema.isSchemaInstance(schema)) {
      if (this.parentsIn(schema)) {
        this.emit('error', {
          code: 'parent_is_not_allowed',
          schema,
        });
        return;
      }
      schema.parent.removeProperty(schema.name);
      if (removeParentsIfNoChildren) {
        opts['removed'] = this.recursiveRemoveIfNoChildren(schema.parent, { breakRemoveOn });
      }
      schema.parent = null;
    } else if (schema) {
      schema = cloneDeep(schema);
    }

    this.prepareProperty(schema);
    const wrapped = wrap(schema);
    const s = this.current.parent.addProperty(wrapped.name || uid(), wrapped);
    s.parent = this.current.parent;
    s['x-index'] = newOrder;
    this.current.parent.setProperties(properties);
    const [schema1, schema2] = splitWrapSchema(s, schema);
    this.emit('insertAdjacent', {
      position: 'afterEnd',
      schema: schema2,
      wrap: schema1,
      ...opts,
    });
  }
}

// TODO
export function useDesignable() {
  const { designable, setDesignable, refresh, reset } = useContext(SchemaComponentContext);
  const { components } = useContext(SchemaOptionsContext);
  const DesignableBar = () => {
    return <></>;
  };
  const field = useField();
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { t } = useTranslation();
  const dn = createDesignable({ t, api, refresh, current: fieldSchema });
  dn.loadAPIClientEvents();
  return {
    dn,
    designable,
    reset,
    refresh,
    setDesignable,
    DesignableBar,
    findComponent(component: any) {
      if (!component) {
        return null;
      }
      if (typeof component !== 'string') {
        return component;
      }
      return get(components, component);
    },
    on: dn.on.bind(dn),
    // TODO
    patch: (key: ISchema | string, value?: any) => {
      const update = (obj: any) => {
        Object.keys(obj).forEach((k) => {
          const val = obj[k];
          if (k === 'title') {
            field.title = val;
            fieldSchema['title'] = val;
          }
          if (k === 'x-component-props') {
            Object.keys(val).forEach((i) => {
              field.componentProps[i] = val[i];
              fieldSchema['x-component-props'][i] = val[i];
            });
          }
        });
      };
      if (typeof key === 'string') {
        const obj = {};
        set(obj, key, value);
        return update(obj);
      }
      update(key);
      refresh();
    },
    remove(schema?: any, options?: RemoveOptions) {
      dn.remove(schema, options);
    },
    insertAdjacent(position: Position, schema: ISchema, options?: InsertAdjacentOptions) {
      dn.insertAdjacent(position, schema, options);
    },
    insertBeforeBegin(schema: ISchema) {
      dn.insertBeforeBegin(schema);
    },
    insertAfterBegin(schema: ISchema) {
      dn.insertAfterBegin(schema);
    },
    insertBeforeEnd(schema: ISchema) {
      dn.insertBeforeEnd(schema);
    },
    insertAfterEnd(schema: ISchema) {
      dn.insertAfterEnd(schema);
    },
  };
}
