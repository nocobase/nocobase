import React, { useContext, createContext, useState } from 'react';
import {
  Schema,
  ISchema,
  useFieldSchema,
  useForm,
  useField,
} from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaField } from '../../fields';
import set from 'lodash/set';

export const SchemaDesignerContext = createContext<Schema>(new Schema({}));
export const SchemaRefreshContext = createContext(null);

export function SchemaFieldWithDesigner(props: { schema?: ISchema }) {
  function Container(props) {
    const { schema } = props;
    const [, refresh] = useState(0);
    return (
      <SchemaRefreshContext.Provider
        value={() => {
          refresh(Math.random());
        }}
      >
        <SchemaDesignerContext.Provider value={schema}>
          <SchemaField schema={schema} />
        </SchemaDesignerContext.Provider>
        {/* <pre>{JSON.stringify(schema.toJSON(), null, 2)}</pre> */}
      </SchemaRefreshContext.Provider>
    );
  }
  return <Container schema={new Schema(props.schema)} />;
}

export function removeProperty(property: Schema) {
  property.parent.removeProperty(property.name);
}

export function addPropertyBefore(target, prop) {
  Object.keys(target.parent.properties).forEach((name) => {
    if (name === target.name) {
      target.parent.addProperty(prop.name, prop);
    }
    const property = target.parent.properties[name];
    property.parent.removeProperty(property.name);
    target.parent.addProperty(property.name, property.toJSON());
  });
}

export function addPropertyAfter(target, prop) {
  Object.keys(target.parent.properties).forEach((name) => {
    const property = target.parent.properties[name];
    property.parent.removeProperty(property.name);
    target.parent.addProperty(property.name, property.toJSON());
    if (name === target.name) {
      target.parent.addProperty(prop.name, prop);
    }
  });
}

export const getSchemaAddressSegments = (schema: Schema) => {
  if (!schema) {
    return [];
  }
  const segments = [schema.name];
  if (schema.parent && schema.parent.name) {
    segments.unshift(...getSchemaAddressSegments(schema.parent));
  }
  return segments;
};

export function useSchemaQuery() {
  const context = useContext(SchemaDesignerContext);
  const refresh = useContext(SchemaRefreshContext);
  const fieldSchema = useFieldSchema();
  const field = useField();
  const form = useForm();

  const getSchemaByPath = (path) => {
    let s: Schema = context;
    const names = [...path];
    while (names.length) {
      s = s.properties[names.shift()];
    }
    return s;
  };

  const schema = getSchemaByPath(field.address.segments);

  const getPropertyByPosition = (position) => {
    if (position.type === 'row-divider') {
      const names = Object.keys(schema.properties);
      const isOver = position.rowDividerIndex > names.length - 1;
      const index = isOver ? names.length - 1 : position.rowDividerIndex;
      const name = names[index];
      const property = schema.properties[name];
      const addProperty = isOver ? addPropertyAfter : addPropertyBefore;
      return (data) => {
        return addProperty(property, {
          type: 'void',
          name: `r_${uid()}`,
          'x-component': 'Grid.Row',
          properties: {
            [`c_${uid()}`]: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1,
              },
              properties: {
                [data.name]: data,
              },
            },
          },
        });
      };
    }
    const rowNames = Object.keys(schema.properties);
    const rowName = rowNames[position.rowIndex];
    const row = schema.properties[rowName];
    if (position.type === 'col-divider') {
      const names = Object.keys(row.properties);
      const isOver = position.colDividerIndex > names.length - 1;
      const index = isOver ? names.length - 1 : position.colDividerIndex;
      const name = names[index];
      const property = row.properties[name];
      const addProperty = isOver ? addPropertyAfter : addPropertyBefore;
      const count = Object.keys(row.properties).length+1;
      return (data) => {
        const other = 1-(1/count);
        Object.keys(row.properties).forEach(name => {
          const prop = row.properties[name];
          const segments = getSchemaAddressSegments(prop);
          form.setFieldState(segments.join('.'), state => {
            state.componentProps.size = other * state.componentProps.size;
            console.log({state}, other * state.componentProps.size);
          });
        });
        addProperty(property, {
          type: 'void',
          name: `c_${uid()}`,
          'x-component': 'Grid.Col',
          'x-component-props': {
            size: 1/count,
          },
          properties: {
            [data.name]: data,
          },
        });
      };
    }
    const colNames = Object.keys(row.properties);
    const colName = colNames[position.colIndex];
    const col = row.properties[colName];
    if (position.type === 'block-divider') {
      const names = Object.keys(col.properties);
      const isOver = position.blockDividerIndex > names.length - 1;
      const index = isOver ? names.length - 1 : position.blockDividerIndex;
      const name = names[index];
      const property = col.properties[name];
      const addProperty = isOver ? addPropertyAfter : addPropertyBefore;
      return (data) => {
        return addProperty(property, data);
      };
    }
  };

  return {
    schema,
    fieldSchema,
    refresh,
    removeBlock: () => {
      if (Object.keys(schema.parent.parent.properties).length === 1) {
        removeProperty(schema.parent.parent);
      } else if (Object.keys(schema.parent.properties).length === 1) {
        removeProperty(schema.parent);
        const cols = [];
        let allSize = 0;
        Object.keys(schema.parent.parent.properties).forEach(name => {
          const prop = schema.parent.parent.properties[name];
          const segments = getSchemaAddressSegments(prop);
          cols.push(segments);
          form.setFieldState(segments.join('.'), state => {
            allSize += state.componentProps.size;
          });
          return;
        });
        for (const segments of cols) {
          form.setFieldState(segments.join('.'), state => {
            state.componentProps.size = state.componentProps.size/allSize;
          });
        }
      }
      refresh();
    },
    addBlock: (data?: any, options?: any) => {
      const { insertBefore = false } = options || {};
      data = {
        type: 'void',
        name: `b_${uid()}`,
        'x-component': 'Grid.Block',
      };
      const addProperty = insertBefore ? addPropertyBefore : addPropertyAfter;
      if (Object.keys(schema.parent.parent.properties).length === 1) {
        addProperty(schema.parent.parent, {
          type: 'void',
          name: `r_${uid()}`,
          'x-component': 'Grid.Row',
          properties: {
            [`c_${uid()}`]: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1,
              },
              properties: {
                [data.name]: data,
              },
            },
          },
        })
      } else {
        addProperty(schema, data);
      }
      refresh();
    },
    moveTo: (path, position) => {
      const source = getSchemaByPath(path);
      const insert = getPropertyByPosition(position);
      if (!insert) {
        return;
      }

      // 只有一列时，删除当前行
      if (Object.keys(source.parent.parent.properties).length === 1) {
        source.parent.parent.parent.removeProperty(source.parent.parent.name);
      }
      // 某列只有一个区块时删除当前列
      else if (Object.keys(source.parent.properties).length === 1) {
        source.parent.parent.removeProperty(source.parent.name);
        const cols = [];
        let allSize = 0;
        Object.keys(source.parent.parent.properties).forEach(name => {
          const prop = source.parent.parent.properties[name];
          const segments = getSchemaAddressSegments(prop);
          cols.push(segments);
          form.setFieldState(segments.join('.'), state => {
            allSize += state.componentProps.size;
          });
          return;
        });
        for (const segments of cols) {
          form.setFieldState(segments.join('.'), state => {
            state.componentProps.size = state.componentProps.size/allSize;
          });
        }
      } else {
        source.parent.removeProperty(source.name);
      }
      insert(source.toJSON());
      refresh();
    },
  };
}

export * from './DND';
export * from './Row';
export * from './Col';
export * from './Grid';
export * from './Block';
