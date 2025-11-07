# FlowSettings

`FlowSettings` 用于管理流配置，包括流配置表单时所需的各种组件，打开流及流步骤的配置表单等。

## FlowSettings 管理

- **flowSettings.registerComponents(components): void**  
  添加组件到 flowSettings 的组件注册表中, 这些组件可以在 flow step 的 uiSchema 中使用。

- **flowSettings.registerScopes(scopes): void**  
  添加作用域到 flowSettings 的作用域注册表中, 这些作用域可以在 flow step 的 uiSchema 中使用。

- **flowSettings.load(): Promise\<void\>**  
  加载 FlowSettings 相关资源，未启用 FlowSettings 时可不调用。

- **flowSettings.openStepSettingsDialog(props: StepSettingsDialogProps)**  
  显示单个步骤的配置界面。

- **flowSettings.openRequiredParamsStepFormDialog(props: StepFormDialogProps)**  
  显示多个需要配置参数的步骤的分步表单界面。

## 工具栏扩展 (Toolbar Extensions)

FlowSettings 支持在右上角悬浮工具栏中添加自定义项目组件：

- **flowSettings.addToolbarItem(config: ToolbarItemConfig): void**  
  添加单个工具栏项目。

- **flowSettings.addToolbarItems(configs: ToolbarItemConfig[]): void**  
  批量添加工具栏项目。

- **flowSettings.removeToolbarItem(key: string): void**  
  移除指定的工具栏项目。

- **flowSettings.getToolbarItems(): ToolbarItemConfig[]**  
  获取所有工具栏项目。

- **flowSettings.clearToolbarItems(): void**  
  清空所有工具栏项目。

**ToolbarItemConfig 接口：**
```typescript
interface ToolbarItemConfig {
  key: string;                                     // 项目唯一标识
  component: React.ComponentType<{ model: FlowModel }>; // 项目组件
  visible?: (model: FlowModel) => boolean;         // 显示条件函数
  sort?: number;                                   // 排序权重，数字越小或越晚添加的越靠右
}
```

**使用示例：**
```typescript
import { useFlowEngine } from '@nocobase/flow-engine';
import { CopyOutlined } from '@ant-design/icons';
import { Tooltip, message } from 'antd';

const CopyIcon: React.FC<{ model: FlowModel }> = ({ model }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(model.uid);
    message.success('UID 已复制');
  };

  return (
    <Tooltip title="复制 UID">
      <CopyOutlined 
        onClick={handleCopy} 
        style={{ cursor: 'pointer', fontSize: 12 }} 
      />
    </Tooltip>
  );
};

// 注册工具栏项目
const MyComponent = () => {
  const flowEngine = useFlowEngine();
  
  useEffect(() => {
    flowEngine.flowSettings.addToolbarItem({
      key: 'copy',
      component: CopyIcon,
      sort: 10
    });
  }, [flowEngine]);

  return <div>My Component</div>;
};
```

**注意事项：**
- 工具栏项目组件内部需要处理所有逻辑（点击、菜单、状态等）
- 使用 Tooltip 提供操作说明，提升用户体验

#### 步骤上下文 (Step Context)

FlowSettings 为配置组件提供了上下文功能，使组件能够访问当前步骤的相关信息：

- **useStepSettingContext(): StepSettingContextType**  
  React Hook，用于在配置组件中获取当前步骤的上下文信息，包括：
  - `model`: 当前的 FlowModel 实例
  - `globals`: 全局上下文数据
  - `app`: FlowEngine 应用实例
  - `step`: 当前步骤定义
  - `flow`: 当前流程定义
  - `flowKey`: 流程标识
  - `stepKey`: 步骤标识

**使用示例：**
```typescript
import { useStepSettingContext } from '@nocobase/flow-engine';

const MyCustomSettingField = () => {
  const { model, step, flow, flowKey, stepKey } = useStepSettingContext();
  
  // 基于当前步骤信息进行自定义逻辑
  const handleAction = () => {
    console.log('当前步骤:', step.title);
    console.log('所属流程:', flow.title);
  };
  
  return <Input />;
};
```

**注意：**
- 在单步骤配置对话框中，上下文提供完整的步骤信息
- 在多步骤表单中，上下文会随着步骤切换动态更新
- 上下文同时也会添加到 SchemaField 的 scope 中，可在 uiSchema 中直接使用

---