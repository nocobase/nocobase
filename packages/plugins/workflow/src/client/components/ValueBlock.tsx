import { useFieldSchema } from '@formily/react';
import { css, SchemaInitializer } from '@nocobase/client';
import { parse } from '@nocobase/utils/client';
import React from 'react';
import { useFlowContext } from '../FlowContext';

export const ValueBlock: (() => JSX.Element) & {
  Initializer: (props) => JSX.Element;
  Result: (props) => JSX.Element;
} = () => {
  return null;
};

function Initializer({ node, resultTitle, insert, ...props }) {
  return (
    <SchemaInitializer.Item
      {...props}
      onClick={() => {
        insert({
          type: 'void',
          name: node.id,
          title: node.title,
          'x-component': 'CardItem',
          'x-component-props': {
            title: node.title ?? `#${node.id}`,
          },
          'x-designer': 'SimpleDesigner',
          properties: {
            result: {
              type: 'void',
              title: resultTitle,
              'x-component': 'ValueBlock.Result',
              'x-component-props': {
                // NOTE: as same format as other reference for migration of revision
                dataSource: `{{$jobsMapByNodeId.${node.id}}}`,
              },
            },
          },
        });
      }}
    />
  );
}

function Result({ dataSource }) {
  const field = useFieldSchema();
  const { execution } = useFlowContext();
  if (!execution) {
    return field.title;
  }
  const result = parse(dataSource)({
    $jobsMapByNodeId: (execution.jobs ?? []).reduce((map, job) => Object.assign(map, { [job.nodeId]: job.result }), {}),
  });

  return (
    <pre
      className={css`
        margin: 0;
      `}
    >
      {JSON.stringify(result, null, 2)}
    </pre>
  );
}

ValueBlock.Initializer = Initializer;
ValueBlock.Result = Result;
