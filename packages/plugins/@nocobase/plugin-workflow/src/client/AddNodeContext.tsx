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
  FormItem,
  SchemaComponent,
  useActionContext,
  useAPIClient,
  useCancelAction,
} from '@nocobase/client';

import { useFlowContext } from './FlowContext';
import { lang, NAMESPACE } from './locale';
import { RadioWithTooltip } from './components';

function useAddNodeSubmitAction() {
  const form = useForm();
  return {
    async run() {
      console.log('=======', form.values);
    },
  };
}

const AddNodeContext = createContext(null);

export function useAddNodeContext() {
  return useContext(AddNodeContext);
}

const defaultBranchingOptions = [
  {
    label: `{{t('After end of branches', { ns: "${NAMESPACE}" })}}`,
    value: false,
  },
  {
    label: `{{t('Inside of branch', { ns: "${NAMESPACE}" })}}`,
    value: 0,
  },
];

const DownstreamBranchIndex = observer((props) => {
  const { presetting } = useAddNodeContext();
  const { nodes } = useFlowContext();
  const { values } = useForm();
  const options = useMemo(() => {
    if (!presetting?.instruction) {
      return [];
    }
    const { instruction, upstream, branchIndex } = presetting || {};
    const downstream = upstream
      ? nodes.find((item) => item.upstreamId === upstream.id && item.branchIndex === branchIndex)
      : nodes.find((item) => item.upstreamId === null);
    if (!downstream) {
      return [];
    }
    const branching =
      typeof instruction.branching === 'function' ? instruction.branching(values.config) : instruction.branching;
    if (!branching) {
      return [];
    }
    return branching === true ? defaultBranchingOptions : branching;
  }, [presetting, nodes, values.config]);

  if (!options.length) {
    return null;
  }

  return (
    <SchemaComponent
      components={{
        RadioWithTooltip,
      }}
      schema={{
        name: `${presetting?.type ?? 'unknown'}-${presetting?.upstream?.id ?? 'root'}-${presetting?.branchIndex}`,
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

function PresetFieldset({ useSchema }) {
  const schema = useSchema();
  return <SchemaComponent schema={schema} />;
}

export function AddNodeContextProvider(props) {
  const api = useAPIClient();
  const [creating, setCreating] = useState(null);
  const [presetting, setPresetting] = useState(null);
  const [formValueChanged, setFormValueChanged] = useState(false);
  const { workflow, refresh } = useFlowContext() ?? {};

  const form = useMemo(() => {
    return createForm({
      initialValues: {},
      values: {},
    });
  }, [presetting]);

  const onModalCancel = useCallback(
    (visible) => {
      if (!visible) {
        // form.setValues({});
        // form.clearFormGraph('.config', true);
        form.reset();
        setTimeout(() => {
          setPresetting(null);
        });
      }
    },
    [form],
  );

  const onCreate = useCallback(
    async ({ type, title, config, upstream, branchIndex }) => {
      setCreating({ upstream, branchIndex });
      try {
        await api.resource('workflows.nodes', workflow.id).create({
          values: {
            type,
            upstreamId: upstream?.id ?? null,
            branchIndex,
            title,
            config,
          },
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

  const usePresetSchema = useCallback(() => presetting?.instruction.presetFieldset, [presetting]);

  return (
    <AddNodeContext.Provider value={{ onPreset: setPresetting, presetting, onCreate, creating }}>
      {props.children}
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
          }}
          scope={{
            useCancelAction,
            useAddNodeSubmitAction,
            usePresetSchema,
          }}
          schema={{
            name: `modal`,
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
                'x-component-props': {
                  useSchema: '{{ usePresetSchema }}',
                },
                // properties: configSchema,
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
