import React, { useState, useContext } from "react";
import { useForm } from '@formily/react';
import { Alert, message, Tag } from "antd";
import { cx, css } from '@emotion/css';

import { Branch } from "./Branch";
import { lang, NAMESPACE } from "./locale";
import { branchBlockClass, nodeCardClass, nodeMetaClass } from "./style";
import { TriggerConfig } from "./triggers";
import { ActionContext, SchemaComponent, useAPIClient, useRequest, useResourceActionContext } from "@nocobase/client";
import { useFlowContext } from "./FlowContext";
import { instructions, NodeContext } from "./nodes";

function useUpdateAction(data) {
  const form = useForm();
  const api = useAPIClient();
  const { setViewNode } = useContext(NodeDrawerContext);
  const { refresh } = useResourceActionContext();
  const { workflow } = useFlowContext();
  return {
    async run() {
      if (workflow.executed) {
        message.error(lang('Node in executed workflow cannot be modified'));
        return;
      }
      await form.submit();
      await api.resource('flow_nodes', data.id).update?.({
        filterByTk: data.id,
        values: {
          config: form.values,
        },
      });
      setViewNode(null);
      refresh();
    },
  };
}

const NodeDrawerContext = React.createContext<any>({});

export function useNodeDrawerContext() {
  return useContext(NodeDrawerContext);
}

function NodeDrawer() {
  const { workflow } = useFlowContext();
  const { viewNode, setViewNode } = useNodeDrawerContext();
  const instruction = instructions.get(viewNode?.type);

  return (
    <NodeContext.Provider value={viewNode}>
      <ActionContext.Provider value={{ visible: Boolean(viewNode), setVisible: setViewNode }}>
        <SchemaComponent
          scope={instruction?.scope}
          components={instruction?.components}
          onlyRenderProperties
          schema={{
            type: 'void',
            name: `${instruction?.type}_${viewNode?.id}`,
            title: instruction?.title,
            'x-component': 'Action.Drawer',
            'x-decorator': 'Form',
            'x-decorator-props': {
              disabled: workflow.executed,
              useValues(options) {
                const { config } = viewNode ?? {};
                return useRequest(() => {
                  return Promise.resolve({ data: config });
                }, options);
              },
            },
            properties: {
              ...(workflow.executed
                ? {
                    alert: {
                      type: 'void',
                      'x-component': Alert,
                      'x-component-props': {
                        type: 'warning',
                        showIcon: true,
                        message: `{{t("Node in executed workflow cannot be modified", { ns: "${NAMESPACE}" })}}`,
                        className: css`
                          width: 100%;
                          font-size: 85%;
                          margin-bottom: 2em;
                        `,
                      },
                    },
                  }
                : {}),
              fieldset: {
                type: 'void',
                'x-component': 'fieldset',
                'x-component-props': {
                  className: css`
                    .ant-select,
                    .ant-cascader-picker,
                    .ant-picker,
                    .ant-input-number,
                    .ant-input-affix-wrapper {
                      &:not(.full-width) {
                        width: auto;
                        min-width: 6em;
                      }
                    }

                    .ant-input-affix-wrapper {
                      &:not(.full-width) {
                        .ant-input {
                          width: auto;
                          min-width: 6em;
                        }
                      }
                    }
                  `,
                },
                properties: instruction?.fieldset,
              },
              actions: workflow.executed
                ? null
                : {
                    type: 'void',
                    'x-component': 'Action.Drawer.Footer',
                    properties: {
                      cancel: {
                        title: '{{t("Cancel")}}',
                        'x-component': 'Action',
                        'x-component-props': {
                          useAction: '{{ cm.useCancelAction }}',
                        },
                      },
                      submit: {
                        title: '{{t("Submit")}}',
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'primary',
                          useAction: () => useUpdateAction(viewNode),
                        },
                      },
                    },
                  },
            },
          }}
        />
      </ActionContext.Provider>
    </NodeContext.Provider>
  );
}

export function CanvasContent({ entry }) {
  const [viewNode, setViewNode] = useState(null);
  return (
    <NodeDrawerContext.Provider value={{ viewNode, setViewNode }}>
      <div className="workflow-canvas">
        <TriggerConfig />
        <div className={branchBlockClass}>
          <Branch entry={entry} />
        </div>
        <div className={cx('end', nodeCardClass)}>
          <div className={cx(nodeMetaClass)}>
            <Tag color="#333">{lang('End')}</Tag>
          </div>
        </div>
      </div>
      <NodeDrawer />
    </NodeDrawerContext.Provider>
  );
}
