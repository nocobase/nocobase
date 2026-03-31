# uiMode - 步骤设置的 UI 模式

`uiMode` 用于控制步骤配置界面的显示方式，支持静态配置和函数式动态配置。

## 类型定义

```ts
export type StepUIMode =
  | 'dialog'
  | 'drawer'
  | { type: 'dialog'; props?: Record<string, any> }
  | { type: 'drawer'; props?: Record<string, any> };

// 步骤定义中的 uiMode 支持函数式
interface StepDefinition {
  uiMode?: StepUIMode | ((ctx: FlowRuntimeContext) => StepUIMode | Promise<StepUIMode>);
}

// uiMode.props 中支持的 footer 配置
interface UIProps {
  footer?:
    | React.ReactNode                    // 直接替换整个底部内容
    | ((                                 // 函数式自定义
        originNode: React.ReactNode,
        extra: { 
          OkBtn: React.FC<{ title?: string }>;
          CancelBtn: React.FC<{ title?: string }>;
        }
      ) => React.ReactNode)
    | null;                             // 隐藏底部内容
}
```

## 示例

### 1. 基础完整示例

包含完整 uiSchema 的主要示例：

<code src="./index.tsx"></code>

### 2. 基础用法 - 字符串形式的 uiMode

展示最简单的字符串形式 uiMode 用法：

<code src="./basic.tsx"></code>

### 3. 带属性示例 - 对象形式的 uiMode

展示如何使用对象形式设置对话框/抽屉的属性：

<code src="./with-props.tsx"></code>

### 4. 函数式示例 - 动态配置

展示函数式 uiMode 的强大功能，根据上下文动态配置：

<code src="./functional.tsx"></code>

### 5. 响应式属性示例 - 动态更新弹窗

展示如何通过 `observable` 对象和 `uiMode.props` 实现对已打开弹窗的动态更新。

<code src="./observable-props.tsx"></code>

### 6. 自定义底部 footer 示例

展示如何使用 `footer` 参数自定义弹窗底部内容。

<code src="./footer.tsx"></code>

## 主要特性

- **静态配置**: 支持字符串 (`'dialog'`, `'drawer'`) 和对象形式
- **动态配置**: 支持函数式配置，可根据上下文动态决定 UI 模式
- **属性传递**: 支持向对话框/抽屉传递自定义属性（宽度、样式等）
- **异步支持**: 函数式 uiMode 支持异步操作
- **底部自定义**: 通过 `footer` 参数灵活控制弹窗底部内容

## Footer 配置详解

`footer` 参数提供了强大的底部内容自定义能力，支持三种配置方式：

### 1. 直接替换 (ReactNode)

直接提供 React 元素替换整个底部区域：

```ts
uiMode: {
  type: 'dialog',
  props: {
    footer: <div>My custom footer</div>
  }
}
```

### 2. 函数式自定义 (Function)

通过函数接收原始底部内容和按钮组件，返回自定义内容：

```ts
uiMode: {
  type: 'dialog',
  props: {
    footer: (originNode, { OkBtn, CancelBtn }) => (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Additional info</span>
        {originNode}
      </div>
    )
  }
}
```

**函数参数说明：**

- `originNode`: 原始的底部内容（包含默认的确定和取消按钮）
- `extra.OkBtn`: 确定按钮组件，可接受 `title` 属性自定义文本
- `extra.CancelBtn`: 取消按钮组件，可接受 `title` 属性自定义文本

### 3. 隐藏底部 (null)

设置为 `null` 完全隐藏底部内容：

```ts
uiMode: {
  type: 'dialog',
  props: {
    footer: null
  }
}
```

### 按钮自定义

可以对默认按钮进行自定义：

```ts
footer: (originNode, { OkBtn, CancelBtn }) => (
  <Space>
    <CancelBtn title="关闭" />
    <Button type="link">帮助</Button>
    <OkBtn title="保存并关闭" />
  </Space>
)
```

### embed 效果

<code src="./embed.tsx"></code>

### switch

<code src="./switch.tsx"></code>

### select

<code src="./select.tsx"></code>
