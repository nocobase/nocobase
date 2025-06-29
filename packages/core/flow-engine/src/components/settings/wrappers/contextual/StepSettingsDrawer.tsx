/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createSchemaField, ISchema } from '@formily/react';
import { message, Button, Space } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StepSettingsDrawerProps } from '../../../../types';
import { resolveDefaultParams, resolveUiSchema, compileUiSchema, getT } from '../../../../utils';
import { StepSettingContextProvider, StepSettingContextType, useStepSettingContext } from './StepSettingContext';
import { toJS } from '@formily/reactive';

const SchemaField = createSchemaField();

/**
 * StepSettingsDrawer组件 - 使用自定义 Drawer 显示单个步骤的配置界面
 * @param props.model 模型实例
 * @param props.flowKey 流程Key
 * @param props.stepKey 步骤Key
 * @param props.drawerWidth 抽屉宽度，默认为600
 * @param props.drawerTitle 自定义抽屉标题，默认使用step的title
 * @returns Promise<any> 返回表单提交的值
 */
const openStepSettingsDrawer = async ({
  model,
  flowKey,
  stepKey,
  drawerWidth = 600,
  drawerTitle,
}: StepSettingsDrawerProps): Promise<any> => {
  const t = getT(model);

  if (!model) {
    message.error(t('Invalid model provided'));
    throw new Error(t('Invalid model provided'));
  }

  // 获取流程和步骤信息
  const flow = model.getFlow(flowKey);
  const step = flow?.steps?.[stepKey];

  if (!flow) {
    message.error(t('Flow with key {{flowKey}} not found', { flowKey }));
    throw new Error(t('Flow with key {{flowKey}} not found', { flowKey }));
  }

  if (!step) {
    message.error(t('Step with key {{stepKey}} not found', { stepKey }));
    throw new Error(t('Step with key {{stepKey}} not found', { stepKey }));
  }

  let title = step.title;

  // 创建参数解析上下文
  const paramsContext = {
    model,
    globals: model.flowEngine?.context || {},
    app: model.flowEngine?.context?.app,
  };

  const stepUiSchema = step.uiSchema || {};
  let actionDefaultParams = {};

  // 如果step使用了action，也获取action的uiSchema
  let actionUiSchema = {};
  if (step.use) {
    const action = model.flowEngine?.getAction?.(step.use);
    if (action && action.uiSchema) {
      actionUiSchema = action.uiSchema;
    }
    actionDefaultParams = action.defaultParams || {};
    title = title || action.title;
  }

  // 解析动态 uiSchema
  const resolvedActionUiSchema = await resolveUiSchema(actionUiSchema, paramsContext);
  const resolvedStepUiSchema = await resolveUiSchema(stepUiSchema, paramsContext);

  // 合并uiSchema，确保step的uiSchema优先级更高
  const mergedUiSchema = { ...toJS(resolvedActionUiSchema) };
  Object.entries(toJS(resolvedStepUiSchema)).forEach(([fieldKey, schema]) => {
    if (mergedUiSchema[fieldKey]) {
      mergedUiSchema[fieldKey] = { ...mergedUiSchema[fieldKey], ...schema };
    } else {
      mergedUiSchema[fieldKey] = schema;
    }
  });

  // 如果没有可配置的UI Schema，显示提示
  if (Object.keys(mergedUiSchema).length === 0) {
    message.info(t('This step has no configurable parameters'));
    return {};
  }

  // 获取初始值
  const stepParams = model.getStepParams(flowKey, stepKey) || {};

  const flowEngine = model.flowEngine;
  const scopes = {
    useStepSettingContext,
    ...flowEngine.flowSettings?.scopes,
  };

  // 解析 defaultParams
  const resolvedDefaultParams = await resolveDefaultParams(step.defaultParams, paramsContext);
  const resolveActionDefaultParams = await resolveDefaultParams(actionDefaultParams, paramsContext);
  const initialValues = { ...toJS(resolveActionDefaultParams), ...toJS(resolvedDefaultParams), ...toJS(stepParams) };

  // 构建表单Schema
  const formSchema: ISchema = {
    type: 'object',
    properties: {
      layout: {
        type: 'void',
        'x-component': 'FormLayout',
        'x-component-props': {
          layout: 'vertical',
        },
        properties: mergedUiSchema,
      },
    },
  };

  // 动态导入Formily组件
  let Form, createForm;
  try {
    ({ Form } = await import('@formily/antd-v5'));
    ({ createForm } = await import('@formily/core'));
  } catch (error) {
    throw new Error(`${t('Failed to import Formily components')}: ${error.message}`);
  }

  // 获取drawer API
  const drawer = model.flowEngine?.context?.drawer;
  if (!drawer) {
    throw new Error(t('Drawer API is not available, please ensure it is used within FlowEngineGlobalsContextProvider'));
  }

  return new Promise((resolve) => {
    // 用于跟踪Promise状态，避免重复调用resolve
    let isResolved = false;

    // 创建表单实例
    const form = createForm({
      initialValues: compileUiSchema(scopes, initialValues),
    });

    // 创建抽屉内容组件
    const DrawerContent: React.FC = () => {
      const { t } = useTranslation();
      const [loading, setLoading] = useState(false);

      const handleSubmit = async () => {
        try {
          setLoading(true);

          // 先获取表单当前值，然后验证
          const currentValues = form.values;
          await form.validate();

          // 保存配置
          model.setStepParams(flowKey, stepKey, currentValues);
          await model.save();

          message.success(t('Configuration saved'));
          isResolved = true;
          drawerRef.destroy();
          resolve(currentValues);
        } catch (error) {
          console.error(t('Error saving configuration'), ':', error);
          message.error(t('Error saving configuration, please check console'));
        } finally {
          setLoading(false);
        }
      };

      const handleCancel = () => {
        if (!isResolved) {
          isResolved = true;
          resolve(null);
        }
        drawerRef.destroy();
      };

      // 创建上下文值
      const contextValue: StepSettingContextType = {
        model,
        globals: model.flowEngine?.context || {},
        app: model.flowEngine?.context?.app,
        step,
        flow,
        flowKey,
        stepKey,
      };

      // 编译 formSchema 中的表达式
      const compiledFormSchema = compileUiSchema(scopes, formSchema);

      return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
            <Form form={form} layout="vertical">
              <StepSettingContextProvider value={contextValue}>
                <SchemaField
                  schema={compiledFormSchema}
                  components={{
                    ...flowEngine.flowSettings?.components,
                  }}
                  scope={scopes}
                />
              </StepSettingContextProvider>
            </Form>
          </div>
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
            }}
          >
            <Space>
              <Button onClick={handleCancel}>{t('Cancel')}</Button>
              <Button type="primary" loading={loading} onClick={handleSubmit}>
                {t('OK')}
              </Button>
            </Space>
          </div>
        </div>
      );
    };

    // 打开抽屉
    const drawerRef = drawer.open({
      title: drawerTitle || `${t(title)} - ${t('Configuration')}`,
      width: drawerWidth,
      content: <DrawerContent />,
      onClose: () => {
        // 只有在Promise还未被处理时才reject
        if (!isResolved) {
          isResolved = true;
          resolve(null);
        }
      },
    });
  });
};

export { openStepSettingsDrawer };
