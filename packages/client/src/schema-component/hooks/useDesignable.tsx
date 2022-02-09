import { ISchema, Schema, SchemaOptionsContext, useField, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import get from 'lodash/get';
import set from 'lodash/set';
import React, { useContext } from 'react';
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
  removeEmptyParents?: boolean;
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
    this.events[name].forEach((fn) => fn.bind(this)(...args));
  }

  insertAdjacent(position: Position, schema: ISchema, options: InsertAdjacentOptions = {}) {
    debugger;
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

  removeIfChildrenEmpty(schema?: Schema) {
    if (!schema) {
      return;
    }
    let s = schema;
    const count = Object.keys(s.properties || {}).length;
    console.log('removeIfChildrenEmpty', count, s.properties);
    if (count > 0) {
      return;
    }
    let removed;
    while (s.parent) {
      removed = s.parent.removeProperty(s.name);
      const count = Object.keys(s.parent.properties || {}).length;
      if (count > 0) {
        break;
      }
      s = s.parent;
    }
  }

  remove(schema?: Schema, options: { removeEmptyParents?: boolean } = {}) {
    const { removeEmptyParents } = options;
    let s = schema || this.current;
    debugger;
    let removed;
    while (s.parent) {
      removed = s.parent.removeProperty(s.name);
      if (!removeEmptyParents) {
        break;
      }
      const count = Object.keys(s.parent.properties || {}).length;
      if (count > 0) {
        break;
      }
      s = s.parent;
    }
    this.emit('afterRemove', removed);
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
    const { wrap = defaultWrap, removeEmptyParents } = options;
    const properties = {};
    let start = false;

    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      if (removeEmptyParents) {
        this.removeIfChildrenEmpty(schema.parent);
      }
    }

    this.current.parent.mapProperties((property, key) => {
      if (key === this.current.name) {
        start = true;
      }
      if (start) {
        properties[key] = property;
        this.current.parent.removeProperty(key);
      }
    });

    this.prepareProperty(schema);
    const wrapped = wrap(schema);
    const s = this.current.parent.addProperty(wrapped.name, wrapped);
    s.parent = this.current.parent;
    this.current.parent.setProperties(properties);
    this.emit('afterInsertAdjacent', 'beforeBegin', s);
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
    const { wrap = defaultWrap, removeEmptyParents } = options;
    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      if (removeEmptyParents) {
        this.removeIfChildrenEmpty(schema.parent);
      }
    }
    const properties = {};
    this.current.mapProperties((schema, key) => {
      properties[key] = schema;
    });
    this.current.properties = {};
    this.prepareProperty(schema);
    const wrapped = wrap(schema);
    const s = this.current.addProperty(wrapped.name, wrapped);
    s.parent = this.current;
    this.current.setProperties(properties);
    this.emit('afterInsertAdjacent', 'afterBegin', s);
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
    const { wrap = defaultWrap, removeEmptyParents } = options;
    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      if (removeEmptyParents) {
        this.removeIfChildrenEmpty(schema.parent);
      }
    }
    this.prepareProperty(schema);
    const wrapped = wrap(schema);
    const s = this.current.addProperty(wrapped.name || uid(), wrapped);
    s.parent = this.current;
    this.emit('afterInsertAdjacent', 'beforeEnd', s);
  }

  /**
   * After the current schema itself.
   */
  insertAfterEnd(schema: ISchema, options: InsertAdjacentOptions = {}) {
    if (!Schema.isSchemaInstance(this.current)) {
      return;
    }
    const properties = {};
    let start = false;
    const { wrap = defaultWrap, removeEmptyParents } = options;
    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      console.log('insertAfterEnd', removeEmptyParents);
      if (removeEmptyParents) {
        this.removeIfChildrenEmpty(schema.parent);
      }
      schema.parent = null;
    }

    this.current.parent.mapProperties((property, key) => {
      if (key === this.current.name) {
        start = true;
      }
      if (start && key !== this.current.name) {
        properties[key] = property;
        this.current.parent.removeProperty(key);
      }
    });

    this.prepareProperty(schema);

    const wrapped = wrap(schema);

    const s = this.current.parent.addProperty(wrapped.name || uid(), wrapped);
    s.parent = this.current.parent;
    this.current.parent.setProperties(properties);
    this.emit('afterInsertAdjacent', 'afterEnd', s);
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
  dn.on('afterInsertAdjacent', refresh);
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
    remove(schema: any, options?: any) {
      dn.remove(schema, options);
    },
    insertAdjacent(position: Position, schema: ISchema, options: InsertAdjacentOptions = {}) {
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
