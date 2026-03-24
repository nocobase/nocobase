# Admin-layout Link 菜单变量解析切换方案

## Summary
把 admin-layout 的 link 菜单变量解析统一切到 `FlowContext`。运行时不再使用旧的 `useParseURLAndParams` / `useVariables` 作为主解析链路，而是统一通过 `ctx.resolveJsonTemplate()` 解析 `href` 和 `params`。

为保证老版本升级不出问题，在进入 `FlowContext` 解析前，先做一层旧变量语法归一化。兼容范围只覆盖当前 Flow 菜单场景真实支持的历史全局变量，不适配 `env` 和 `date` 相关旧变量。

## Key Changes
### 1. 菜单 link 点击链路切到 FlowContext 解析
- 在 admin-layout 菜单点击链路新增 FlowContext 专用 URL 解析 helper/hook，替换当前对 `useParseURLAndParams` 的依赖。
- `ctx` 固定直接来自当前菜单 `FlowModel` 的 `model.context`，不额外引入新的全局上下文来源。
- 新解析器输入仍是 `href + params[]`，输出仍是最终 URL 字符串。
- 现有 query string 拼接逻辑继续复用，只替换变量求值步骤。

### 2. 旧变量兼容使用固定映射表
运行时先对模板字符串做归一化，再交给 `ctx.resolveJsonTemplate()`。兼容范围固定为：

- `{{ $user.xxx }}` -> `{{ ctx.user.xxx }}`
- `{{ currentUser.xxx }}` -> `{{ ctx.user.xxx }}`
- `{{ $nRole }}` -> `{{ ctx.role }}`
- `{{ $nToken }}` -> `{{ ctx.token }}`
- `{{ $nURLSearchParams.xxx }}` -> `{{ ctx.urlSearchParams.xxx }}`

约束：
- 只做白名单映射，不做任意旧语法的通用猜测
- 不适配 `$env`、`$nDate`、`$date`、`$system`、`currentTime`
- 归一化只发生在 `{{ ... }}` 模板表达式内部，不改普通文本或 URL 字面量
- 归一化必须支持混合字符串，不仅处理“整串等于变量”的情况

### 3. FlowContext 直接复用已有根变量
- 直接使用 `FlowContext` 现有根变量：
  - `ctx.user`
  - `ctx.role`
  - `ctx.token`
  - `ctx.urlSearchParams`
- 不新增 `ctx.env`
- 不扩展新的日期兼容入口

### 4. 失败策略和参数保留规则固定
失败策略固定为：
- `href` 解析异常：回退到原始 `href`
- `params` 某一项解析失败：仅忽略该项，保留其他已解析参数

参数保留规则调整为：
- 仅过滤 `undefined` / `null`
- 保留 `0`、`false`、空字符串等合法值

兼容边界固定为：
- 只处理 admin-layout 的 link 菜单
- 不修改其他仍使用 `useParseURLAndParams` 的场景
- 菜单设置页继续使用 `TextAreaWithContextSelector`

## Public APIs / Interfaces
- admin-layout 菜单点击链路新增 FlowContext URL 解析 helper/hook
- 不新增新的用户可见配置项，不改变菜单设置 schema
- 不新增新的 FlowContext 根变量

## Test Plan
- 菜单 link 解析单测：
  - `href` 中 `{{ ctx.role }}`
  - `params` 中 `{{ ctx.role }}`
  - 混合字符串模板解析
  - 新窗口 / 同窗口跳转仍使用解析后的 URL
- 兼容回归单测：
  - `{{ $user.id }}`
  - `{{ currentUser.id }}`
  - `{{ $nRole }}`
  - `{{ $nToken }}`
  - `{{ $nURLSearchParams.foo }}`
  - 以上变量出现在纯模板和混合字符串里的两种情况
- 参数值保留单测：
  - `0`
  - `false`
  - `''`
  - `undefined`
  - `null`
- URL 拼接边界单测：
  - 原始 URL 已有 query
  - 原始 URL 带 hash route
  - hash 内已带 query
  - 参数追加顺序保持稳定
- 失败策略单测：
  - `href` 解析异常时回退原始 `href`
  - 单个参数失败时仅跳过该参数
- 回归保护：
  - 非 admin-layout 的 `useParseURLAndParams` 使用点不受影响
  - 菜单设置页仍显示 FlowContext 变量编辑器

## Assumptions
- 这次范围只解决 admin-layout link 菜单的变量解析，不全局替换整个客户端的 URL 变量系统
- 旧变量兼容仅覆盖该菜单场景历史可配置、且当前 Flow 菜单仍有等价能力的全局变量
- `FlowContext` 是该场景唯一运行时解析引擎；旧变量系统仅通过归一化规则保留兼容性

## To Do List
- [x] 梳理并冻结当前 admin-layout link 菜单点击链路涉及的代码入口与测试入口
- [x] 设计并实现基于 `model.context` 的 FlowContext URL 解析 helper/hook
- [x] 从 admin-layout 菜单点击链路切走 `useParseURLAndParams`
- [x] 实现 `{{ ... }}` 模板内部的旧变量白名单归一化
- [x] 接入 `ctx.resolveJsonTemplate()` 解析 `href`
- [x] 接入 `ctx.resolveJsonTemplate()` 解析 `params`
- [x] 调整参数保留规则，只过滤 `undefined` / `null`
- [x] 保持并验证 `href` 失败回退、单参数失败跳过的策略
- [x] 补充 link 菜单变量解析单测
- [x] 补充旧变量兼容回归单测
- [x] 补充 `0` / `false` / `''` 参数保留单测
- [x] 补充 URL query/hash 拼接边界单测
- [x] 回归确认非 admin-layout 的 `useParseURLAndParams` 使用点未受影响
- [x] 回归确认菜单设置页仍使用 `TextAreaWithContextSelector`
