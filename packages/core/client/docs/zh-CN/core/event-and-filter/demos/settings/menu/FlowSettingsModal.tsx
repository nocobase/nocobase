import React from 'react';
import { Modal, Alert, Button, message } from 'antd';
import { FlowEngine, useFlowModel } from '@nocobase/client';
import { observer } from '@formily/react';
import FlowSettings from '../simple/FlowSettings';

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
const FlowSettingsModalWithModel: React.FC<ModelProvidedProps> = observer(({ 
  model, 
  flowKey, 
  visible, 
  onClose, 
  modalWidth = 800,
  modalTitle 
}) => {
  if (!model) {
    return (
      <Modal
        title="错误"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={modalWidth}
      >
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
});

// 通过useModelById hook获取model
const FlowSettingsModalWithModelById: React.FC<ModelByIdProps> = observer(({ 
  uid, 
  flowKey, 
  modelClassName, 
  visible, 
  onClose,
  modalWidth = 800,
  modalTitle 
}) => {
  const model = useFlowModel(uid, modelClassName);
  
  if (!model) {
    return (
      <Modal
        title="错误"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={modalWidth}
      >
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
});

// 提取核心渲染逻辑到一个共享组件
interface FlowSettingsModalContentProps {
  model: any;
  flowKey: string;
  visible: boolean;
  onClose: () => void;
  modalWidth: number | string;
  modalTitle?: string;
}

const FlowSettingsModalContent: React.FC<FlowSettingsModalContentProps> = observer(({ 
  model, 
  flowKey, 
  visible, 
  onClose,
  modalWidth,
  modalTitle 
}) => {
  // 获取流程信息用于显示标题
  const flow = model.getFlow(flowKey);
  const title = modalTitle || (flow ? `${flow.title || flow.key} - 配置` : `流程配置 - ${flowKey}`);

  // 处理确认按钮点击
  const handleOk = async () => {
    try {
      // 重新执行flow来应用新的参数
      if (model) {
        await model.applyFlow(flowKey);
      }
      onClose();
    } catch (error) {
      console.error('应用配置时出错:', error);
      message.error('应用配置时出错，请检查控制台');
    }
  };

  // 处理取消按钮点击
  const handleCancel = () => {
    onClose();
  };

  if (!flow) {
    return (
      <Modal
        title="错误"
        open={visible}
        onCancel={onClose}
        footer={null}
        width={modalWidth}
      >
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
      style={{ top: 20 }}
      bodyStyle={{ 
        maxHeight: 'calc(100vh - 200px)', 
        overflowY: 'auto',
        padding: '16px 24px'
      }}
    >
      {/* 使用现有的FlowSettings组件 */}
      <FlowSettings model={model} flowKey={flowKey} />
    </Modal>
  );
});

export default FlowSettingsModal; 