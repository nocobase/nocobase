import React, { useContext } from 'react';
import { ISchema, Schema, useField, useFieldSchema } from '@formily/react';
import { SchemaComponentContext } from '../context';
import set from 'lodash/set';
import { uid } from '@formily/shared';

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

const generateUid = (s: ISchema) => {
  if (!s['x-uid']) {
    s['x-uid'] = uid();
  }
  Object.keys(s.properties || {}).forEach((key) => {
    generateUid(s.properties[key]);
  });
};

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

  insertAdjacent(position: Position, schema: ISchema) {
    switch (position) {
      case 'beforeBegin':
        return this.insertBeforeBegin(schema);
      case 'afterBegin':
        return this.insertAfterBegin(schema);
      case 'beforeEnd':
        return this.insertBeforeEnd(schema);
      case 'afterEnd':
        return this.insertAfterEnd(schema);
    }
  }

  remove() {
    const s = this.current.parent.removeProperty(this.current.name);
    this.emit('afterRemove', s);
  }

  insertBeforeBeginOrAfterEnd(schema: ISchema) {
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
    return fromIndex > toIndex ? this.insertBeforeBegin(schema) : this.insertAfterEnd(schema);
  }

  /**
   * Before the current schema itself.
   */
  insertBeforeBegin(schema: ISchema) {
    if (!Schema.isSchemaInstance(this.current)) {
      return;
    }
    const properties = {};
    let start = false;

    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      schema.parent = this.current.parent;
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
    const s = this.current.parent.addProperty(schema.name, schema);
    this.current.parent.setProperties(properties);
    this.emit('afterInsertAdjacent', 'beforeBegin', s);
  }

  /**
   * Just inside the current schema, before its first child.
   *
   * @param schema
   * @returns
   */
  insertAfterBegin(schema: ISchema) {
    if (!Schema.isSchemaInstance(this.current)) {
      return;
    }
    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      schema.parent = this.current;
    }
    const properties = {};
    this.current.mapProperties((schema, key) => {
      properties[key] = schema;
    });
    this.current.properties = {};
    this.prepareProperty(schema);
    const s = this.current.addProperty(schema.name, schema);
    this.current.setProperties(properties);
    this.emit('afterInsertAdjacent', 'afterBegin', s);
  }

  /**
   * Just inside the targetElement, after its last child.
   *
   * @param schema
   * @returns
   */
  insertBeforeEnd(schema: ISchema) {
    if (!Schema.isSchemaInstance(this.current)) {
      return;
    }
    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      schema.parent = this.current;
    }
    this.prepareProperty(schema);
    const s = this.current.addProperty(schema.name || uid(), schema);
    this.emit('afterInsertAdjacent', 'beforeEnd', s);
  }

  /**
   * After the current schema itself.
   */
  insertAfterEnd(schema: ISchema) {
    if (!Schema.isSchemaInstance(this.current)) {
      return;
    }
    const properties = {};
    let start = false;

    if (Schema.isSchemaInstance(schema)) {
      schema.parent.removeProperty(schema.name);
      schema.parent = this.current.parent;
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
    const s = this.current.parent.addProperty(schema.name || uid(), schema);
    this.current.parent.setProperties(properties);
    this.emit('afterInsertAdjacent', 'afterEnd', s);
  }
}

// TODO
export function useDesignable() {
  const { designable, refresh, reset } = useContext(SchemaComponentContext);
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
    DesignableBar,
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
    remove() {
      dn.remove();
    },
    insertAdjacent(position: Position, schema: ISchema) {
      dn.insertAdjacent(position, schema);
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
