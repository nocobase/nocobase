import React, { useMemo, useContext, createContext, useState } from 'react';
import { Form, FormItem, FormLayout, Input } from '@formily/antd';
import {
  observer,
  FormProvider,
  FormConsumer,
  createSchemaField,
  useField,
  useFieldSchema,
  useForm,
  Schema,
  SchemaExpressionScopeContext,
  SchemaKey,
  connect,
  mapReadPretty,
  mapProps,
} from '@formily/react';
import { createForm } from '@formily/core';
import { Row, Col, Button } from 'antd';
import { uid } from '@formily/shared';
import { useDrop, useDrag } from 'ahooks';
import './style.less';
import { DeleteOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';

const SchemaEditorContext = createContext<Schema>(new Schema({}));
const SchemaRefreshContext = createContext(null);

function DropRow() {
  const { schema: rowSchema, refresh } = useSchema();
  const schema = rowSchema.parent;
  const context = useContext(SchemaEditorContext);
  function getSchema(names: any[]) {
    const paths = [...names];
    let schema: Schema = context;
    while (paths.length) {
      schema = schema.properties[paths.shift()];
    }
    return schema;
  }
  const [props, { isHovering }] = useDrop({
    onDom: (content, e) => {
      console.log('paths', content);
      const source = getSchema(content.paths);
      // console.log({ paths: content.paths, source });
      // schema.addProperty(source.name, source.toJSON());
      // refresh();

      const rowName = `row_${uid()}`;
      const colName = `col_${uid()}`;
      const fieldName = `field_${uid()}`;
      schema.addProperty(rowName, {
        type: 'void',
        name: rowName,
        'x-component': 'GridRow',
        properties: {
          [colName]: {
            type: 'void',
            name: colName,
            'x-component': 'GridColumn',
            'x-component-props': {
              span: 24,
            },
            properties: {
              [source.name]: source.toJSON(),
            },
          },
        },
      });
      source.parent.removeProperty(source.name);
      refresh();
    },
  });

  return (
    <div className={isHovering ? 'drop-row active' : 'drop-row'} {...props} />
  );
}

function DropRowColumn() {
  const form = useForm();
  const { schema, refresh } = useSchema();
  const context = useContext(SchemaEditorContext);
  function getSchema(names: any[]) {
    const paths = [...names];
    let schema: Schema = context;
    while (paths.length) {
      schema = schema.properties[paths.shift()];
    }
    return schema;
  }
  const [props, { isHovering }] = useDrop({
    onDom: (content, e) => {
      // console.log('paths', content);
      const source = getSchema(content.paths);
      const col = `col${uid()}`;
      const blockName = `block${uid()}`;
      const inputName = `input${uid()}`;
      schema.addProperty(col, {
        type: 'void',
        name: col,
        'x-component': 'GridColumn',
        'x-component-props': {
          labelCol: 6,
          wrapperCol: 10,
        },
        properties: {
          [blockName]: source.toJSON(),
        },
      });
      const len = Object.keys(schema.properties).length;
      const properties = schema.mapProperties((p) => p);
      source.parent.removeProperty(source.name);
      // schema.setProperties(newProperties);
      // console.log(properties);
      refresh();

      properties.forEach((p) => {
        form.setFieldState(getFullPaths(p).join('.'), (state) => {
          state.componentProps = {
            span: 24 / len,
          };
        });
      });

      // console.log({ paths: content.paths, source });
      // schema.addProperty(source.name, source.toJSON());
      // source.parent.removeProperty(source.name);
      // refresh();
    },
  });

  return (
    <div
      className={isHovering ? `drop-column last active` : `drop-column last`}
      {...props}
    />
  );
}

function DropColumn() {
  const form = useForm();
  const { schema: columnSchema, refresh } = useSchema();
  const schema = columnSchema.parent;
  const context = useContext(SchemaEditorContext);
  function getSchema(names: any[]) {
    const paths = [...names];
    let s: Schema = context;
    while (paths.length) {
      s = s.properties[paths.shift()];
    }
    return s;
  }
  const [props, { isHovering }] = useDrop({
    onDom: (content, e) => {
      // console.log('paths', content);
      const source = getSchema(content.paths);
      const col = `col${uid()}`;
      const blockName = `block${uid()}`;
      const inputName = `input${uid()}`;
      schema.addProperty(col, {
        type: 'void',
        name: col,
        'x-component': 'GridColumn',
        'x-component-props': {
          labelCol: 6,
          wrapperCol: 10,
        },
        properties: {
          [blockName]: source.toJSON(),
        },
      });
      const len = Object.keys(schema.properties).length;
      const properties = schema.mapProperties((p) => p);

      // schema.setProperties(newProperties);
      // console.log(properties);
      source.parent.removeProperty(source.name);
      refresh();

      properties.forEach((p) => {
        form.setFieldState(getFullPaths(p).join('.'), (state) => {
          state.componentProps = {
            span: 24 / len,
          };
        });
      });

      // console.log({ paths: content.paths, source });
      // schema.addProperty(source.name, source.toJSON());
      // refresh();
    },
  });

  return (
    <div
      className={isHovering ? `drop-column active` : `drop-column`}
      {...props}
    />
  );
}

function DropBlock() {
  const { schema, refresh } = useSchema();
  const context = useContext(SchemaEditorContext);
  function getSchema(names: any[]) {
    const paths = [...names];
    let s: Schema = context;
    while (paths.length) {
      s = s.properties[paths.shift()];
    }
    return s;
  }
  const [props, { isHovering }] = useDrop({
    onDom: (content, e) => {
      const source = getSchema(content.paths);
      console.log({ paths: content.paths, source });
      schema.parent.addProperty(source.name, source.toJSON());
      source.parent.removeProperty(source.name);
      refresh();
    },
  });

  return (
    <div
      className={isHovering ? 'drop-block active' : 'drop-block'}
      {...props}
    />
  );
}

export const Grid = ({ children }) => {
  const { schema, refresh } = useSchema();
  return (
    <div>
      {children}
      <Button
        block
        type={'dashed'}
        onClick={() => {
          const rowName = `row_${uid()}`;
          const colName = `col_${uid()}`;
          const blockName = `block_${uid()}`;
          const fieldName = `field_${uid()}`;
          schema.addProperty(rowName, {
            type: 'void',
            name: rowName,
            'x-component': 'GridRow',
            properties: {
              [colName]: {
                type: 'void',
                name: colName,
                'x-component': 'GridColumn',
                'x-component-props': {
                  span: 24,
                },
                properties: {
                  [blockName]: {
                    type: 'void',
                    'x-component': 'GridBlock',
                    'x-component-props': {},
                    'x-read-pretty': false,
                    properties: {
                      [fieldName]: {
                        type: 'string',
                        name: fieldName,
                        title: `输入框${fieldName}`,
                        required: true,
                        'x-decorator': 'FormItem',
                        'x-component': 'Input',
                      },
                    },
                  },
                },
              },
            },
          });
          refresh();
        }}
      >
        + 新增行
      </Button>
    </div>
  );
};

export const GridRow = (props) => {
  console.log('GridRow', props);
  const { children } = props;
  const form = useForm();
  const { schema, refresh } = useSchema();
  return (
    <div className={'grid-row'} style={{ position: 'relative' }}>
      <Row gutter={24}>{children}</Row>
      <DropRowColumn />
      <DropRow />
    </div>
  );
};

const getFullPaths = (schema: Schema) => {
  if (!schema) {
    return [];
  }
  const paths = [schema.name];
  if (schema.parent.name) {
    paths.unshift(...getFullPaths(schema.parent));
  }
  return paths;
};

function useSchema() {
  const context = useContext(SchemaEditorContext);
  const refresh = useContext(SchemaRefreshContext);
  const fieldSchema = useFieldSchema();
  const paths = getFullPaths(fieldSchema);
  console.log({ fieldSchema, paths, context });
  let schema: Schema = context;
  const names = [...paths];
  while (names.length) {
    schema = schema.properties[names.shift()];
  }
  return { schema, fieldSchema, refresh };
}

export const GridColumn = (props) => {
  const { children } = props;
  const { schema, refresh } = useSchema();
  console.log('GridColumn', { props });
  return (
    <Col {...props}>
      <DropColumn />
      {children}
    </Col>
  );
};

function GridBlock({ children, ...props }) {
  const fieldSchema = useFieldSchema();
  const { schema, refresh } = useSchema();
  const field = useField();
  console.log('x-read-pretty', field.readPretty);
  const getDragProps = useDrag({
    onDragStart: (data, e) => {
      // e.dataTransfer
      // setDragging(data);
    },
    onDragEnd: (data) => {
      // setDragging(null);
    },
  });
  const paths = getFullPaths(schema);
  console.log({ props, paths, schema, fieldSchema });
  return (
    <div className={'grid-block'} {...getDragProps({ paths })}>
      <div className={'grid-block-actions'}>
        <DeleteOutlined
          onClick={() => {
            schema.parent.removeProperty(schema.name);
            refresh();
          }}
        />
        <MenuOutlined />
      </div>
      {children}
      <DropBlock />
    </div>
  );
}

function G({ children }) {
  return <div>{children}</div>;
}

export const SchemaField = createSchemaField({
  components: {
    FormLayout,
    FormItem,
    Input,
    Grid,
    GridRow,
    GridColumn,
    GridBlock: (props) => {
      const field = useField();
      return React.createElement(field.readPretty ? G : GridBlock, props);
    },
  },
});

const schema = new Schema({
  type: 'object',
  properties: {
    layout: {
      type: 'void',
      'x-component': 'FormLayout',
      'x-component-props': {
        layout: 'vertical',
        // labelCol: 6,
        // wrapperCol: 10,
      },
      properties: {
        grid1: {
          type: 'void',
          'x-component': 'Grid',
          'x-component-props': {},
          properties: {
            row1: {
              type: 'void',
              'x-component': 'GridRow',
              'x-component-props': {
                labelCol: 6,
                wrapperCol: 10,
              },
              properties: {
                col1: {
                  type: 'void',
                  'x-component': 'GridColumn',
                  'x-read-pretty': true,
                  'x-component-props': {
                    labelCol: 6,
                    wrapperCol: 10,
                    span: 12,
                  },
                  properties: {
                    block1: {
                      type: 'void',
                      'x-component': 'GridBlock',
                      'x-component-props': {},
                      'x-read-pretty': false,
                      properties: {
                        input1: {
                          type: 'string',
                          title: '输入框1',
                          required: true,
                          'x-read-pretty': false,
                          'x-decorator': 'FormItem',
                          'x-component': 'Input',
                        },
                      },
                    },
                    block2: {
                      type: 'void',
                      'x-component': 'GridBlock',
                      'x-component-props': {},
                      'x-read-pretty': false,
                      properties: {
                        input2: {
                          type: 'string',
                          title: '输入框2',
                          required: true,
                          'x-read-pretty': false,
                          'x-decorator': 'FormItem',
                          'x-component': 'Input',
                        },
                      },
                    },
                  },
                },
                col2: {
                  type: 'void',
                  'x-component': 'GridColumn',
                  'x-component-props': {
                    span: 12,
                    labelCol: 6,
                    wrapperCol: 10,
                  },
                  properties: {
                    block3: {
                      type: 'void',
                      'x-component': 'GridBlock',
                      'x-component-props': {},
                      'x-read-pretty': false,
                      properties: {
                        input3: {
                          type: 'string',
                          title: '输入框3',
                          required: true,
                          'x-read-pretty': false,
                          'x-decorator': 'FormItem',
                          'x-component': 'Input',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
});

function SchemaProvider(props) {
  const { schema } = props;
  const [, forceUpdate] = useState(0);
  return (
    <SchemaRefreshContext.Provider
      value={() => {
        forceUpdate(Math.random());
      }}
    >
      <SchemaEditorContext.Provider value={schema}>
        <SchemaField schema={schema}></SchemaField>
      </SchemaEditorContext.Provider>
    </SchemaRefreshContext.Provider>
  );
}

export function Designer() {
  const form = useMemo(() => createForm({}), []);
  const [, forceUpdate] = useState(0);
  return (
    <div>
      <FormProvider form={form}>
        <SchemaProvider schema={schema} />
        <FormConsumer>
          {(form) => {
            return <div>{JSON.stringify(form.values, null, 2)}</div>;
          }}
        </FormConsumer>
      </FormProvider>
    </div>
  );
}

export default Designer;
