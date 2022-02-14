import { ISchema, Schema, SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import get from 'lodash/get';
import set from 'lodash/set';
import React, { useContext } from 'react';
import { useAPIClient } from '../../api-client';
import { SchemaComponentContext } from '../context';

interface CreateDesignableProps {
  current: Schema;
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
}

type BreakFn = (s: ISchema) => boolean;

interface RemoveOptions {
  removeParentsIfNoChildren?: boolean;
  breakSchema?: ISchema | BreakFn;
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

export class Designable {
  current: Schema;

  events = {};

  constructor({ current }) {
    this.current = current;
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

  on(name: 'afterInsertAdjacent' | 'afterRemove', listener: any) {
    if (!this.events[name]) {
      this.events[name] = [];
    }
    this.events[name].push(listener);
  }

  emit(name: 'afterInsertAdjacent' | 'afterRemove', ...args) {
    if (!this.events[name]) {
      return;
    }
    this.events[name].forEach((fn) => fn.bind(this)(this.current, ...args));
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

  removeIfNoChildren(schema?: Schema) {
    if (!schema) {
      return;
    }
    let s = schema;
    const count = Object.keys(s.properties || {}).length;
    if (count > 0) {
      return;
    }
    let removed: Schema;
    while (s.parent) {
      removed = s.parent.removeProperty(s.name);
      const count = Object.keys(s.parent.properties || {}).length;
      if (count > 0) {
        break;
      }
      s = s.parent;
    }
    return removed;
  }

  remove(schema?: Schema, options: RemoveOptions = {}) {
    const { removeParentsIfNoChildren, breakSchema } = options;
    let s = schema || this.current;
    let removed;
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
    while (s.parent) {
      removed = s.parent.removeProperty(s.name);
      if (!removeParentsIfNoChildren) {
        break;
      }
      if (typeof breakSchema === 'function') {
        if (breakSchema(s?.parent)) {
          break;
        }
      } else {
        if (matchSchema(s?.parent, breakSchema)) {
          break;
        }
      }
      if (s?.parent?.['x-component'] === breakSchema) {
        break;
      }
      const count = Object.keys(s.parent.properties || {}).length;
      if (count > 0) {
        break;
      }
      s = s.parent;
    }
    this.emit('afterRemove', removed, options);
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
    const opts = {};
    const { wrap = defaultWrap, removeParentsIfNoChildren } = options;
    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      if (removeParentsIfNoChildren) {
        opts['removed'] = this.removeIfNoChildren(schema.parent);
      }
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
    this.emit('afterInsertAdjacent', 'beforeBegin', s, opts);
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
    const opts = {};
    const { wrap = defaultWrap, removeParentsIfNoChildren } = options;
    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      if (removeParentsIfNoChildren) {
        opts['removed'] = this.removeIfNoChildren(schema.parent);
      }
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
    this.emit('afterInsertAdjacent', 'afterBegin', s, opts);
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
    const opts = {};
    const { wrap = defaultWrap, removeParentsIfNoChildren } = options;
    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      if (removeParentsIfNoChildren) {
        opts['removed'] = this.removeIfNoChildren(schema.parent);
      }
    }
    this.prepareProperty(schema);
    const wrapped = wrap(schema);
    const s = this.current.addProperty(wrapped.name || uid(), wrapped);
    s.parent = this.current;
    this.emit('afterInsertAdjacent', 'beforeEnd', s, opts);
  }

  /**
   * After the current schema itself.
   */
  insertAfterEnd(schema: ISchema, options: InsertAdjacentOptions = {}) {
    if (!Schema.isSchemaInstance(this.current)) {
      return;
    }
    const opts = {};
    const { wrap = defaultWrap, removeParentsIfNoChildren } = options;
    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      if (removeParentsIfNoChildren) {
        opts['removed'] = this.removeIfNoChildren(schema.parent);
      }
      schema.parent = null;
    }

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

    this.prepareProperty(schema);
    const wrapped = wrap(schema);
    const s = this.current.parent.addProperty(wrapped.name || uid(), wrapped);
    s.parent = this.current.parent;
    s['x-index'] = newOrder;
    this.current.parent.setProperties(properties);
    this.emit('afterInsertAdjacent', 'afterEnd', s, opts);
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
  const dn = createDesignable({ current: fieldSchema });
  const api = useAPIClient();
  dn.on('afterInsertAdjacent', async (current, position, schema) => {
    refresh();
    // await api.request({
    //   url: `/ui_schemas:insertAdjacent/${current['x-uid']}?position=${position}`,
    //   method: 'post',
    //   data: schema.toJSON(),
    // });
    // console.log(current, position, schema);
  });
  dn.on('afterRemove', refresh);
  return {
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
    remove(schema: any, options?: RemoveOptions) {
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
