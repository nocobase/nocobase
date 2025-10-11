/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createForm } from '@formily/core';
import { observer, useForm } from '@formily/react';

import {
  ActionContextProvider,
  css,
  cx,
  SchemaComponent,
  useActionContext,
  useAPIClient,
  useCancelAction,
  useCompile,
  usePlugin,
} from '@nocobase/client';

import WorkflowPlugin, { Instruction, useStyles, useWorkflowExecuted } from '.';
import { useFlowContext } from './FlowContext';
import { lang, NAMESPACE } from './locale';
import { RadioWithTooltip } from './components';
import { uid } from '@nocobase/utils/client';
import { Button, Dropdown, Menu } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { MenuItemGroupType } from 'antd/es/menu/interface';

interface AddButtonProps {
  upstream;
  branchIndex?: number | null;
  [key: string]: any;
}

export function AddButton(props: AddButtonProps) {
  const { upstream, branchIndex = null } = props;
  const { workflow } = useFlowContext() ?? {};
  const { styles } = useStyles();
  const addNodeContext = useAddNodeContext();
  const executed = useWorkflowExecuted();
  const onOpen = useCallback(
    () => addNodeContext.onMenuOpen({ upstream, branchIndex }),
    [addNodeContext, upstream, branchIndex],
  );

  if (!workflow) {
    return null;
  }

  return (
    <div className={cx(styles.addButtonClass, 'workflow-add-node-button')}>
      {executed ? (
        <span className="ant-btn-placeholder" />
      ) : (
        <Button
          aria-label={props['aria-label'] || 'add-button'}
          shape="circle"
          icon={<PlusOutlined />}
          loading={
            addNodeContext.creating?.upstreamId == upstream?.id && addNodeContext.creating?.branchIndex === branchIndex
          }
          size="small"
          onClick={onOpen}
          className={cx({
            anchoring:
              addNodeContext.anchor?.upstream === upstream && addNodeContext.anchor?.branchIndex === branchIndex,
          })}
        />
      )}
    </div>
  );
}

function useAddNodeSubmitAction() {
  const form = useForm();
  const api = useAPIClient();
  const { workflow, refresh } = useFlowContext();
  const { presetting, setPresetting, setCreating } = useAddNodeContext();
  const ctx = useActionContext();
  return {
    async run() {
      if (!presetting) {
        return;
      }
      await form.submit();
      setCreating(presetting.data);
      try {
        const {
          data: { data: newNode },
        } = await api.resource('workflows.nodes', workflow.id).create({
          values: {
            ...presetting.data,
            config: {
              ...presetting.data.config,
              ...form.values.config,
            },
          },
        });
        if (typeof form.values.downstreamBranchIndex === 'number' && newNode.downstreamId) {
          await api.resource('flow_nodes').update({
            filterByTk: newNode.downstreamId,
            values: {
              branchIndex: form.values.downstreamBranchIndex,
              upstream: {
                id: newNode.id,
                downstreamId: null,
              },
            },
            updateAssociationValues: ['upstream'],
          });
        }
        ctx.setVisible(false);
        setPresetting(null);
        form.reset();
        refresh();
      } catch (err) {
        console.error(err);
      } finally {
        setCreating(null);
      }
    },
  };
}

const AddNodeContext = createContext(null);

export function useAddNodeContext() {
  return useContext(AddNodeContext);
}

const defaultBranchingOptions = [
  {
    value: 0,
  },
];

const DownstreamBranchIndex = observer((props) => {
  const { presetting } = useAddNodeContext();
  const { nodes } = useFlowContext();
  const { values } = useForm();
  const compile = useCompile();
  const options = useMemo(() => {
    if (!presetting?.instruction) {
      return [];
    }
    const { instruction, data } = presetting;
    const downstream = data.upstreamId
      ? nodes.find((item) => item.upstreamId === data.upstreamId && item.branchIndex === data.branchIndex)
      : nodes.find((item) => item.upstreamId === null);
    if (!downstream) {
      return [];
    }
    const branching =
      typeof instruction.branching === 'function' ? instruction.branching(values.config ?? {}) : instruction.branching;
    if (!branching) {
      return [];
    }
    const br = branching === true ? defaultBranchingOptions : branching;
    return [
      {
        label: lang('After end of branches'),
        value: false,
      },
      ...br.map((item) => ({
        ...item,
        label: item.label
          ? lang('Inside of "{{branchName}}" branch', { branchName: compile(item.label) })
          : lang('Inside of branch'),
      })),
    ];
  }, [presetting, nodes, values.config, compile]);

  if (!options.length) {
    return null;
  }

  const { data } = presetting;

  return (
    <SchemaComponent
      components={{
        RadioWithTooltip,
      }}
      schema={{
        name: `${data.type ?? 'unknown'}-${data.upstreamId ?? 'root'}-${data.branchIndex}`,
        type: 'void',
        properties: {
          downstreamBranchIndex: {
            type: 'number',
            title: lang('Move all downstream nodes to', { ns: NAMESPACE }),
            'x-decorator': 'FormItem',
            'x-component': 'RadioWithTooltip',
            'x-component-props': {
              options,
              direction: 'vertical',
            },
            default: false,
            required: true,
          },
        },
      }}
    />
  );

  // return (
  //   <FormItem label={lang('Move all downstream nodes to', { ns: NAMESPACE })}>
  //     <RadioWithTooltip {...props} options={options} defaultValue={-1} direction="vertical" />
  //   </FormItem>
  // );
});

function PresetFieldset() {
  const { presetting } = useAddNodeContext();
  if (!presetting?.instruction.presetFieldset) {
    return null;
  }
  return (
    <SchemaComponent
      schema={{
        type: 'void',
        properties: {
          config: {
            type: 'object',
            properties: presetting.instruction.presetFieldset,
          },
        },
      }}
    />
  );
}

function NodeMenu() {
  const compile = useCompile();
  const engine = usePlugin(WorkflowPlugin);
  const instructionList = Array.from(engine.instructions.getValues()) as Instruction[];
  const groupOptions = engine.useInstructionGroupOptions();
  const { anchor, onCreate, onMenuCancel } = useAddNodeContext();
  const { workflow } = useFlowContext() ?? {};

  const groups = useMemo(() => {
    return groupOptions
      .map((group): MenuItemGroupType => {
        const groupInstructions = instructionList.filter(
          (item) =>
            item.group === group.key && (item.isAvailable ? item.isAvailable({ engine, workflow, ...anchor }) : true),
        );

        return {
          ...group,
          type: 'group',
          children: groupInstructions.map((item) => ({
            role: 'button',
            'aria-label': item.type,
            key: item.type,
            label: compile(item.title),
            icon: item.icon,
          })),
        };
      })
      .filter((group) => group.children.length);
  }, [groupOptions, instructionList, engine, workflow, anchor, compile]);

  const onClick = useCallback(
    async ({ keyPath }) => {
      const [type] = keyPath;
      await onCreate({ type, ...anchor });
      onMenuCancel();
    },
    [anchor, onCreate],
  );

  return (
    <Menu
      items={groups}
      onClick={onClick}
      className={css`
        .ant-menu-item-group-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        &.ant-menu-root.ant-menu-vertical {
          border-inline-end: none;
        }
        .ant-menu-item {
          display: flex;
          align-items: center;
        }
      `}
    />
  );
}

export function AddNodeContextProvider(props) {
  const api = useAPIClient();
  const compile = useCompile();
  const engine = usePlugin(WorkflowPlugin);
  const [anchor, setAnchor] = useState(null);
  const [creating, setCreating] = useState(null);
  const [presetting, setPresetting] = useState(null);
  const [formValueChanged, setFormValueChanged] = useState(false);
  const { workflow, nodes, refresh } = useFlowContext() ?? {};

  const onMenuOpen = useCallback(({ upstream, branchIndex }) => {
    setAnchor({ upstream, branchIndex });
  }, []);
  const onMenuCancel = useCallback(() => {
    setAnchor(null);
  }, []);

  const form = useMemo(() => createForm(), []);

  const onModalCancel = useCallback(
    (visible) => {
      if (!visible) {
        form.reset();
        form.clearFormGraph('*');
        setPresetting(null);
      }
    },
    [form],
  );

  const create = useCallback(
    async (data) => {
      setCreating(data);
      try {
        await api.resource('workflows.nodes', workflow.id).create({
          values: data,
        });
        refresh();
      } catch (err) {
        console.error(err);
      } finally {
        setCreating(null);
      }
    },
    [api, refresh, workflow.id],
  );

  const onCreate = useCallback(
    async ({ type, upstream, branchIndex }) => {
      const instruction = engine.instructions.get(type);
      if (!instruction) {
        console.error(`Instruction "${type}" not found`);
        return;
      }
      const data = {
        key: uid(),
        type,
        upstreamId: upstream?.id ?? null,
        branchIndex,
        title: compile(instruction.title),
        config: instruction.createDefaultConfig?.() ?? {},
      };
      const downstream = upstream?.id
        ? nodes.find((item) => item.upstreamId === data.upstreamId && item.branchIndex === data.branchIndex)
        : nodes.find((item) => item.upstreamId === null);
      if (
        instruction.presetFieldset ||
        ((typeof instruction.branching === 'function' ? instruction.branching(data.config) : instruction.branching) &&
          downstream)
      ) {
        setPresetting({ data, instruction });
        return;
      }

      await create(data);
    },
    [compile, create, engine.instructions, nodes],
  );

  return (
    <AddNodeContext.Provider
      value={{ presetting, setPresetting, onCreate, creating, setCreating, anchor, onMenuOpen, onMenuCancel }}
    >
      {props.children}
      <ActionContextProvider
        value={{
          visible: Boolean(anchor),
          setVisible: onMenuCancel,
        }}
      >
        <SchemaComponent
          components={{
            NodeMenu,
          }}
          schema={{
            name: `nodes-menu`,
            type: 'void',
            'x-component': 'Action.Drawer',
            title: `{{ t("Add node", { ns: "${NAMESPACE}" }) }}`,
            properties: {
              menu: {
                type: 'void',
                'x-component': 'NodeMenu',
              },
            },
          }}
        />
      </ActionContextProvider>
      <ActionContextProvider
        value={{
          visible: Boolean(presetting),
          setVisible: onModalCancel,
          formValueChanged,
          setFormValueChanged,
          openSize: 'small',
        }}
      >
        <SchemaComponent
          components={{
            DownstreamBranchIndex,
            PresetFieldset,
          }}
          scope={{
            useCancelAction,
            useAddNodeSubmitAction,
          }}
          schema={{
            name: `preset-modal`,
            type: 'void',
            'x-decorator': 'FormV2',
            'x-decorator-props': {
              form,
            },
            'x-component': 'Action.Modal',
            title: `{{ t("Add node", { ns: "${NAMESPACE}" }) }}`,
            properties: {
              config: {
                type: 'void',
                'x-component': 'PresetFieldset',
              },
              downstreamBranchIndex: {
                type: 'void',
                'x-component': 'DownstreamBranchIndex',
              },
              footer: {
                'x-component': 'Action.Modal.Footer',
                properties: {
                  actions: {
                    type: 'void',
                    'x-component': 'ActionBar',
                    properties: {
                      cancel: {
                        type: 'void',
                        title: '{{ t("Cancel") }}',
                        'x-component': 'Action',
                        'x-component-props': {
                          useAction: '{{ useCancelAction }}',
                        },
                      },
                      submit: {
                        type: 'void',
                        title: `{{ t("Submit") }}`,
                        'x-component': 'Action',
                        'x-component-props': {
                          type: 'primary',
                          htmlType: 'submit',
                          useAction: '{{ useAddNodeSubmitAction }}',
                        },
                      },
                    },
                  },
                },
              },
            },
          }}
        />
      </ActionContextProvider>
    </AddNodeContext.Provider>
  );
}
