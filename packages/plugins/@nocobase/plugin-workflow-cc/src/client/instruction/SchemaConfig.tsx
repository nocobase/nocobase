/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { uid } from '@formily/shared';
import { ISchema, observer, useForm } from '@formily/react';
import { Button, Spin, Typography } from 'antd';

import {
  ActionContextProvider,
  css,
  gridRowColWrap,
  SchemaComponent,
  SchemaComponentProvider,
  SchemaInitializer,
  SchemaInitializerItemType,
  useActionContext,
  useAPIClient,
  usePlugin,
  useRequest,
  useSchemaOptionsContext,
} from '@nocobase/client';
import PluginWorkflowClient, {
  useAvailableUpstreams,
  useFlowContext,
  useNodeContext,
  useTrigger,
  useWorkflowExecuted,
} from '@nocobase/plugin-workflow/client';
import { NAMESPACE } from '../../common/constants';
import { lang, usePluginTranslation } from '../locale';

function useTriggerInitializers(): SchemaInitializerItemType | null {
  const { workflow } = useFlowContext();
  const trigger = useTrigger();
  return trigger.useInitializers ? trigger.useInitializers(workflow.config) : null;
}

export const addBlockButton = new SchemaInitializer({
  name: 'workflowCc:popup:configureUserInterface:addBlock',
  wrap: gridRowColWrap,
  title: '{{t("Add block")}}',
  items: [
    {
      type: 'itemGroup',
      name: 'dataBlocks',
      title: '{{t("Data blocks")}}',
      hideIfNoChildren: true,
      useChildren() {
        const workflowPlugin = usePlugin(PluginWorkflowClient);
        const current = useNodeContext();
        const nodes = useAvailableUpstreams(current);
        const triggerInitializers = [useTriggerInitializers()].filter(Boolean);
        const nodeBlockInitializers = nodes
          .map((node) => {
            const instruction = workflowPlugin.instructions.get(node.type);
            return instruction?.useInitializers?.(node);
          })
          .filter(Boolean);
        const dataBlockInitializers: any = [
          ...triggerInitializers,
          ...(nodeBlockInitializers.length
            ? [
                {
                  name: 'nodes',
                  type: 'subMenu',
                  title: `{{t("Node result", { ns: "workflow" })}}`,
                  children: nodeBlockInitializers,
                },
              ]
            : []),
        ].filter(Boolean);
        return dataBlockInitializers;
      },
    },
    {
      type: 'itemGroup',
      name: 'otherBlocks',
      title: '{{t("Other blocks")}}',
      children: [
        {
          name: 'markdown',
          title: '{{t("Markdown")}}',
          Component: 'MarkdownBlockInitializer',
        },
      ],
    },
  ],
});

function SchemaContent({ value, onChange }) {
  const api = useAPIClient();
  const workflowPlugin = usePlugin(PluginWorkflowClient);
  const { components, scope } = useSchemaOptionsContext();
  const executed = useWorkflowExecuted();
  const node = useNodeContext();
  const nodes = useAvailableUpstreams(node);

  const { data, loading } = useRequest(
    async () => {
      if (value) {
        const { data } = await api.request({ url: `uiSchemas:getJsonSchema/${value}` });
        if (data.data?.['x-uid'] === value) {
          return data.data;
        }
      }

      const id = value ?? uid();
      // const content = createEditFormBlockUISchema();
      const newSchema = {
        type: 'void',
        name: id,
        'x-uid': id,
        'x-component': 'Grid',
        'x-initializer': 'workflowCc:popup:configureUserInterface:addBlock',
        properties: {
          [uid()]: {
            type: 'void',
            'x-component': 'Grid.Row',
            properties: {
              [uid()]: {
                type: 'void',
                'x-component': 'Grid.Col',
                'x-component-props': {
                  span: 24,
                },
                properties: {
                  // [uid()]: content,
                },
              },
            },
          },
        },
      };
      await api.resource('uiSchemas').insert({
        values: newSchema,
      });
      onChange(id);
      return newSchema;
    },
    {
      refreshDeps: [value],
    },
  );

  if (loading) {
    return <Spin />;
  }

  const nodeComponents = {};
  nodes.forEach((item) => {
    const instruction = workflowPlugin.instructions.get(item.type);
    Object.assign(nodeComponents, instruction.components);
  });

  return (
    <SchemaComponentProvider scope={scope} components={components} designable={!executed}>
      <SchemaComponent
        scope={{
          useReadAction() {
            return { run() {} };
          },
        }}
        components={{
          ...nodeComponents,
        }}
        schema={data as ISchema}
      />
    </SchemaComponentProvider>
  );
}

export function SchemaConfig({ value, onChange }) {
  return (
    <SchemaComponent
      components={{
        SchemaContent,
      }}
      schema={
        {
          name: 'drawer',
          type: 'void',
          title: `{{t("User interface", { ns: "${NAMESPACE}" })}}`,
          'x-component': 'Action.Container',
          'x-component-props': {
            className: css`
              .ant-drawer-body {
                background: var(--nb-box-bg);
              }
            `,
          },
          properties: {
            ccDetail: {
              type: 'string',
              'x-component': 'SchemaContent',
            },
          },
        } as ISchema
      }
    />
  );
}

const ConfigChangedContext = React.createContext<any>({});

const ForceReadHint = observer(() => {
  const { initialValues, values } = useForm();

  return initialValues.forceRead != values.forceRead ? (
    <Typography.Paragraph type="secondary">
      <Typography.Text type="warning">{lang('Force read changes unsaved, click "Submit" to save.')}</Typography.Text>
    </Typography.Paragraph>
  ) : null;
});

export function SchemaConfigButton(props) {
  const executed = useWorkflowExecuted();
  const { setFormValueChanged } = useActionContext();
  const [visible, setVisible] = useState(false);
  const { t } = usePluginTranslation();
  return (
    <ConfigChangedContext.Provider value={{ setFormValueChanged }}>
      <Button type="primary" onClick={() => setVisible(true)} disabled={false}>
        {t(executed ? 'View user interface' : 'Configure user interface')}
      </Button>
      <ActionContextProvider value={{ visible, setVisible, formValueChanged: false }}>
        {props.children}
      </ActionContextProvider>
      <ForceReadHint />
    </ConfigChangedContext.Provider>
  );
}
