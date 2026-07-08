# 操作面板入口交互和数字展示方案

状态：已确认交互和右上角数字展示方案。

日期：2026-07-07

## 背景

本文件记录“邮件、待办和通知支持在操作面板里添加（兼容移动端）”的当前交互结论，以及入口右上角数字展示方案。

三个入口分别由各自业务插件注册：

- 待办：由工作流插件注册。
- 通知：由通知插件注册。
- 邮件：由邮件插件注册。

工作台/操作面板只负责提供入口扩展和统一展示能力，不依赖具体业务插件内容。

## client-v2 操作面板扩展机制

client-v2 版操作面板通过 `entryActionManager` 扩展新按钮。

业务插件通过 `app.entryActionManager.register()` 注册入口提供器：

```ts
app.entryActionManager.register('plugin-name:entry-name:action-panel', {
  scope: 'action-panel',
  sort: 100,
  provider: async (ctx) => [
    {
      key: 'plugin-name:entry-name',
      label: 'Entry title',
      createModelOptions: {
        use: 'PluginEntryActionModel',
        props: {
          title: 'Entry title',
          icon: 'SomeOutlined',
        },
      },
    },
  ],
});
```

操作面板配置按钮会读取 `entryActionManager.getItems('action-panel')`，把业务插件返回的 `SubModelItem` 合并到“添加操作”的候选项中。

用户在 UI 编辑模式下选择某个入口后，操作面板会根据 `createModelOptions` 创建对应的 `ActionModel` 子模型，并挂到操作面板的 `actions` 下。

操作面板运行时只遍历和渲染 `actions` 子模型，不感知待办、通知、邮件等业务含义。

## 通用判断

操作面板入口点击后的交互按当前上下文的 `isMobileLayout` 判断：

- `isMobileLayout === false`：桌面端宽屏交互。
- `isMobileLayout === true`：桌面端响应式布局或移动端布局交互。

## 待办

### 桌面端

点击操作面板中的待办入口后，跳转到现有的待办中心页面。

### 桌面端响应式和移动端布局

点击操作面板中的待办入口后，打开一个子页面。

子页面内容和待办中心移动端页面内容一致，复用待办中心移动端页面的代码。

## 通知

### 桌面端

点击操作面板中的通知入口后，打开右侧消息弹窗。

该弹窗交互和点击当前顶部通知图标保持一致，并复用通知插件中现有的通知弹窗逻辑。

### 桌面端响应式和移动端布局

点击操作面板中的通知入口后，打开一个子页面。

当前 `client-v2` 中没有已迁移完成的通知移动端页面代码，因此先复用现有的通知桌面内容作为子页面内容。

## 邮件

### 桌面端

点击操作面板中的邮件入口后，跳转到现有的邮件页面。

### 桌面端响应式和移动端布局

点击操作面板中的邮件入口后，打开一个子页面。

子页面内容先复用现有邮件页面代码。当前邮件页面尚未确认存在专门适配移动端的页面，因此先以复用现有页面为准。

## 右上角数字展示方案

### 设计原则

右上角数字是运行时状态，不是操作面板配置。

数字来源由各业务插件自己维护：

- 待办：工作流插件维护待办数量。
- 通知：通知插件维护未读通知数量。
- 邮件：邮件插件维护未读邮件数量。

操作面板只读取 action 模型上的显式运行时字段，并统一负责 Badge 的展示位置和样式。

### API 设计

在操作面板侧约定一个结构型字段：

```ts
type ActionPanelBadgeOptions = {
  count?: number | string;
  dot?: boolean;
  overflowCount?: number;
  showZero?: boolean;
  title?: string;
};

type ActionPanelBadgeAction = {
  actionPanelBadge?: ActionPanelBadgeOptions | null;
};
```

业务入口 action 如果需要显示数字，就在模型上维护 `actionPanelBadge`。

`actionPanelBadge` 是运行时字段，不写入 schema，不作为按钮配置保存。

### 操作面板如何使用

操作面板渲染每个 action 时读取 `action.actionPanelBadge`：

```tsx
const ActionPanelBadge = observer(
  ({ action, children }: { action: ActionModel; children: React.ReactNode }) => {
    const badge = (action as ActionPanelBadgeAction).actionPanelBadge;

    if (!badge) {
      return <>{children}</>;
    }

    return (
      <Badge overflowCount={99} {...badge}>
        {children}
      </Badge>
    );
  },
);
```

操作面板统一把 Badge 包在入口图标上，使数字显示在图标右上角。

### 数字如何刷新

各业务插件在自己的 entry action 生命周期中显式更新 `actionPanelBadge`。

典型流程：

```text
entry action onMount
  -> 初始化拉取数量
  -> 订阅业务插件自己的实时事件、store 或轮询
  -> 数量变化时更新 action.actionPanelBadge
  -> ActionPanelBadge observer 局部重渲染
  -> 按钮右上角数字刷新
```

示例：

```ts
class PluginEntryActionModel extends ActionModel {
  actionPanelBadge: ActionPanelBadgeOptions | null = null;
  private disposeBadgeSubscription?: () => void;

  onInit(options) {
    super.onInit(options);

    define(this, {
      actionPanelBadge: observable.ref,
    });
  }

  protected onMount() {
    super.onMount();

    this.refreshBadge();
    this.disposeBadgeSubscription = subscribeCount((count) => {
      this.setActionPanelBadgeCount(count);
    });
  }

  protected onUnmount() {
    super.onUnmount();
    this.disposeBadgeSubscription?.();
    this.disposeBadgeSubscription = undefined;
  }

  setActionPanelBadgeCount(count: number) {
    this.actionPanelBadge = count > 0 ? { count } : null;
  }
}
```

### 各插件职责

待办入口：

- 由工作流插件维护待办数量。
- 初始加载后更新 `actionPanelBadge`。
- 收到待办实时更新事件后同步更新 `actionPanelBadge`。

通知入口：

- 由通知插件维护未读通知数量。
- 通知到达、通知状态变化或重新拉取数量后，同步更新 `actionPanelBadge`。
- 顶部通知图标和操作面板通知入口应读取同一份通知数量状态。

邮件入口：

- 由邮件插件维护未读邮件数量。
- 初始加载 `mail:messageUnreadCount` 后更新 `actionPanelBadge`。
- 收到邮件未读数事件或轮询刷新后同步更新 `actionPanelBadge`。
- 顶部邮件图标和操作面板邮件入口应读取同一份邮件数量状态。

## 已确认边界

- 入口注册和业务交互分别放在各自业务插件中完成。
- core 不依赖待办、通知、邮件等插件内容。
- 工作台/操作面板不感知具体业务页面，只消费各插件注册的入口。
- 工作台/操作面板只消费 `actionPanelBadge` 并统一展示 Badge。
- 数字的加载、订阅、轮询和实时更新由各业务插件负责。
- 数字状态不写入操作面板配置，不作为 schema 持久化。
