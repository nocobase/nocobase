import React, { useContext, createContext, useState } from 'react';
import { Schema, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { SchemaField } from '../../fields';
import set from 'lodash/set';

export const SchemaDesignerContext = createContext<Schema>(new Schema({}));
export const SchemaRefreshContext = createContext(null);

export function SchemaFieldWithDesigner(props) {
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
      </SchemaRefreshContext.Provider>
    );
  }
  return <Container schema={new Schema(props.schema)} />;
}

export const getFullPaths = (schema: Schema) => {
  if (!schema) {
    return [];
  }
  const paths = [schema.name];
  if (schema.parent && schema.parent.name) {
    paths.unshift(...getFullPaths(schema.parent));
  }
  return paths;
};

export function useSchema() {
  const context = useContext(SchemaDesignerContext);
  const refresh = useContext(SchemaRefreshContext);
  const fieldSchema = useFieldSchema();
  const paths = getFullPaths(fieldSchema);
  let schema: Schema = context;
  const names = [...paths];
  while (names.length) {
    schema = schema.properties[names.shift()];
  }
  return { schema, fieldSchema, refresh };
}

export function getSchema(context) {
  return (paths) => {
    const fullPaths = Array.isArray(paths) ? paths : getFullPaths(paths);
    let s: Schema = context;
    const names = [...fullPaths];
    while (names.length) {
      s = s.properties[names.shift()];
    }
    return s;
  };
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

export function useSchemaQuery() {
  const context = useContext(SchemaDesignerContext);
  const form = useForm();
  const { schema, refresh } = useSchema();

  return {
    resizeColumn() {
      function getPrevProperty() {
        const names = Object.keys(schema.parent.properties);
        const index = names.indexOf(schema.name as string);
        return schema.parent.properties[names[index-1]];
      }
      console.log('onMouseDown', schema.name);
      console.log('onMouseDown', schema.parent.properties);
      console.log('onMouseDown', getFullPaths(getPrevProperty()));
      form.setFieldState(getFullPaths(getPrevProperty()).join('.'), (state) => {
        const span = state.componentProps.span;
        let width = state.componentProps.width||50;
        width -= 1;
        state.componentProps = {
          span: 1*span - 1,
          width,
          style: {
            flex: `0 0 ${width}%`,
            maxWidth: `${width}%`,
          },
        };
      });
      console.log('onMouseDown', getFullPaths(schema));
      form.setFieldState(getFullPaths(schema).join('.'), (state) => {
        const span = state.componentProps.span;
        console.log({span})
        let width = state.componentProps.width||50;
        width += 1;
        state.componentProps = {
          span: 1*span + 1,
          style: {
            flex: `0 0 ${width}%`,
            maxWidth: `${width}%`,
          },
        };
      });
      refresh();
    },
    removeBlock() {
      schema.parent.removeProperty(schema.name);
      refresh();
    },
    addBlock: (data, up = false) => {
      const blockSchema = block({
        type: 'string',
        title: `Block ${uid()}`,
        required: true,
        'x-read-pretty': false,
        // 'x-decorator': 'FormItem',
        'x-component': 'Hello',
        rowOrder: 2,
        columnOrder: 1,
        blockOrder: 1,
      });
      if ('Grid.Column' === schema.parent['x-component']) {
        if (Object.keys(schema.parent.parent.properties).length > 1) {
          up
            ? addPropertyBefore(schema, blockSchema)
            : addPropertyAfter(schema, blockSchema);
        } else {
          const rowSchema = row(column(blockSchema));
          up
            ? addPropertyAfter(schema.parent.parent, rowSchema)
            : addPropertyAfter(schema.parent.parent, rowSchema);
        }
      }
      console.log('x-component', schema.parent['x-component']);
      refresh();
      // schema.parent['x-component']
    },
    insertAfter: (sourcePath, targetPath) => {
      const source = getSchema(context)(sourcePath);
      const target = getSchema(context)(targetPath);
      if (!source || !target) {
        return;
      }
      console.log({
        sourcePath,
        source,
        target,
        targetPath,
        sourceParentproperties: source.parent.properties,
      });
      const names = [];
      Object.keys(target.parent.properties).forEach((name) => {
        // if (names.includes(source.name)) {
        //   return;
        // }
        // names.push(name);
        const property = target.parent.properties[name];
        property.parent.removeProperty(property.name);
        target.parent.addProperty(property.name, property.toJSON());
        if (name === target.name) {
          // names.push(source.name);
          source.parent.removeProperty(source.name);
          console.log('source.parent.properties', source.parent.properties);
          target.parent.addProperty(source.name, source.toJSON());
        }
      });
    },
    insertAfterWithAddRow: (sourcePath, targetPath) => {
      const source = getSchema(context)(sourcePath);
      const target = getSchema(context)(targetPath);
      const rowSchema = row(column(source.toJSON()));
      source.parent.removeProperty(source.name);
      Object.keys(target.parent.properties).forEach((name) => {
        const property = target.parent.properties[name];
        property.parent.removeProperty(property.name);
        target.parent.addProperty(property.name, property.toJSON());
        if (name === target.name) {
          target.parent.addProperty(rowSchema.name, rowSchema);
        }
      });
    },
    insertBeforeWithAddRow: (sourcePath, targetPath) => {
      const source = getSchema(context)(sourcePath);
      const target = getSchema(context)(targetPath);
      const rowSchema = row(column(source.toJSON()));
      source.parent.removeProperty(source.name);
      Object.keys(target.parent.properties).forEach((name) => {
        if (name === target.name) {
          target.parent.addProperty(rowSchema.name, rowSchema);
        }
        const property = target.parent.properties[name];
        property.parent.removeProperty(property.name);
        target.parent.addProperty(property.name, property.toJSON());
      });
    },
    appendToRowWithAddColumn: (sourcePath, targetPath) => {
      const source = getSchema(context)(sourcePath);
      const target = getSchema(context)(targetPath);
      const colSchema = column(source.toJSON());
      source.parent.removeProperty(source.name);
      const len = Object.keys(target.properties).length + 1;
      target.addProperty(colSchema.name, colSchema);
      console.log('target.properties', target.properties);
      Object.keys(target.properties).forEach((name) => {
        const prop = target.properties[name];
        form.setFieldState(getFullPaths(prop).join('.'), (state) => {
          state.componentProps = {
            span: 24 / len,
          };
        });
      });
    },
    insertBeforeWithAddColumn: (sourcePath, targetPath) => {
      const source = getSchema(context)(sourcePath);
      const target = getSchema(context)(targetPath);
      const colSchema = column(source.toJSON());
      source.parent.removeProperty(source.name);
      const len = Object.keys(target.parent.properties).length + 1;
      console.log('x-component-props.span', 24 / len);
      Object.keys(target.parent.properties).forEach((name) => {
        if (name === target.name) {
          target.parent.addProperty(colSchema.name, colSchema);
        }
        const property = target.parent.properties[name];
        property.parent.removeProperty(property.name);
        const json = property.toJSON();
        target.parent.addProperty(property.name, json);
      });
      Object.keys(target.parent.properties).forEach((name) => {
        const prop = target.parent.properties[name];
        form.setFieldState(getFullPaths(prop).join('.'), (state) => {
          state.componentProps = {
            span: 24 / len,
          };
        });
      });
    },
  };
}

export const grid = (...rows: any[]) => {
  const rowProperties = {};
  rows.forEach((row, index) => {
    set(row, 'x-component-props.rowOrder', index);
    rowProperties[row.name] = row;
  });
  const name = `g_${uid()}`;
  return {
    type: 'void',
    name,
    'x-component': 'Grid',
    'x-component-props': {},
    properties: rowProperties,
  };
};

export const row = (...cols: any[]) => {
  const rowName = `r_${uid()}`;
  const colsProperties = {};
  cols.forEach((col, index) => {
    set(col, 'x-component-props.columnOrder', index);
    set(col, 'x-component-props.span', 24 / cols.length);
    colsProperties[col.name] = col;
  });
  return {
    type: 'void',
    name: rowName,
    'x-component': 'Grid.Row',
    'x-component-props': {},
    properties: colsProperties,
  };
};

export const column = (...blocks: any[]) => {
  const colName = `c_${uid()}`;
  const properties = {};
  blocks.forEach((item) => {
    properties[item.name] = item;
  });
  return {
    name: colName,
    type: 'void',
    'x-component': 'Grid.Column',
    'x-read-pretty': true,
    'x-component-props': {
      labelCol: 6,
      wrapperCol: 10,
      span: 24,
    },
    properties,
  };
};

export const block = (...fields: any[]) => {
  const blockName = `b_${uid()}`;
  const properties = {};
  fields.forEach((item) => {
    const name = item.name || `f_${uid()}`;
    // item.title = `${item.title} ${name}`;
    properties[name] = item;
  });
  const lastComponentType = fields[fields.length - 1]['x-component'];
  return {
    name: blockName,
    type: 'void',
    'x-component': 'Grid.Block',
    'x-component-props': {
      lastComponentType,
    },
    'x-read-pretty': false,
    properties,
  };
};
