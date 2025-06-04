/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FormDialog } from '@formily/antd-v5';
import { createSchemaField, ISchema, observer } from '@formily/react';
import { message } from 'antd';
import React from 'react';
import { useFlowModel } from '../../../../hooks';
import { ActionStepDefinition } from '../../../../types';

const SchemaField = createSchemaField();

// 创建两个组件版本，一个使用props传递的model，一个使用hook获取model
interface ModelProvidedProps {
  model: any;
  flowKey: string;
  stepKey: string;
  dialogWidth?: number | string; // 对话框宽度
  dialogTitle?: string; // 自定义对话框标题
}

interface ModelByIdProps {
  uid: string;
  flowKey: string;
  stepKey: string;
  modelClassName: string;
  dialogWidth?: number | string; // 对话框宽度
  dialogTitle?: string; // 自定义对话框标题
}

type StepSettingsDialogProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: StepSettingsDialogProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * StepSettingsDialog组件 - 使用 FormDialog 显示单个步骤的配置界面
 * 支持两种使用方式：
 * 1. 直接提供model: openStepSettingsDialog({ model: myModel, flowKey: "workflow1", stepKey: "step1" })
 * 2. 通过uid和modelClassName获取model: openStepSettingsDialog({ uid: "model1", modelClassName: "MyModel", flowKey: "workflow1", stepKey: "step1" })
 * @param props.dialogWidth 对话框宽度，默认为600
 * @param props.dialogTitle 自定义对话框标题，默认使用step的title
 * @returns Promise<any> 返回表单提交的值
 */
const openStepSettingsDialog = async (props: StepSettingsDialogProps): Promise<any> => {
  if (isModelByIdProps(props)) {
    return openStepSettingsDialogWithModelById(props);
  } else {
    return openStepSettingsDialogWithModel(props);
  }
};

// 使用传入的model
const openStepSettingsDialogWithModel = async ({
  model,
  flowKey,
  stepKey,
  dialogWidth = 600,
  dialogTitle,
}: ModelProvidedProps): Promise<any> => {
  if (!model) {
    message.error('提供的模型无效');
    throw new Error('提供的模型无效');
  }

  return openStepSettingsDialogContent({
    model,
    flowKey,
    stepKey,
    dialogWidth,
    dialogTitle,
  });
};

// 通过useModelById hook获取model (这个需要在React组件中调用)
const openStepSettingsDialogWithModelById = async ({
  uid,
  flowKey,
  stepKey,
  modelClassName,
  dialogWidth = 600,
  dialogTitle,
}: ModelByIdProps): Promise<any> => {
  // 这里需要一个临时的React组件来使用hook
  return new Promise((resolve, reject) => {
    const TempComponent = observer(() => {
      const model = useFlowModel(uid, modelClassName);

      React.useEffect(() => {
        if (model) {
          openStepSettingsDialogContent({
            model,
            flowKey,
            stepKey,
            dialogWidth,
            dialogTitle,
          })
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error(`未找到ID为 ${uid} 的模型`));
        }
      }, [model]);

      return null;
    });

    // 临时渲染组件以获取model
    import('react-dom').then(({ render, unmountComponentAtNode }) => {
      const div = document.createElement('div');
      document.body.appendChild(div);
      render(<TempComponent />, div);

      // 清理
      setTimeout(() => {
        unmountComponentAtNode(div);
        document.body.removeChild(div);
      }, 100);
    });
  });
};

// 核心的FormDialog逻辑
const openStepSettingsDialogContent = async ({
  model,
  flowKey,
  stepKey,
  dialogWidth,
  dialogTitle,
}: {
  model: any;
  flowKey: string;
  stepKey: string;
  dialogWidth: number | string;
  dialogTitle?: string;
}): Promise<any> => {
  // 获取流程和步骤信息
  const flow = model.getFlow(flowKey);
  const step = flow?.steps?.[stepKey];

  if (!flow) {
    message.error(`未找到Key为 ${flowKey} 的流程`);
    throw new Error(`未找到Key为 ${flowKey} 的流程`);
  }

  if (!step) {
    message.error(`未找到Key为 ${stepKey} 的步骤`);
    throw new Error(`未找到Key为 ${stepKey} 的步骤`);
  }

  const title = dialogTitle || (step ? `${step.title || stepKey} - 配置` : `步骤配置 - ${stepKey}`);

  // 获取可配置的步骤信息
  const stepDefinition = step as ActionStepDefinition;
  const stepUiSchema = stepDefinition.uiSchema || {};

  // 如果step使用了action，也获取action的uiSchema
  let actionUiSchema = {};
  if (stepDefinition.use) {
    const action = model.flowEngine?.getAction?.(stepDefinition.use);
    if (action && action.uiSchema) {
      actionUiSchema = action.uiSchema;
    }
  }

  // 合并uiSchema，确保step的uiSchema优先级更高
  const mergedUiSchema = { ...actionUiSchema };
  Object.entries(stepUiSchema).forEach(([fieldKey, schema]) => {
    if (mergedUiSchema[fieldKey]) {
      mergedUiSchema[fieldKey] = { ...mergedUiSchema[fieldKey], ...schema };
    } else {
      mergedUiSchema[fieldKey] = schema;
    }
  });

  // 如果没有可配置的UI Schema，显示提示
  if (Object.keys(mergedUiSchema).length === 0) {
    message.info('此步骤没有可配置的参数');
    return {};
  }

  // 获取初始值
  const stepParams = model.getStepParams(flowKey, stepKey) || {};
  const defaultParams = stepDefinition.defaultParams || {};
  const initialValues = { ...defaultParams, ...stepParams };

  // 构建表单Schema
  const formSchema: ISchema = {
    type: 'object',
    properties: {
      layout: {
        type: 'void',
        'x-component': 'FormLayout',
        'x-component-props': {
          layout: 'vertical', // 垂直布局
        },
        properties: mergedUiSchema,
      },
    },
  };

  // 创建FormDialog
  const formDialog = FormDialog(
    {
      title,
      width: dialogWidth,
      okText: '确认',
      cancelText: '取消',
      destroyOnClose: true,
      maskClosable: false,
      style: { top: 20 },
    },
    (form) => {
      const flowEngine = model.flowEngine || {};

      return (
        <SchemaField
          schema={formSchema}
          components={{
            ...flowEngine.flowSettings?.components,
          }}
          scope={{
            ...flowEngine.flowSettings?.scopes,
          }}
        />
      );
    },
  );

  // 设置保存回调
  formDialog.forConfirm(async (payload, next) => {
    try {
      // 获取表单当前值
      const currentValues = payload.values;
      model.setStepParams(flowKey, stepKey, currentValues);
      await model.save();
      message.success('配置已保存');
      next(payload);
    } catch (error) {
      console.error('保存配置时出错:', error);
      message.error('保存配置时出错，请检查控制台');
      throw error;
    }
  });

  formDialog.forCancel(async (payload, next) => next(payload));

  // 打开对话框
  return formDialog.open({
    initialValues,
  });
};

export { openStepSettingsDialog };
