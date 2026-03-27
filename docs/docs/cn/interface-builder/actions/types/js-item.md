---
title: "JSItem JS 项"
description: "JSItem JS 项：在操作栏中使用 JavaScript/JSX 渲染自定义操作项，支持 React、ctx、集合/记录/表单上下文联动。"
keywords: "JSItem,JS Item,JS 项,自定义操作项,JavaScript,界面搭建,NocoBase"
---

# JS Item

## 介绍

JS Item 用于在操作栏中渲染一个“自定义操作项”。你可以直接编写 JavaScript / JSX，输出任意 UI，例如按钮、按钮组、下拉菜单、提示文本、状态标签或小型交互组件，并在组件内部调用接口、打开弹窗、读取当前记录或刷新区块数据。

它可用于表单工具栏、表格工具栏（集合级）、表格行操作（记录级）等位置，适合以下场景：

- 需要自定义按钮结构，而不只是给按钮绑定一个点击事件；
- 需要把多个操作组合成一个按钮组或下拉菜单；
- 需要在操作栏中展示实时状态、统计信息或说明内容；
- 需要根据当前记录、选中数据、表单值动态渲染不同内容。

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM%20(1).png)

## 与 JS Action 的区别

- `JS Action`：更适合“点击按钮后执行一段脚本”，重点是行为逻辑。
- `JS Item`：更适合“自己渲染一个操作项”，既控制界面，也控制交互逻辑。

如果只是想给现有按钮补充点击逻辑，优先使用 `JS Action`；如果希望自定义操作项的界面结构或渲染多个控件，优先使用 `JS Item`。

## 运行时上下文 API（常用）

JS Item 运行时会注入常用能力，可直接在脚本中使用：

- `ctx.render(vnode)`：将 React 元素、HTML 字符串或 DOM 节点渲染到当前操作项容器；
- `ctx.element`：当前操作项的 DOM 容器（ElementProxy）；
- `ctx.api.request(options)`：发起 HTTP 请求；
- `ctx.openView(viewUid, options)`：打开已配置的视图（抽屉 / 对话框 / 页面）；
- `ctx.message` / `ctx.notification`：全局提示与通知；
- `ctx.t()` / `ctx.i18n.t()`：国际化；
- `ctx.resource`：集合级上下文的数据资源，例如读取选中记录、刷新列表；
- `ctx.record`：记录级上下文的当前行记录；
- `ctx.form`：表单级上下文的 AntD Form 实例；
- `ctx.blockModel` / `ctx.collection`：所在区块与集合元信息；
- `ctx.requireAsync(url)`：按 URL 异步加载 AMD / UMD 库；
- `ctx.importAsync(url)`：按 URL 动态导入 ESM 模块；
- `ctx.libs.React` / `ctx.libs.ReactDOM` / `ctx.libs.antd` / `ctx.libs.antdIcons` / `ctx.libs.dayjs` / `ctx.libs.lodash` / `ctx.libs.math` / `ctx.libs.formula`：内置常用库，可直接用于 JSX 渲染、时间处理、数据处理与数学运算。

> 实际可用变量会随操作项所在位置不同而有所差异。例如表格行操作通常可访问 `ctx.record`，表单工具栏通常可访问 `ctx.form`，表格工具栏通常可访问 `ctx.resource`。

## 编辑器与片段

- `Snippets`：打开内置代码片段列表，可搜索并一键插入到当前光标位置。
- `Run`：直接运行当前代码，并将运行日志输出到底部 `Logs` 面板；支持 `console.log/info/warn/error` 与错误高亮定位。

![](https://static-docs.nocobase.com/JS-Item-03-27-2026_03_35_PM.png)

- 可结合 AI 员工生成 / 修改脚本：[AI 员工 · Nathan：前端工程师](/ai-employees/features/built-in-employee)

## 常见用法（精简示例）

### 1) 渲染普通按钮

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      type="primary"
      onClick={() => ctx.message.success(ctx.t('Click from JS item'))}
    >
      {ctx.t('JS item')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 2) 集合操作：组合按钮与下拉菜单

```js
const { Space, Button, Dropdown } = ctx.libs.antd;
const { EllipsisOutlined } = ctx.libs.antdIcons;

function JsItem() {
  const items = [
    { key: 'export', label: ctx.t('Export selected') },
    { key: 'refresh', label: ctx.t('Refresh data') },
  ];

  const onMenuClick = async ({ key }) => {
    if (key === 'export') {
      const rows = ctx.resource?.getSelectedRows?.() || [];
      if (!rows.length) {
        ctx.message.warning(ctx.t('Please select records'));
        return;
      }
      ctx.message.success(ctx.t('Selected {n} items', { n: rows.length }));
      return;
    }

    if (key === 'refresh') {
      await ctx.resource?.refresh?.();
      ctx.message.success(ctx.t('Refreshed'));
    }
  };

  return (
    <Space.Compact>
      <Button>{ctx.t('Actions')}</Button>
      <Dropdown menu={{ items, onClick: onMenuClick }} placement="bottomRight">
        <Button icon={<EllipsisOutlined />} />
      </Dropdown>
    </Space.Compact>
  );
}

ctx.render(<JsItem />);
```

### 3) 记录操作：基于当前行打开视图

```js
const { Button } = ctx.libs.antd;

function JsItem() {
  return (
    <Button
      onClick={async () => {
        // Open a view as drawer and pass arguments at top-level
        const popupUid = `${ctx.model.uid}-details`;
        await ctx.openView(popupUid, {
          mode: 'drawer',
          title: ctx.t('Details'),
          size: 'large',
        });
      }}
    >
      {ctx.t('Open')}
    </Button>
  );
}

ctx.render(<JsItem />);
```

### 4) 渲染自定义状态内容

```js
const { Tag } = ctx.libs.antd;

function JsItem() {
  const count = ctx.resource?.getSelectedRows?.()?.length || 0;

  return (
    <Tag color={count ? 'processing' : 'default'}>
      Selected: {count}
    </Tag>
  );
}

ctx.render(<JsItem />);
```

## 注意事项

- 如果只需要“点击后执行逻辑”，优先使用 `JS Action`，实现更直接。
- 为接口调用添加 `try/catch` 和用户提示，避免异常静默失败。
- 涉及表格、列表、弹窗联动时，提交成功后可通过 `ctx.resource?.refresh?.()` 或所在区块资源主动刷新数据。
- 使用外部库时，建议通过可信 CDN 加载，并为加载失败做好兜底处理。

## 相关文档

- [变量与上下文](/interface-builder/variables)
- [联动规则](/interface-builder/linkage-rule)
- [视图与弹窗](/interface-builder/actions/types/view)
- [JS Action](/interface-builder/actions/types/js-action)
