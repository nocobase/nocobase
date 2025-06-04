/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect } from 'react';
import { Modal, Alert, message } from 'antd';
import { useFlowModel } from '../../../../hooks';
import { observer } from '@formily/react';
import FlowSettings from './FlowSettings';

// 创建两个组件版本，一个使用props传递的model，一个使用hook获取model
interface ModelProvidedProps {
  model: any;
  flowKey: string;
  visible: boolean;
  onClose: () => void;
  modalWidth?: number | string; // 弹窗宽度
  modalTitle?: string; // 自定义弹窗标题
}

interface ModelByIdProps {
  uid: string;
  flowKey: string;
  modelClassName: string;
  visible: boolean;
  onClose: () => void;
  modalWidth?: number | string; // 弹窗宽度
  modalTitle?: string; // 自定义弹窗标题
}

type FlowSettingsModalProps = ModelProvidedProps | ModelByIdProps;

// 判断是否是通过ID获取模型的props
const isModelByIdProps = (props: FlowSettingsModalProps): props is ModelByIdProps => {
  return 'uid' in props && 'modelClassName' in props && Boolean(props.uid) && Boolean(props.modelClassName);
};

/**
 * FlowSettingsModal组件 - 在弹窗中显示单个流程的配置界面
 * 支持两种使用方式：
 * 1. 直接提供model: <FlowSettingsModal model={myModel} flowKey="workflow1" visible={true} onClose={handleClose} />
 * 2. 通过uid和modelClassName获取model: <FlowSettingsModal uid="model1" modelClassName="MyModel" flowKey="workflow1" visible={true} onClose={handleClose} />
 * @param props.visible 是否显示弹窗
 * @param props.onClose 关闭弹窗的回调函数
 * @param props.modalWidth 弹窗宽度，默认为800
 * @param props.modalTitle 自定义弹窗标题，默认使用flow的title
 */
const FlowSettingsModal: React.FC<FlowSettingsModalProps> = (props) => {
  if (isModelByIdProps(props)) {
    return <FlowSettingsModalWithModelById {...props} />;
  } else {
    return <FlowSettingsModalWithModel {...props} />;
  }
};

// 使用传入的model
const FlowSettingsModalWithModel: React.FC<ModelProvidedProps> = observer(
  ({ model, flowKey, visible, onClose, modalWidth = 800, modalTitle }) => {
    if (!model) {
      return (
        <Modal title="错误" open={visible} onCancel={onClose} footer={null} width={modalWidth}>
          <Alert message="提供的模型无效" type="error" />
        </Modal>
      );
    }

    return (
      <FlowSettingsModalContent
        model={model}
        flowKey={flowKey}
        visible={visible}
        onClose={onClose}
        modalWidth={modalWidth}
        modalTitle={modalTitle}
      />
    );
  },
);

// 通过useModelById hook获取model
const FlowSettingsModalWithModelById: React.FC<ModelByIdProps> = observer(
  ({ uid, flowKey, modelClassName, visible, onClose, modalWidth = 800, modalTitle }) => {
    const model = useFlowModel(uid, modelClassName);

    if (!model) {
      return (
        <Modal title="错误" open={visible} onCancel={onClose} footer={null} width={modalWidth}>
          <Alert message={`未找到ID为 ${uid} 的模型`} type="error" />
        </Modal>
      );
    }

    return (
      <FlowSettingsModalContent
        model={model}
        flowKey={flowKey}
        visible={visible}
        onClose={onClose}
        modalWidth={modalWidth}
        modalTitle={modalTitle}
      />
    );
  },
);

// 提取核心渲染逻辑到一个共享组件
interface FlowSettingsModalContentProps {
  model: any;
  flowKey: string;
  visible: boolean;
  onClose: () => void;
  modalWidth: number | string;
  modalTitle?: string;
}

const FlowSettingsModalContent: React.FC<FlowSettingsModalContentProps> = observer(
  ({ model, flowKey, visible, onClose, modalWidth, modalTitle }) => {
    const [shouldSave, setShouldSave] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 获取流程信息用于显示标题
    const flow = model.getFlow(flowKey);
    const title = modalTitle || (flow ? `${flow.title || flow.key} - 配置` : `流程配置 - ${flowKey}`);

    // 处理确认按钮点击
    const handleOk = async () => {
      setIsSaving(true);
      setShouldSave(true);
    };

    // 处理取消按钮点击
    const handleCancel = () => {
      onClose();
    };

    // FlowSettings的保存回调
    const handleFlowSettingsSave = (values: any) => {
      message.success('配置已保存');
      setIsSaving(false);
      setShouldSave(false);
      onClose();
    };

    // FlowSettings的保存错误回调
    const handleFlowSettingsError = (error: any) => {
      console.error('保存配置时出错:', error);
      message.error('保存配置时出错，请检查控制台');
      setIsSaving(false);
      setShouldSave(false);
    };

    // 重置shouldSave状态，当弹窗关闭时
    useEffect(() => {
      if (!visible) {
        setShouldSave(false);
        setIsSaving(false);
      }
    }, [visible]);

    if (!flow) {
      return (
        <Modal title="错误" open={visible} onCancel={onClose} footer={null} width={modalWidth}>
          <Alert message={`未找到Key为 ${flowKey} 的流程`} type="error" />
        </Modal>
      );
    }

    return (
      <Modal
        title={title}
        open={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="确认"
        cancelText="取消"
        width={modalWidth}
        destroyOnClose={true}
        maskClosable={false}
        confirmLoading={isSaving}
        style={{ top: 20 }}
        styles={{
          body: {
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            padding: '16px 24px',
          },
        }}
      >
        <FlowSettings
          model={model}
          flowKey={flowKey}
          onSave={handleFlowSettingsSave}
          onError={handleFlowSettingsError}
          shouldSave={shouldSave}
          showActions={false}
        />
      </Modal>
    );
  },
);

export { FlowSettingsModal };
