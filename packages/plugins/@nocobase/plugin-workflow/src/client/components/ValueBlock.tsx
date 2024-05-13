/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { css, SchemaInitializerItem, useSchemaInitializer, useSchemaInitializerItem } from '@nocobase/client';
import { parse } from '@nocobase/utils/client';
import React from 'react';
import { useFlowContext } from '../FlowContext';
import { SimpleDesigner } from './SimpleDesigner';

export const ValueBlock: (() => JSX.Element) & {
  Initializer: () => JSX.Element;
  Result: (props) => JSX.Element;
  Designer: () => JSX.Element;
} = () => {
  return null;
};

function Initializer() {
  const itemConfig = useSchemaInitializerItem();
  const { node, resultTitle, ...props } = itemConfig;
  const { insert } = useSchemaInitializer();
  return (
    <SchemaInitializerItem
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
          'x-designer': 'ValueBlock.Designer',
          properties: {
            result: {
              type: 'void',
              title: resultTitle,
              'x-component': 'ValueBlock.Result',
              'x-component-props': {
                // NOTE: as same format as other reference for migration of revision
                dataSource: `{{$jobsMapByNodeKey.${node.key}}}`,
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
    $jobsMapByNodeKey: (execution.jobs ?? []).reduce(
      (map, job) => Object.assign(map, { [job.nodeKey]: job.result }),
      {},
    ),
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
ValueBlock.Designer = SimpleDesigner;
