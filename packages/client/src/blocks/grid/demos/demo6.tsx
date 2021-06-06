import { Grid, Row, Col, Block, SchemaFieldWithDesigner } from '../';
import './demo5.less';
import { Card } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import {
  FormProvider,
  FormConsumer,
  useField,
  useFieldSchema,
  ISchema,
  Schema,
} from '@formily/react';
import { createForm } from '@formily/core';

function Designer(props: { schema?: ISchema }) {
  const form = useMemo(() => createForm({}), []);
  const { schema } = props;
  return (
    <div>
      <FormProvider form={form}>
        <SchemaFieldWithDesigner schema={schema} />
        {/* <FormConsumer>
          {(form) => {
            return <div>{JSON.stringify(form.values, null, 2)}</div>;
          }}
        </FormConsumer> */}
      </FormProvider>
    </div>
  );
}

const schema = new Schema({
  type: 'object',
  properties: {
    grid: {
      type: 'void',
      title: 'aa',
      'x-component': 'Grid',
      properties: {
        row1: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            col1: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 2,
              },
              properties: {
                block11: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block11',
                  },
                },
              },
            },
            col2: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 2,
                isLast: true,
              },
              properties: {
                block21: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block21',
                  },
                },
              },
            },
          },
        },
        row2: {
          type: 'void',
          'x-component': 'Grid.Row',
          properties: {
            col21: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1 / 3,
              },
              properties: {
                block211: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block211',
                  },
                },
              },
            },
            col22: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 2 / 3,
                isLast: true,
              },
              properties: {
                block221: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block221',
                  },
                },
              },
            },
          },
        },
        row3: {
          type: 'void',
          'x-component': 'Grid.Row',
          "x-component-props": {
            isLast: true,
          },
          properties: {
            col31: {
              type: 'void',
              'x-component': 'Grid.Col',
              'x-component-props': {
                size: 1,
                isLast: true,
              },
              properties: {
                block311: {
                  type: 'void',
                  'x-component': 'Grid.Block',
                  'x-component-props': {
                    title: 'block311',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
})

export default () => {
  return (
    <Card>
      <Designer
        schema={schema}
      />
      {/* <Grid
        onDrop={(e) => {
          console.log('onDrop', e, e.data);
        }}
      >
        <Row
          onColResize={(e) => {
            console.log(e.data);
          }}
        >
          {[1, 2, 3].map((index) => (
            <Col size={1 / 3}>
              <Block>col {index}</Block>
            </Col>
          ))}
        </Row>
        <Row
          onColResize={(e) => {
            console.log(e.data);
          }}
        >
          {[4, 5, 6].map((index) => (
            <Col size={1 / 3}>
              <Block>col {index}</Block>
            </Col>
          ))}
        </Row>
        <Row
          onColResize={(e) => {
            console.log(e.data);
          }}
        >
          {[7, 8].map((index) => (
            <Col size={1 / 3}>
              <Block>col {index}</Block>
            </Col>
          ))}
        </Row>
        <Row
          onColResize={(e) => {
            console.log(e.data);
          }}
        >
          {[9].map((index) => (
            <Col size={1}>
              <Block>col {index}</Block>
            </Col>
          ))}
        </Row>
      </Grid> */}
    </Card>
  );
};
