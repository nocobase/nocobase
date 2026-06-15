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
import { getInstructionAvailable } from './utils';
import { lang, NAMESPACE } from './locale';
import { RadioWithTooltip } from './components';
import { uid } from '@nocobase/utils/client';
import { Button, Dropdown, Menu, Tooltip } from 'antd';
import { SnippetsOutlined, PlusOutlined } from '@ant-design/icons';
import { MenuItemGroupType } from 'antd/es/menu/interface';
import { useBranchContext } from './BranchContext';
import { useNodeDragContext } from './NodeDragContext';
import { useNodeClipboardContext } from './NodeClipboardContext';
import { useFlowEngine } from '@nocobase/flow-engine';
import { useMemoizedFn } from 'ahooks';
import { PresetDialogForm } from '../client-v2/canvas/AddNodeContext';
import { resolveLegacyPresetRenderMode } from '../client-v2/canvas/nodeRenderDispatch';

interface AddButtonProps {
  upstream;
  branchIndex?: number | null;
  [key: string]: any;
}

function AddButtonPlaceholder() {
  const { styles } = useStyles();
  return (
    <div className={cx(styles.addButtonClass, 'workflow-add-node-button')}>
      <span className="ant-btn-placeholder" />
    </div>
  );
}

export function AddButton(props: AddButtonProps) {
  const { upstream, branchIndex = null } = props;
  const { styles } = useStyles();
  const { workflow } = useFlowContext() ?? {};
  const addNodeContext = useAddNodeContext();
  const executed = useWorkflowExecuted();
  const branchContext = useBranchContext();

  const onOpen = useCallback(
    () =>
      addNodeContext?.onMenuOpen?.({
        upstream,
        branchIndex,
        branchContext: {
          syncOnly: branchContext?.syncOnly ?? false,
        },
      }),
    [addNodeContext, upstream, branchIndex, branchContext?.syncOnly],
  );

  if (!workflow || !addNodeContext || branchContext?.addable === false) {
    return <AddButtonPlaceholder />;
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

function AddNodeDropZone(props: AddButtonProps) {
  const { upstream, branchIndex = null } = props;
  const branchContext = useBranchContext();
  const { styles } = useStyles();
  const dragContext = useNodeDragContext();
  const target = useMemo(() => ({ upstream, branchIndex }), [upstream, branchIndex]);
  const impact = dragContext?.getDropImpact?.(target);
  const status = impact?.status ?? 'disabled';
  const disabled = branchContext?.addable === false || status === 'disabled';
  const registerDropZone = dragContext?.registerDropZone;
  const getDropKey = dragContext?.getDropKey;
  const dropKey = getDropKey?.(target);
  const isActive = Boolean(dropKey && dragContext?.activeDropKey === dropKey);
  const zoneRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!registerDropZone || !zoneRef.current || disabled) {
      return;
    }
    return registerDropZone(target, zoneRef.current);
  }, [registerDropZone, disabled, target]);

  return (
    <div className={cx(styles.addButtonClass, 'workflow-add-node-button')}>
      <div
        role="button"
        aria-label={props['aria-label'] || 'drop-zone'}
        ref={zoneRef}
        className={cx(styles.dropZoneClass, {
          'drop-safe': status === 'safe',
          'drop-warning': status === 'warning',
          'drop-active': isActive,
          'drop-disabled': disabled,
        })}
      />
    </div>
  );
}

function AddNodePasteZone(props: AddButtonProps) {
  const { upstream, branchIndex = null } = props;
  const branchContext = useBranchContext();
  const { styles } = useStyles();
  const clipboard = useNodeClipboardContext();
  const target = useMemo(() => ({ upstream, branchIndex }), [upstream, branchIndex]);
  const impact = clipboard?.getPasteImpact?.(target);
  const status = impact?.status ?? 'disabled';
  const disabled = branchContext?.addable === false || status === 'disabled';

  const onClick = useCallback(() => {
    if (!disabled) {
      clipboard?.pasteNode?.(target);
    }
  }, [clipboard, disabled, target]);

  return (
    <div className={cx(styles.addButtonClass, 'workflow-add-node-button')}>
      <Button
        aria-label={props['aria-label'] || 'paste-zone'}
        shape="circle"
        icon={<SnippetsOutlined />}
        size="small"
        disabled={disabled}
        onClick={onClick}
        className={cx(styles.pasteButtonClass, {
          'paste-safe': status === 'safe',
          'paste-warning': status === 'warning',
        })}
      />
    </div>
  );
}

export function AddNodeSlot(props: AddButtonProps) {
  const branchContext = useBranchContext();
  const dragContext = useNodeDragContext();
  const clipboard = useNodeClipboardContext();
  const executed = useWorkflowExecuted();
  if (branchContext?.addable === false) {
    return <AddButtonPlaceholder />;
  }
  if (dragContext?.dragging) {
    return <AddNodeDropZone {...props} />;
  }
  if (clipboard?.clipboard && !executed) {
    return <AddNodePasteZone {...props} />;
  }
  return <AddButton {...props} />;
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
      components={presetting.instruction.components}
      scope={presetting.instruction.scope}
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
        const groupInstructions = instructionList.filter((item) => item.group === group.key);

        return {
          ...group,
          type: 'group',
          children: groupInstructions.map((item) => {
            const unavailableMessage = getInstructionAvailable(item, { engine, workflow, ...anchor });
            const title = compile(item.title);
            return {
              role: 'button',
              'aria-label': item.type,
              key: item.type,
              label: unavailableMessage ? <Tooltip title={unavailableMessage}>{title}</Tooltip> : title,
              icon: item.icon,
              disabled: Boolean(unavailableMessage),
            };
          }),
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
    [anchor, onCreate, onMenuCancel],
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
  const flowEngine = useFlowEngine();
  const engine = usePlugin(WorkflowPlugin);
  const [anchor, setAnchor] = useState(null);
  const [creating, setCreating] = useState(null);
  const [presetting, setPresetting] = useState(null);
  const [formValueChanged, setFormValueChanged] = useState(false);
  const { workflow, nodes, refresh } = useFlowContext() ?? {};

  const onMenuOpen = useCallback(({ upstream, branchIndex, branchContext }) => {
    setAnchor({ upstream, branchIndex, branchContext });
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

  // Create a node from the v2 preset dialog's submit values, then (when a branching node landed above an existing
  // downstream node and the user chose a branch) re-parent that downstream node — mirrors v1's `useAddNodeSubmitAction`
  // and v2's `createNode`. Used only on the modern (`PresetFieldsetLoader`) path.
  const createModernNode = useMemoizedFn(async (anchor, instruction, presetValues) => {
    const { downstreamBranchIndex, config: presetConfig } = presetValues ?? {};
    const values = {
      key: uid(),
      type: instruction.type,
      upstreamId: anchor.upstream?.id ?? null,
      branchIndex: anchor.branchIndex ?? null,
      title: flowEngine.context.t(instruction.title),
      config: { ...(instruction.createDefaultConfig?.() ?? {}), ...(presetConfig ?? {}) },
    };
    setCreating(values);
    try {
      const {
        data: { data: newNode },
      } = await api.resource('workflows.nodes', workflow.id).create({ values });
      if (typeof downstreamBranchIndex === 'number' && newNode?.downstreamId) {
        await api.resource('flow_nodes').update({
          filterByTk: newNode.downstreamId,
          values: {
            branchIndex: downstreamBranchIndex,
            upstream: { id: newNode.id, downstreamId: null },
          },
          updateAssociationValues: ['upstream'],
        });
      }
      refresh();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setCreating(null);
    }
  });

  const onCreate = useMemoizedFn(async ({ type, upstream, branchIndex, branchContext }) => {
    const instruction = engine.instructions.get(type);
    if (!instruction) {
      console.error(`Instruction "${type}" not found`);
      return;
    }

    const unavailableMessage = getInstructionAvailable(instruction, {
      engine,
      workflow,
      upstream,
      branchIndex,
      branchContext,
    });
    if (unavailableMessage) {
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

    // Preset dispatch (ADR-0003), v1-first like the card/drawer surfaces: a legacy `presetFieldset` (with entries)
    // keeps the Formily preset modal; only a node that dropped it falls through to the inherited `PresetFieldsetLoader`
    // and the v2 antd preset dialog (`ctx.viewer.dialog`), maintained once in client-v2.
    const presetMode = resolveLegacyPresetRenderMode(instruction);

    if (presetMode === 'legacy-fieldset') {
      setPresetting({ data, instruction });
      return;
    }

    if (presetMode === 'modern-loader') {
      const anchor = { upstream, branchIndex };
      flowEngine.context.viewer.dialog({
        width: 520,
        closable: true,
        content: () => (
          <PresetDialogForm
            instruction={instruction}
            hasDownstream={Boolean(downstream)}
            onSubmit={(values) => createModernNode(anchor, instruction, values)}
          />
        ),
      });
      return;
    }

    // No preset form on either side — still show the v1 branch-preservation modal when the node branches into an
    // existing downstream.
    if (
      (typeof instruction.branching === 'function' ? instruction.branching(data.config) : instruction.branching) &&
      downstream
    ) {
      setPresetting({ data, instruction });
      return;
    }

    await create(data);
  });

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
