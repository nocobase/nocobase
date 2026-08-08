/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/react';
import { Alert, Button, Form, Input, InputNumber, Select, Switch } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlowRuntimeContext } from '../../../../flowContext';
import { useFlowModelById } from '../../../../hooks';
import { FlowModel } from '../../../../models';
import { observer } from '../../../../reactive';
import type { ParamObject, StepDefinition } from '../../../../types';
import {
  createFlowWithSettingSteps,
  getFlowSettingSteps,
  getT,
  resolveDefaultParams,
  resolveStepUiSchema,
  resolveUiMode,
  setupRuntimeContextSteps,
  shouldHideStepInSettings,
} from '../../../../utils';

interface ModelProvidedProps {
  model: FlowModel;
  flowKey: string;
}

interface ModelByIdProps {
  uid: string;
  flowKey: string;
  modelClassName: string;
}

type FlowSettingsProps = ModelProvidedProps | ModelByIdProps;

interface ConfigurableStep {
  stepKey: string;
  step: StepDefinition;
  uiSchema: Record<string, ISchema>;
  ctx: FlowRuntimeContext;
  actionDefaultParams: ParamObject;
  beforeParamsSave?: StepDefinition['beforeParamsSave'];
  afterParamsSave?: StepDefinition['afterParamsSave'];
}

const isModelByIdProps = (props: FlowSettingsProps): props is ModelByIdProps =>
  'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);

const FlowSettings: React.FC<FlowSettingsProps> = (props) => {
  if (isModelByIdProps(props)) {
    return <FlowSettingsWithModelById {...props} />;
  }
  return <FlowSettingsWithModel {...props} />;
};

const FlowSettingsWithModel: React.FC<ModelProvidedProps> = observer(({ model, flowKey }) => {
  const t = useMemo(() => getT(model), [model]);
  if (!model) {
    return <Alert message={t('Invalid model provided')} type="error" />;
  }
  return <FlowSettingsContent model={model} flowKey={flowKey} />;
});

const FlowSettingsWithModelById: React.FC<ModelByIdProps> = observer(({ uid, flowKey, modelClassName }) => {
  const model = useFlowModelById(uid, modelClassName);
  if (!model) {
    return <Alert message={`Flow model '${uid}' not found`} type="error" />;
  }
  return <FlowSettingsContent model={model} flowKey={flowKey} />;
});

const FlowSettingsContent: React.FC<ModelProvidedProps> = observer(({ model, flowKey }) => {
  const [form] = Form.useForm<Record<string, ParamObject>>();
  const t = useMemo(() => getT(model), [model]);
  const flow = model.getFlow(flowKey);
  const [configurableSteps, setConfigurableSteps] = useState<ConfigurableStep[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const refresh = () => setRefreshTick((value) => value + 1);
    model.emitter?.on('onStepParamsChanged', refresh);
    return () => model.emitter?.off('onStepParamsChanged', refresh);
  }, [model]);

  useEffect(() => {
    let mounted = true;

    const buildConfigurableSteps = async () => {
      if (!flow) {
        if (mounted) setConfigurableSteps([]);
        return;
      }

      const flowSteps = await getFlowSettingSteps(model, flow, flowKey);
      const flowForSettings = createFlowWithSettingSteps(flow, flowSteps, flowKey);
      const steps: ConfigurableStep[] = [];

      for (const [stepKey, step] of Object.entries(flowSteps)) {
        if (await shouldHideStepInSettings(model, flowForSettings, step)) {
          continue;
        }

        const ctx = new FlowRuntimeContext(model, flowKey, 'settings');
        setupRuntimeContextSteps(ctx, flowSteps, model, flowKey);
        ctx.defineProperty('currentStep', { value: step });
        await resolveUiMode(step.uiMode, ctx);

        const uiSchema = await resolveStepUiSchema(model, flowForSettings, step);
        if (!uiSchema || Object.keys(uiSchema).length === 0) {
          continue;
        }

        const action = step.use ? model.getAction?.(step.use) : undefined;
        steps.push({
          stepKey,
          step,
          uiSchema,
          ctx,
          actionDefaultParams: (action?.defaultParams || {}) as ParamObject,
          beforeParamsSave: step.beforeParamsSave || action?.beforeParamsSave,
          afterParamsSave: step.afterParamsSave || action?.afterParamsSave,
        });
      }

      if (!mounted) return;
      setConfigurableSteps(steps);

      const values: Record<string, ParamObject> = {};
      for (const item of steps) {
        const actionDefaults = await resolveDefaultParams(item.actionDefaultParams, item.ctx);
        const stepDefaults = await resolveDefaultParams(item.step.defaultParams, item.ctx);
        values[item.stepKey] = {
          ...(actionDefaults || {}),
          ...(stepDefaults || {}),
          ...(model.getStepParams(flowKey, item.stepKey) || {}),
        };
      }
      if (mounted) form.setFieldsValue(values);
    };

    buildConfigurableSteps().catch((error) => {
      console.warn(`FlowSettings: failed to build embedded settings for flow '${flowKey}'.`, error);
      if (mounted) setConfigurableSteps([]);
    });

    return () => {
      mounted = false;
    };
  }, [flow, flowKey, form, model, refreshTick]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      const savedSteps: Array<{ item: ConfigurableStep; params: ParamObject; previousParams: ParamObject }> = [];

      for (const item of configurableSteps) {
        const params = values[item.stepKey] || {};
        const previousParams = model.getStepParams(flowKey, item.stepKey) || {};
        if (item.step.persistParams !== false) {
          model.setStepParams(flowKey, item.stepKey, params);
        }
        if (item.beforeParamsSave) {
          await item.beforeParamsSave(item.ctx, params, previousParams);
        }
        savedSteps.push({ item, params, previousParams });
      }

      await model.saveStepParams();
      for (const { item, params, previousParams } of savedSteps) {
        if (item.afterParamsSave) {
          await item.afterParamsSave(item.ctx, params, previousParams);
        }
      }
      model.context.message?.success?.(t('Configuration saved'));
    } catch (error) {
      console.error(t('Error saving configuration'), ':', error);
      model.context.message?.error?.(t('Error saving configuration, please check console'));
    } finally {
      setSaving(false);
    }
  }, [configurableSteps, flowKey, form, model, t]);

  if (!flow) {
    return <Alert message={t('Flow with key {{flowKey}} not found', { flowKey })} type="error" />;
  }

  return (
    <Form form={form} layout="vertical">
      {configurableSteps.length === 0 ? (
        <Alert message={t('This flow has no configurable parameters')} type="info" />
      ) : (
        <>
          {configurableSteps.flatMap(({ stepKey, uiSchema }) =>
            Object.entries(uiSchema).map(([fieldKey, schema]) => {
              const componentProps = schema['x-component-props'] || {};
              const componentName = schema['x-component'];
              const registeredComponent =
                typeof componentName === 'string'
                  ? model.flowEngine?.flowSettings?.components?.[componentName]
                  : componentName;
              let input: React.ReactNode;
              switch (componentName) {
                case 'Select':
                  input = <Select options={schema.enum || []} {...componentProps} />;
                  break;
                case 'InputNumber':
                  input = <InputNumber {...componentProps} />;
                  break;
                case 'Switch':
                  input = <Switch {...componentProps} />;
                  break;
                case 'Input.TextArea':
                  input = <Input.TextArea {...componentProps} />;
                  break;
                default:
                  input = registeredComponent ? (
                    React.createElement(registeredComponent as React.ElementType, componentProps)
                  ) : (
                    <Input {...componentProps} />
                  );
              }

              return (
                <Form.Item
                  key={`${stepKey}.${fieldKey}`}
                  name={[stepKey, fieldKey]}
                  label={schema.title || fieldKey}
                  valuePropName={componentName === 'Switch' ? 'checked' : 'value'}
                  rules={schema.required ? [{ required: true, message: t('This field is required') }] : []}
                >
                  {input}
                </Form.Item>
              );
            }),
          )}
          <Button type="primary" loading={saving} onClick={handleSave}>
            {t('Save')}
          </Button>
        </>
      )}
    </Form>
  );
});

export { FlowSettings };
