/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { GeneralField, Query } from '@formily/core';
import { ISchema, Schema, SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { useUpdate } from 'ahooks';
import { message } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import get from 'lodash/get';
import set from 'lodash/set';
import React, { ComponentType, useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { APIClient, useAPIClient } from '../../api-client';
import { useRefreshComponent, useRefreshFieldSchema } from '../../formily/NocoBaseRecursionField';
import { LAZY_COMPONENT_KEY } from '../../lazy-helper';
import { SchemaComponentContext } from '../context';
import { addAppVersion } from './addAppVersion';

// @ts-ignore
import clientPkg from '../../../package.json';
import { useMobileLayout } from '../../route-switch/antd/admin-layout';

interface CreateDesignableProps {
  current: Schema;
  model?: GeneralField;
  query?: Query;
  api?: APIClient;
  refresh?: (options?: { refreshParentSchema?: boolean }) => void;
  onSuccess?: any;
  t?: any;
  /**
   * NocoBase 系统版本
   */
  appVersion?: string;
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
  if (!s) {
    return;
  }
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
  const schema1 = { ...wrappedJson, properties: {} };
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
  /**
   * NocoBase 系统版本
   */
  appVersion: string;
  events = {};

  constructor(options: CreateDesignableProps) {
    this.options = options;
    this.current = options.current;
    this.appVersion = options.appVersion;
  }

  get model() {
    return this.options.model;
  }

  get query() {
    return this.options.query;
  }

  loadAPIClientEvents() {
    const { api, t = translate } = this.options;
    if (!api) {
      return;
    }
    const updateColumnSize = (parent: Schema) => {
      if (!parent) {
        return [];
      }
      const len = Object.values(parent.properties).length;
      const schemas = [];
      parent.mapProperties((s) => {
        s['x-component-props'] = s['x-component-props'] || {};
        s['x-component-props']['width'] = 100 / len;
        if (s['x-uid']) {
          schemas.push({
            'x-uid': s['x-uid'],
            'x-component-props': s['x-component-props'],
          });
        }
      });
      if (parent['x-uid'] && schemas.length) {
        return schemas;
      }
      return [];
    };
    this.on('insertAdjacent', async ({ onSuccess, current, position, schema, wrap, wrapped, removed }) => {
      let schemas = [];
      if (wrapped?.['x-component'] === 'Grid.Col') {
        schemas = schemas.concat(updateColumnSize(wrapped.parent));
      }
      if (removed?.['x-component'] === 'Grid.Col') {
        schemas = schemas.concat(updateColumnSize(removed.parent));
      }
      this.refresh();
      if (!current['x-uid']) {
        return;
      }
      const res = await api.request({
        url: `/uiSchemas:insertAdjacent/${current['x-uid']}?position=${position}`,
        method: 'post',
        data: {
          schema: addAppVersion(schema, this.appVersion),
          wrap,
        },
      });
      if (schemas.length) {
        await api.request({
          url: `/uiSchemas:batchPatch`,
          method: 'post',
          data: schemas,
        });
      }
      if (removed?.['x-uid']) {
        await api.request({
          url: `/uiSchemas:remove/${removed['x-uid']}`,
          method: 'post',
        });
      }
      onSuccess?.(res?.data?.data);
      message.success(t('Saved successfully'), 0.2);
    });
    this.on('patch', async ({ schema }) => {
      this.refresh();
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
    this.on('initializeActionContext', async ({ schema }) => {
      if (!schema?.['x-uid']) {
        return;
      }
      await api.request({
        url: `/uiSchemas:initializeActionContext`,
        method: 'post',
        data: {
          ...schema,
        },
      });
    });
    this.on('batchPatch', async ({ schemas }) => {
      this.refresh();
      await api.request({
        url: `/uiSchemas:batchPatch`,
        method: 'post',
        data: schemas,
      });
      message.success(t('Saved successfully'), 0.2);
    });
    this.on('remove', async ({ removed }) => {
      let schemas = [];
      if (removed?.['x-component'] === 'Grid.Col') {
        schemas = updateColumnSize(removed.parent);
      }
      this.refresh();
      if (!removed?.['x-uid']) {
        return;
      }
      await api.request({
        url: `/uiSchemas:remove/${removed['x-uid']}`,
        method: 'post',
      });
      if (schemas.length) {
        await api.request({
          url: `/uiSchemas:batchPatch`,
          method: 'post',
          data: schemas,
        });
      }
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

  on(name: 'insertAdjacent' | 'remove' | 'error' | 'patch' | 'batchPatch' | 'initializeActionContext', listener: any) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    this.events[name].push(listener);
  }

  async emit(
    name: 'insertAdjacent' | 'remove' | 'error' | 'patch' | 'batchPatch' | 'initializeActionContext',
    ...args
  ) {
    if (!this.events[name]) {
      return;
    }
    const [opts, ...others] = args;
    return Promise.all(this.events[name].map((fn) => fn.bind(this)({ current: this.current, ...opts }, ...others)));
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

  refresh(options?: { refreshParentSchema?: boolean }) {
    const { refresh } = this.options;
    return refresh?.(options);
  }

  deepMerge(schema: ISchema) {
    const replaceKeys = {
      title: 'title',
      description: 'description',
      default: 'initialValue',
      readOnly: 'readOnly',
      writeOnly: 'editable',
      enum: 'dataSource',
      'x-pattern': 'pattern',
      'x-display': 'display',
      'x-validator': 'validator',
      'x-decorator': 'decorator',
      'x-component': 'component',
      'x-reactions': 'reactions',
      'x-content': 'content',
      'x-visible': 'visible',
      'x-hidden': 'hidden',
      'x-disabled': 'disabled',
      'x-editable': 'editable',
      'x-read-only': 'readOnly',
    };

    const mergeKeys = {
      'x-decorator-props': 'decoratorProps',
      'x-component-props': 'componentProps',
      'x-data': 'data',
    };

    Object.keys(schema).forEach((key) => {
      if (replaceKeys[key]) {
        this.current[key] = schema[key];
        this.updateModel(replaceKeys[key], schema[key]);
      } else if (mergeKeys[key]) {
        Object.keys(schema[key]).forEach((key2) => {
          set(this.current, [key, key2], schema[key][key2]);
          this.updateModel([mergeKeys[key], key2], schema[key][key2]);
        });
      } else {
        this.current[key] = schema[key];
      }
    });

    this.emit('patch', { schema });
  }

  getSchemaAttribute(key: string | string[], defaultValue?: any) {
    return get(this.current, key, defaultValue);
  }

  shallowMerge(schema: ISchema) {
    const replaceKeys = {
      title: 'title',
      description: 'description',
      default: 'initialValue',
      readOnly: 'readOnly',
      writeOnly: 'editable',
      enum: 'dataSource',
      'x-pattern': 'pattern',
      'x-display': 'display',
      'x-validator': 'validator',
      'x-decorator': 'decorator',
      'x-component': 'component',
      'x-reactions': 'reactions',
      'x-content': 'content',
      'x-visible': 'visible',
      'x-hidden': 'hidden',
      'x-disabled': 'disabled',
      'x-editable': 'editable',
      'x-read-only': 'readOnly',
      'x-decorator-props': 'decoratorProps',
      'x-component-props': 'componentProps',
      'x-data': 'data',
    };

    Object.keys(schema).forEach((key) => {
      this.current[key] = schema[key];
      if (replaceKeys[key]) {
        this.updateModel(replaceKeys[key], schema[key]);
      }
    });

    this.emit('patch', { schema });
  }

  updateModel(key: any, value: any) {
    const update = (field) => {
      set(field, key, value);
    };
    if (this.model) {
      update(this.model);
    }
    if (this.query) {
      this.query.take(update);
    }
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
    const s = schema || this.current;
    let removed = s.parent.removeProperty(s.name);
    if (removeParentsIfNoChildren) {
      const parent = this.recursiveRemoveIfNoChildren(s.parent, { breakRemoveOn });
      if (parent) {
        removed = parent;
      }
    }
    return this.emit('remove', { removed });
  }

  removeWithoutEmit(schema?: Schema, options: RemoveOptions = {}) {
    const { breakRemoveOn, removeParentsIfNoChildren } = options;
    const s = schema || this.current;
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
      wrapped,
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
      wrapped,
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
    delete schema['x-index'];
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
    return this.emit('insertAdjacent', {
      position: 'beforeEnd',
      schema: schema2,
      wrap: schema1,
      wrapped,
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
      wrapped,
      ...opts,
    });
  }
}

export function useFindComponent() {
  const schemaOptions = useContext(SchemaOptionsContext);
  const components = useMemo(() => schemaOptions?.components || {}, [schemaOptions]);
  const find = (component: string | ComponentType) => {
    if (!component) {
      return null;
    }
    if (typeof component !== 'string') {
      return component;
    }
    const res = get(components, component);
    if (!res) {
      console.error(`[nocobase]: Component "${component}" not found`);
    }
    return res;
  };

  return find;
}

// TODO
export function useDesignable() {
  const { designable, setDesignable, refresh: refreshFromContext, reset } = useContext(SchemaComponentContext);
  const schemaOptions = useContext(SchemaOptionsContext);
  const components = useMemo(() => schemaOptions?.components || {}, [schemaOptions]);
  const DesignableBar = useMemo(
    () => () => {
      return <></>;
    },
    [],
  );
  const update = useUpdate();
  const refreshFieldSchema = useRefreshFieldSchema();
  const refreshComponent = useRefreshComponent();
  const refresh = useCallback(
    (options?: { refreshParentSchema?: boolean }) => {
      refreshFromContext?.();
      // refresh current component
      update();
      // refresh fieldSchema context value
      refreshFieldSchema?.(options);
      // refresh component context value
      refreshComponent?.();
    },
    [refreshFromContext, update, refreshFieldSchema, refreshComponent],
  );
  const field = useField();
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { t } = useTranslation();
  const dn = useMemo(() => {
    return createDesignable({ t, api, refresh, current: fieldSchema, model: field, appVersion: clientPkg.version });
  }, [t, api, refresh, fieldSchema, field]);

  useEffect(() => {
    dn.loadAPIClientEvents();
  }, [dn]);

  const { isMobileLayout } = useMobileLayout();

  return {
    dn,
    designable: isMobileLayout ? false : designable,
    reset,
    refresh,
    setDesignable,
    DesignableBar,
    findComponent: useCallback(
      (component: any) => {
        if (!component) {
          return null;
        }
        if (typeof component !== 'string') {
          return component;
        }
        const c = get(components, component);
        return c?.[LAZY_COMPONENT_KEY] ?? c;
      },
      [get],
    ),
    on: dn.on.bind(dn),
    // TODO
    patch: useCallback(
      (key: ISchema | string, value?: any) => {
        const update = (obj: any) => {
          Object.keys(obj).forEach((k) => {
            const val = obj[k];
            if (k === 'title') {
              field.title = val;
              fieldSchema['title'] = val;
            }
            if (k === 'x-decorator-props') {
              if (!field.decoratorProps) {
                field.decoratorProps = {};
              }
              if (!fieldSchema['x-decorator-props']) {
                fieldSchema['x-decorator-props'] = {};
              }
              Object.keys(val).forEach((i) => {
                field.decoratorProps[i] = val[i];
                fieldSchema['x-decorator-props'][i] = val[i];
              });
            }
            if (k === 'x-component-props') {
              if (!field.componentProps) {
                field.componentProps = {};
              }
              if (!fieldSchema['x-component-props']) {
                fieldSchema['x-component-props'] = {};
              }
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
      [dn],
    ),
    shallowMerge: useCallback(
      (schema: ISchema) => {
        dn.shallowMerge(schema);
      },
      [dn],
    ),
    deepMerge: useCallback(
      (schema: ISchema) => {
        dn.deepMerge(schema);
      },
      [dn],
    ),
    remove: useCallback(
      (schema?: any, options?: RemoveOptions) => {
        dn.remove(schema, options);
      },
      [dn],
    ),
    insertAdjacent: useCallback(
      (position: Position, schema: ISchema, options?: InsertAdjacentOptions) => {
        dn.insertAdjacent(position, schema, options);
      },
      [dn],
    ),
    insertBeforeBegin: useCallback(
      (schema: ISchema) => {
        dn.insertBeforeBegin(schema);
      },
      [dn],
    ),
    insertAfterBegin: useCallback(
      (schema: ISchema) => {
        dn.insertAfterBegin(schema);
      },
      [dn],
    ),
    insertBeforeEnd: useCallback(
      (schema: ISchema) => {
        dn.insertBeforeEnd(schema);
      },
      [dn],
    ),
    insertAfterEnd: useCallback(
      (schema: ISchema) => {
        dn.insertAfterEnd(schema);
      },
      [dn],
    ),
  };
}
