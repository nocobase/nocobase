# 低代码区块文档

低代码区块让用户能够用纯 JavaScript 动态创建和运行自定义的交互式前端组件。

---

## 全局上下文对象 `ctx`

低代码区块为用户代码提供了统一的全局上下文对象 `ctx`。你可以通过解构的方式，快速访问常用变量和方法：

```js
type LowcodeCtx = {
  element: HTMLElement;
  model: FlowModel;
  i18n: I18next;
  requirejs: (modules: string[], callback: Function) => void;
  requireAsync: (modules: string | string[]) => Promise<any>;
  loadCSS: (url: string) => Promise<void>;
  getModelById: (uid: string) => FlowModel | null;
  initResource(typeof APIResource, options: AxiosRequestConfig): APIResource;
  request: (options: AxiosRequestConfig) => Promise<any>;
  router: RemixRouter;
  auth: {
    role: string;
    locale: string;
    token: string;
    user: any;
  };
  Resources: {
    APIResource: typeof APIResource;
    SingleRecordResource: typeof SingleRecordResource;
    MultiRecordResource: typeof MultiRecordResource;
    // ...其他扩展资源类型
  };
  React: typeof React;
  Components: {
    antd: typeof import('antd');
    // 可扩展更多组件库
  };
};

declare const ctx: LowcodeCtx;
```

---

## 核心属性

### `ctx.element`

* **类型**：`HTMLElement`
* **说明**：当前组件的根 DOM 元素。每个低代码区块会被渲染到一个独立的 DOM 元素中，`element` 即为该元素的引用。你可以通过它进行内容渲染、事件绑定、集成第三方前端库等操作。该元素的生命周期与区块一致，区块销毁时会自动清理。
* **使用场景**：适用于自定义渲染、挂载第三方库、绑定事件监听等。
* **注意事项**：
  - 请勿直接替换 `element` 节点本身（如通过 `replaceWith` 或重新赋值），否则会导致区块生命周期异常。
  - 推荐只操作 `element` 的内容或子节点，例如通过 `element.innerHTML`、`appendChild`、`addEventListener` 等方式进行 DOM 操作。
  - 区块销毁时会自动清理该元素及其事件，无需手动移除。

示例一：

```ts
ctx.element.innerHTML = `
  <div style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 600px;">
    <h2 style="color: #1890ff; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
      🚀 Welcome to Lowcode Block
    </h2>
    
    <p style="color: #666; margin-bottom: 24px; font-size: 16px;">
      Build interactive components with JavaScript and external libraries
    </p>
    
    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="color: #333; margin: 0 0 16px 0; font-size: 18px;">✨ Key Features</h3>
      <ul style="margin: 0; padding-left: 20px; color: #555;">
        <li style="margin-bottom: 8px;">🎨 <strong>Custom JavaScript execution</strong> - Full programming capabilities</li>
        <li style="margin-bottom: 8px;">📚 <strong>External library support</strong> - Load any npm package or CDN library</li>
        <li style="margin-bottom: 8px;">🔗 <strong>NocoBase API integration</strong> - Access your data and collections</li>
        <li style="margin-bottom: 8px;">💡 <strong>Async/await support</strong> - Handle asynchronous operations</li>
        <li style="margin-bottom: 8px;">🎯 <strong>Direct DOM manipulation</strong> - Full control over rendering</li>
      </ul>
    </div>
    
    <div style="background: #e6f7ff; border-left: 4px solid #1890ff; padding: 16px; border-radius: 4px;">
      <p style="margin: 0; color: #333; font-size: 14px;">
        💡 <strong>Ready to start?</strong> Replace this code with your custom JavaScript to build amazing components!
      </p>
    </div>
  </div>
`;
```

示例二：

```ts
ctx.element.style.height = '400px';
const echarts = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js');
const chart = echarts.init(ctx.element);

// 生成随机数据
const categories = ['A', 'B', 'C', 'D', 'E', 'F'];
const randomData = categories.map(() => Math.floor(Math.random() * 50) + 1);

const option = {
  title: { text: 'ECharts 示例（随机数据）' },
  tooltip: {},
  xAxis: { data: categories },
  yAxis: {},
  series: [{ name: '销量', type: 'bar', data: randomData }]
};
chart.setOption(option);
chart.resize();
window.addEventListener('resize', () => chart.resize());
ctx.model.on('destroy', () => {
  chart.dispose();
});
```

### `ctx.model`

* **类型**：[FlowModel](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-model)
* **说明**：`model` 是当前区块的 ViewModel（视图模型），基于 NocoBase 的 FlowModel 实现。它用于管理区块的数据状态、事件和响应式更新。在低代码区块中，`model` 最常用的功能是调用 `rerender()` 方法以重渲染当前组件，实现视图与数据的联动。你还可以通过 `model.on()` 监听数据或事件变化。
* **使用场景**：
  - 主动刷新视图（如数据变更后调用 `model.rerender()`）
  - 监听和响应数据、生命周期事件（如 `model.on('destroy', ...)`）
* **注意事项**：
  - 调用 `rerender()` 后，确保视图渲染逻辑依赖于 `model` 的数据。
  - 多区块联动时，注意事件解绑和数据同步，防止内存泄漏。
  - 如需复杂数据流转，建议结合 resource 或全局状态管理。

低代码场景里 model 常用的属性和方法

- model.resource
- model.rerender()
- model.on('destroy', ...)

示例

在区块销毁时手动调用 chart.dispose() 释放 ECharts 实例资源。

```ts
ctx.model.on('destroy', () => {
  chart.dispose();
});
```

### `ctx.i18n`

* **类型**：`I18next`
* **说明**：国际化对象，基于 [i18next](https://www.i18next.com/) 实现。它提供了多语言文本的管理和切换能力，支持动态加载语言包、参数替换、复数等高级特性。通过 `i18n.t('key')` 获取当前语言下的翻译文本。
* **使用场景**：多语言文本渲染、动态切换语言。
* **注意事项**：使用 i18n.t('key') 获取翻译文本。

示例：中文和英文之间切换，区块的文案会跟着变化。

```ts
const zhCN = {
  hello: "你好",
  welcome_user: "欢迎，{{user}}！"
};
const enUS = {
  hello: "Hello",
  welcome_user: "Welcome, {{user}}!"
};

// 添加中文包
ctx.i18n.addResourceBundle('zh-CN', 'ns1', zhCN, true, true);
// 添加英文包
ctx.i18n.addResourceBundle('en-US', 'ns1', enUS, true, true);

ctx.element.innerHTML = ctx.i18n.t('welcome_user', { user: 'Tom', ns: 'ns1' });
```

### `ctx.Resources`

* **类型**：`{ APIResource, SingleRecordResource, MultiRecordResource, ... }`
* **说明**：包含所有可用的资源类型构造函数。你可以通过 `ctx.Resources` 获取并传递给 `initResource` 的 `use` 字段，灵活创建不同类型的资源实例。常用的有：
  - `APIResource`：简单的数据请求场景。
  - `SingleRecordResource`：单条数据资源，适合详情页、个人信息等场景。
  - `MultiRecordResource`：多条数据资源，适合批量操作、复杂数据结构等场景。
* **使用场景**：需要根据业务需求选择不同的数据交互模式时，通过 `ctx.Resources` 获取对应的资源类型。
* **注意事项**：
  - 推荐始终通过 `ctx.Resources` 获取资源类型，避免直接从全局导入，确保兼容性和可维护性。
  - 可扩展：如有自定义资源类型，也可通过插件机制扩展到 `ctx.Resources`。

Resource 相关类的接口说明，更多说明参考 [FlowResource 及资源体系
](https://pr-7056.client.docs-cn.nocobase.com/core/flow-engine/flow-resource)

```ts
// FlowResource interface
interface IFlowResource<TData = any> {
  getData(): TData;
  setData(value: TData): this;
  getMeta(metaKey?: string): any;
  setMeta(meta: Record<string, any>): this;
}

// APIResource interface
interface IAPIResource<TData = any> extends IFlowResource<TData> {
  loading: boolean;

  setAPIClient(api: APIClient): this;
  getURL(): string;
  setURL(value: string): this;

  clearRequestParameters(): this;
  setRequestParameters(params: Record<string, any>): this;
  setRequestMethod(method: string): this;

  addRequestHeader(key: string, value: string): this;
  removeRequestHeader(key: string): this;

  addRequestParameter(key: string, value: any): this;
  getRequestParameter(key: string): any | null;
  removeRequestParameter(key: string): this;

  setRequestBody(data: any): this;
  setRequestOptions(key: string, value: any): this;

  refresh(): Promise<void>;
}

// BaseRecordResource interface
interface IBaseRecordResource<TData = any> extends IAPIResource<TData> {
  setResourceName(resourceName: string): this;
  getResourceName(): string;
  setSourceId(sourceId: string | number): this;
  getSourceId(): string | number;
  setDataSourceKey(dataSourceKey: string): this;
  getDataSourceKey(): string;
  setFilter(filter: Record<string, any>): this;
  getFilter(): Record<string, any>;
  resetFilter(): void;
  addFilterGroup(key: string, filter: any): void;
  removeFilterGroup(key: string): void;
  setAppends(appends: string[]): this;
  getAppends(): string[];
  addAppends(appends: string | string[]): this;
  removeAppends(appends: string | string[]): this;
  setFilterByTk(filterByTk: string | number | string[] | number[]): this;
  getFilterByTk(): string | number | string[] | number[];
  setFields(fields: string[] | string): this;
  getFields(): string[];
  setSort(sort: string | string[]): this;
  getSort(): string[];
  setExcept(except: string | string[]): this;
  getExcept(): string[];
  setWhitelist(whitelist: string | string[]): this;
  getWhitelist(): string[];
  setBlacklist(blacklist: string | string[]): this;
  getBlacklist(): string[];
  refresh(): Promise<void>;
}

// SingleRecordResource interface
interface ISingleRecordResource<TData = any> extends IBaseRecordResource<TData> {
  setFilterByTk(filterByTk: string | number): this;
  save(data: TData): Promise<void>;
  destroy(): Promise<void>;
  refresh(): Promise<void>;
}

// MultiRecordResource interface
interface IMultiRecordResource<TDataItem = any> extends IBaseRecordResource<TDataItem[]> {
  setSelectedRows(selectedRows: TDataItem[]): this;
  getSelectedRows(): TDataItem[];
  setPage(page: number): this;
  getPage(): number;
  setPageSize(pageSize: number): this;
  getPageSize(): number;
  getCell(rowIndex: number, columnKey: string): TDataItem | undefined;
  next(): Promise<void>;
  previous(): Promise<void>;
  goto(page: number): Promise<void>;
  create(data: TDataItem): Promise<void>;
  update(filterByTk: string | number, data: Partial<TDataItem>): Promise<void>;
  destroySelectedRows(): Promise<void>;
  destroy(filterByTk: string | number | string[] | number[] | TDataItem | TDataItem[]): Promise<void>;
  refresh(): Promise<void>;
}
```

* **示例**：

自定义详情区块（使用 SingleRecordResource）

```ts
// 初始化资源，仅需调用一次
ctx.initResource(ctx.Resources.SingleRecordResource);

const resource = ctx.model.resource;
resource.setDataSourceKey('main');
resource.setResourceName('users');

const uid = ctx.model.uid; // 统一使用 model.uid 作为唯一标识

// 表单 HTML 片段
const renderFilterForm = () => `
  <form id="userFilterForm_${uid}" style="margin-bottom:16px;">
    <input type="text" id="userIdInput_${uid}" placeholder="用户ID" style="margin-right:8px;" />
    <button type="submit">筛选</button>
  </form>
  <div id="tableContainer_${uid}"></div>
`;

// 绑定筛选表单事件
function bindFilterFormSubmit() {
  const form = document.getElementById(`userFilterForm_${uid}`);
  const input = document.getElementById(`userIdInput_${uid}`);
  if (!form || !input) return;

  form.onsubmit = async (e) => {
    e.preventDefault();
    const id = input.value.trim();
    const model = ctx.model;
    if (id && model?.resource?.setFilterByTk) {
      model.resource.setFilterByTk(id);
      model.rerender();
    }
  };
}

// 渲染用户详情
async function renderUserView() {
  // 若未指定筛选条件，则提示用户先筛选
  if (!resource.getFilterByTk()) {
    ctx.element.innerHTML = `
      ${renderFilterForm()}
      <div style="padding:24px;color:#999;text-align:center;">
        <span>请先输入用户 ID 后查看详情</span>
      </div>
    `;
    bindFilterFormSubmit();
    return;
  }

  await resource.refresh();
  const data = resource.getData();
  if (!data) {
    ctx.element.innerHTML = `${renderFilterForm()}<div style="padding:24px;color:#f00;">未找到用户数据。</div>`;
    bindFilterFormSubmit();
    return;
  }

  ctx.element.innerHTML = `
    ${renderFilterForm()}
    <div style="padding:24px;max-width:480px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <h2 style="color:#1890ff;margin-bottom:20px;">用户详情</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="font-weight:bold;width:120px;">ID</td><td>${data.id ?? ''}</td></tr>
        <tr><td style="font-weight:bold;">昵称</td><td>${data.nickname ?? ''}</td></tr>
        <tr><td style="font-weight:bold;">用户名</td><td>${data.username ?? ''}</td></tr>
        <tr><td style="font-weight:bold;">邮箱</td><td>${data.email ?? ''}</td></tr>
        <tr><td style="font-weight:bold;">手机号</td><td>${data.phone ?? ''}</td></tr>
        <tr><td style="font-weight:bold;">注册时间</td><td>${data.createdAt ? new Date(data.createdAt).toLocaleString() : ''}</td></tr>
        <tr><td style="font-weight:bold;">最后修改</td><td>${data.updatedAt ? new Date(data.updatedAt).toLocaleString() : ''}</td></tr>
      </table>
    </div>
  `;

  bindFilterFormSubmit();
}

// 初次渲染
await renderUserView();
```

自定义的快捷编辑表格区块（使用 MultiRecordResource）

```ts
// 初始化资源，只需调用一次
ctx.initResource(ctx.Resources.MultiRecordResource);

const resource = ctx.model.resource;
resource.setDataSourceKey('main');
resource.setResourceName('users');
resource.setPageSize(10);
resource.setSort('-createdAt');

const uid = ctx.model.uid; // 统一用 model.uid 作为唯一标识

async function renderTable({ page }) {
  resource.setPage(page);
  await resource.refresh();
  const data = resource.getData() || [];
  const pageSize = resource.getPageSize();
  const meta = resource.getMeta() || {};
  const total = meta.count || data.length;

  ctx.element.innerHTML = `
    <div style="margin-bottom:16px;">
      <form id="addUserForm_${uid}" style="display:inline-block;margin-right:16px;">
        <input type="text" id="nicknameInput_${uid}" placeholder="昵称" style="width:100px;margin-right:8px;" />
        <input type="text" id="usernameInput_${uid}" placeholder="用户名" style="width:100px;margin-right:8px;" />
        <button type="submit">新增</button>
      </form>
    </div>
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;margin-bottom:12px;">
      <thead>
        <tr>
          <th>ID</th>
          <th>昵称</th>
          <th>用户名</th>
          <th>邮箱</th>
          <th>注册时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(item => `
          <tr>
            <td>${item.id}</td>
            <td>
              <input type="text" value="${item.nickname ?? ''}" style="width:80px;" data-id="${item.id}" class="edit-nickname-${uid}" />
            </td>
            <td>
              <input type="text" value="${item.username ?? ''}" style="width:80px;" data-id="${item.id}" class="edit-username-${uid}" />
            </td>
            <td>${item.email ?? ''}</td>
            <td>${item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</td>
            <td>
              <button data-id="${item.id}" class="saveBtn_${uid}">保存</button>
              <button data-id="${item.id}" class="deleteBtn_${uid}" style="color:#f00;">删除</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="margin-bottom:16px;">
      共 ${total} 条，每页 ${pageSize} 条，当前第 ${page} 页
      <button id="prevPage_${uid}" ${page <= 1 ? 'disabled' : ''}>上一页</button>
      <button id="nextPage_${uid}" ${(page * pageSize >= total) ? 'disabled' : ''}>下一页</button>
    </div>
  `;

  // 分页
  document.getElementById(`prevPage_${uid}`).onclick = () => {
    if (page > 1) {
      renderTable({ page: page - 1 });
    }
  };
  document.getElementById(`nextPage_${uid}`).onclick = () => {
    if (page * pageSize < total) {
      renderTable({ page: page + 1 });
    }
  };

  // 新增
  document.getElementById(`addUserForm_${uid}`).onsubmit = async (e) => {
    e.preventDefault();
    const nickname = document.getElementById(`nicknameInput_${uid}`).value.trim();
    const username = document.getElementById(`usernameInput_${uid}`).value.trim();
    if (!nickname || !username) {
      alert('昵称和用户名不能为空');
      return;
    }
    await resource.create({ nickname, username });
    renderTable({ page });
  };

  // 保存（编辑）
  Array.from(document.getElementsByClassName(`saveBtn_${uid}`)).forEach(btn => {
    btn.onclick = async (e) => {
      const id = btn.getAttribute('data-id');
      const nickname = document.querySelector(`.edit-nickname-${uid}[data-id="${id}"]`).value.trim();
      const username = document.querySelector(`.edit-username-${uid}[data-id="${id}"]`).value.trim();
      await resource.update(id, { nickname, username });
      renderTable({ page });
    };
  });

  // 删除
  Array.from(document.getElementsByClassName(`deleteBtn_${uid}`)).forEach(btn => {
    btn.onclick = async (e) => {
      const id = btn.getAttribute('data-id');
      if (confirm('确定要删除该用户吗？')) {
        await resource.destroy(id);
        renderTable({ page });
      }
    };
  });
}

// 首次渲染
await renderTable({ page: 1 });
```

### `ctx.router`

* **类型**：`RemixRouter`
* **说明**：NocoBase 内置的路由对象，基于 React Router 的 RemixRouter 实现。可用于在低代码区块中进行页面跳转、路由导航、获取当前路径等操作，支持 push、replace、goBack 等常用方法。
* **使用场景**：需要在区块中跳转到其他页面、动态导航、响应用户操作时。
* **常用方法**：
  - `ctx.router.navigate(path, options)`：跳转到指定路径，`options` 支持 `{ replace: true }` 等参数。
  - `ctx.router.location`：获取当前路由信息。
* **示例**：

```js
const uid = ctx.model.uid;

ctx.element.innerHTML = `
  <button id="gotoAdminBtn_${uid}" style="padding: 8px 16px; font-size: 16px;">
    跳转到后台管理首页
  </button>
`;

document.getElementById(`gotoAdminBtn_${uid}`).onclick = () => {
  ctx.router.navigate('/admin/');
};
```

### `ctx.auth`

* **类型**：`{ role: string, locale: string, token: string, user: any }`
* **说明**：当前用户的认证信息上下文，包含用户角色、语言设置、认证令牌和用户详细信息。通过此对象可以获取当前登录用户的基本信息，用于实现基于用户身份的个性化功能或权限控制。
* **使用场景**：需要根据用户身份显示不同内容、实现权限控制、个性化展示等。
* **属性说明**：
  - `ctx.auth.role`：当前用户的角色信息
  - `ctx.auth.locale`：当前用户的语言环境设置
  - `ctx.auth.token`：当前用户的认证令牌
  - `ctx.auth.user`：当前用户的详细信息对象
* **示例**：

```js
ctx.element.innerHTML = `
  <div style="padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <h3>用户信息</h3>
    <p><strong>用户：</strong>${ctx.auth.user?.nickname || ctx.auth.user?.email || '游客'}</p>
    <p><strong>角色：</strong>${ctx.auth.role || '未设置'}</p>
    <p><strong>语言：</strong>${ctx.auth.locale || '未设置'}</p>
  </div>
`;
```

---

### `ctx.React`

```ts
const React = ctx.React;
const ReactDOM = ctx.ReactDOM;

function App() {
  return React.createElement('h2', null, 'Hello from React in Lowcode!');
}

const root = ReactDOM.createRoot(ctx.element);
root.render(React.createElement(App));
```

### `ctx.Components`

使用 ctx.Components.antd 渲染 Ant Design 按钮和输入框

```tsx
const React = ctx.React;
const ReactDOM = ctx.ReactDOM;
const { Button, Input } = ctx.Components.antd;

function App() {
  return React.createElement('div', null,
    React.createElement(Button, { type: 'primary' }, '提交'),
    React.createElement(Input, { placeholder: '请输入内容', style: { width: 200, marginLeft: 8 } })
  );
}

const root = ReactDOM.createRoot(ctx.element);
root.render(React.createElement(App));
```

## 常用方法

### `ctx.initResource(ResourceClass, options: AxiosRequestConfig): ResourceInstance`

* **类型**：`(ResourceClass: typeof APIResource | typeof SingleRecordResource | typeof MultiRecordResource, options?: AxiosRequestConfig) => ResourceInstance`
* **说明**：用于初始化并获取当前区块的资源实例。通过传入资源类型构造函数（如 `APIResource`、`SingleRecordResource`、`MultiRecordResource` 等）和可选的请求配置，灵活创建不同类型的资源对象，便于管理和操作数据。该方法只会在当前区块生命周期内执行一次，如果 `ctx.resource` 已存在，则不会重复初始化，后续调用会返回同一个实例。
* **参数**：
  * `ResourceClass`：资源类型构造函数，支持 `APIResource`、`SingleRecordResource`、`MultiRecordResource` 等。
  * `options`：可选，Axios 的请求配置，会通过 `setRequestOptions` 注入到资源实例中。
* **返回**：对应类型的资源实例。
* **使用场景**：需要自定义资源类型、管理多种数据结构或特殊数据交互场景。
* **注意事项**：
  - 推荐始终通过 `ctx.initResource` 创建和获取资源实例，便于后续扩展和维护。
  - 该方法只会初始化一次，区块重渲染也不会重建。
  - 一个 Model 组件只有一个 resource 示例，不同的组件，可以通过 model.resource 操作目前资源。
* **示例**

自定义表格区块，基于 MultiRecordResource 实现表格数据展示，带分页，支持筛选

```ts
ctx.initResource(ctx.Resources.MultiRecordResource);
const resource = ctx.model.resource;
resource.setDataSourceKey('main');
resource.setResourceName('users');
resource.setPageSize(10);
resource.setSort('-createdAt');

const uid = ctx.model.uid; // 统一用 model.uid 作为唯一标识

// 渲染筛选表单和表格
async function renderTable({ page = 1, nickname = '' } = {}) {
  resource.setPage(page);
  if (nickname) {
    resource.addFilterGroup(uid, { 'nickname.$includes': nickname });
  } else {
    resource.removeFilterGroup(uid);
  }
  await resource.refresh();
  const data = resource.getData() || [];
  const meta = resource.getMeta() || {};
  const pageSize = resource.getPageSize();
  const total = meta.count || data.length;

  ctx.element.innerHTML = `
    <form id="filterForm_${uid}" style="margin-bottom:16px;">
      <input type="text" id="nicknameInput_${uid}" placeholder="昵称" style="margin-right:8px;" value="${nickname}" />
      <button type="submit">筛选</button>
    </form>
    <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;margin-bottom:12px;">
      <thead>
        <tr>
          <th>ID</th>
          <th>昵称</th>
          <th>用户名</th>
          <th>邮箱</th>
          <th>注册时间</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(item => `
          <tr>
            <td>${item.id}</td>
            <td>${item.nickname || ''}</td>
            <td>${item.username || ''}</td>
            <td>${item.email || ''}</td>
            <td>${item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div>
      共 ${total} 条，每页 ${pageSize} 条，当前第 ${meta.page || page} 页
      <button id="prevPage_${uid}" ${meta.page <= 1 ? 'disabled' : ''}>上一页</button>
      <button id="nextPage_${uid}" ${(meta.page * pageSize >= total) ? 'disabled' : ''}>下一页</button>
    </div>
  `;

  // 筛选事件
  document.getElementById(`filterForm_${uid}`).onsubmit = async (e) => {
    e.preventDefault();
    const nickname = document.getElementById(`nicknameInput_${uid}`).value.trim();
    // nickname 存于 meta 中，避免重渲染时筛选被清空
    resource.setMeta({ nickname });
    renderTable({ page: 1, nickname });
  };

  // 分页事件
  document.getElementById(`prevPage_${uid}`).onclick = () => {
    if (meta.page > 1) {
      renderTable({ page: meta.page - 1, filter });
    }
  };
  document.getElementById(`nextPage_${uid}`).onclick = () => {
    if (meta.page * pageSize < total) {
      renderTable({ page: meta.page + 1, filter });
    }
  };
}

// 从 meta 获取 nickname，避免重渲染时筛选被清空
await renderTable({ nickname: resource.getMeta('nickname') });
```

多来源筛选，新增一个筛选区块，示例的 targetUid 替换为目标表格区块的 model uid。

```ts
const uid = ctx.model.uid;
const targetUid = '6ddac206c67'; // 替换为表格区块的 model uid

// 多来源筛选表单示例
ctx.element.innerHTML = `
  <form id="filterForm_${uid}" style="margin-bottom:16px;">
    <input type="text" id="nicknameInput_${uid}" placeholder="昵称" style="margin-right:8px;" />
    <input type="text" id="usernameInput_${uid}" placeholder="用户名" style="margin-right:8px;" />
    <button type="submit">筛选</button>
    <button id="resetBtn_${uid}" type="button" style="margin-left:8px;">重置</button>
  </form>
`;



// 筛选表单事件
document.getElementById(`filterForm_${uid}`).onsubmit = async (e) => {
  e.preventDefault();
  const nickname = document.getElementById(`nicknameInput_${uid}`).value.trim();
  const username = document.getElementById(`usernameInput_${uid}`).value.trim();
  const model = ctx.getModelById(targetUid);
  if (!model) return;

  // 使用 addFilterGroup 组合多条件筛选
  const filterGroup = {};
  if (nickname) filterGroup['nickname.$includes'] = nickname;
  if (username) filterGroup['username.$includes'] = username;

  if (Object.keys(filterGroup).length) {
    model.resource.addFilterGroup(uid, filterGroup);
  } else {
    model.resource.removeFilterGroup(uid);
  }
  model.rerender();
};

// 重置按钮事件
document.getElementById(`resetBtn_${uid}`).onclick = () => {
  document.getElementById(`nicknameInput_${uid}`).value = '';
  document.getElementById(`usernameInput_${uid}`).value = '';
  const model = ctx.getModelById(targetUid);
  if (model) {
    model.resource.removeFilterGroup(uid);
    model.rerender();
  }
};
```

### `ctx.requirejs(modules: string[], callback: Function): void`

* **说明**：同步加载外部 JavaScript 库，基于 RequireJS 实现。该方法适合需要兼容老代码或同步依赖的场景。加载的模块会被缓存，后续调用会直接返回已加载的模块。回调函数会在所有模块加载完成后执行，参数为各模块的导出对象。
* **参数**：

  * `modules`：需要加载的模块名数组。
  * `callback`：加载完成后的回调，回调参数是对应模块的导出对象。
* **使用场景**：需要同步依赖、兼容老代码。
* **注意事项**：模块未加载成功时不会自动抛出异常，需在 callback 内自行处理。
* **示例**：

使用 ctx.requirejs 加载 lodash CDN 并结合 ctx.element 渲染

```js
const uid = ctx.model.uid;

ctx.requirejs(['https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js'], function(_) {
  const arr = [1, 2, 3, 4, 5];
  const shuffled = _.shuffle(arr);

  ctx.element.innerHTML = `
    <div>
      <div>原数组: ${JSON.stringify(arr)}</div>
      <div id="shuffleResult_${uid}">乱序后: ${JSON.stringify(shuffled)}</div>
      <button id="reshuffleBtn_${uid}">重新乱序</button>
    </div>
  `;

  document.getElementById(`reshuffleBtn_${uid}`).onclick = () => {
    const newShuffled = _.shuffle(arr);
    document.getElementById(`shuffleResult_${uid}`).innerText = `乱序后: ${JSON.stringify(newShuffled)}`;
  };
});
```

### `ctx.requireAsync(modules: string | string[]): Promise<any>`

* **说明**：异步加载外部 JavaScript 库，基于 RequireJS 封装，支持 `async/await`。推荐用于现代开发，代码更简洁。该方法会自动处理依赖关系，加载失败时会抛出异常。
* **参数**：

  * `modules`：单个模块名字符串或模块名数组。
* **返回**：

  * 一个 `Promise`，resolve 对应模块的导出对象。
* **使用场景**：推荐用于现代异步开发。
* **注意事项**：加载失败时会抛出异常，建议使用 try/catch 捕获。
* **示例**：

使用 ctx.requireAsync 异步加载 lodash CDN 并结合 ctx.element 渲染

```js
const uid = ctx.model.uid;

const _ = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/lodash@4/lodash.min.js');
const arr = [1, 2, 3, 4, 5];
const shuffled = _.shuffle(arr);

ctx.element.innerHTML = `
  <div>
    <div>原数组: ${JSON.stringify(arr)}</div>
    <div id="shuffleResult_${uid}">乱序后: ${JSON.stringify(shuffled)}</div>
    <button id="reshuffleBtn_${uid}">重新乱序</button>
  </div>
`;

document.getElementById(`reshuffleBtn_${uid}`).onclick = () => {
  const newShuffled = _.shuffle(arr);
  document.getElementById(`shuffleResult_${uid}`).innerText = `乱序后: ${JSON.stringify(newShuffled)}`;
};
```

### `ctx.loadCSS(url: string): Promise<void>`

* **说明**：异步加载外部 CSS 样式文件。该方法会在页面动态插入 `<link>` 标签，并自动处理重复加载和加载失败的情况。适合按需引入主题、第三方样式等。
* **参数**：

  * `url`：CSS 文件的完整 URL。
* **使用场景**：需要动态切换主题、按需加载样式。
* **注意事项**：建议确保 URL 可访问，避免跨域问题。
* **示例**：

```js
// 加载 frappe-gantt 的 CSS 和 JS（使用 jsdelivr CDN）
await ctx.loadCSS('https://cdn.jsdelivr.net/npm/frappe-gantt@0.5.0/dist/frappe-gantt.css');
await ctx.requireAsync('https://cdn.jsdelivr.net/npm/frappe-gantt@0.5.0/dist/frappe-gantt.min.js');

// 随机生成任务数据
function randomDate(start, days) {
  const date = new Date(start);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
const baseDate = new Date().toISOString().slice(0, 10);
const tasks = Array.from({ length: 3 }).map((_, i) => {
  const startOffset = i === 0 ? 0 : i * 5;
  return {
    id: `Task ${i + 1}`,
    name: `阶段${i + 1}`,
    start: randomDate(baseDate, startOffset),
    end: randomDate(baseDate, startOffset + 4),
    progress: Math.floor(Math.random() * 100),
    dependencies: i === 0 ? '' : `Task ${i}`
  };
});

// 渲染 Gantt 图到 ctx.element
const gantt = new Gantt(ctx.element, tasks, {
  view_mode: 'Day',
  date_format: 'YYYY-MM-DD',
  on_click: task => {
    alert(`点击了任务：${task.name}`);
  },
  on_date_change: (task, start, end) => {
    console.log(`任务 "${task.name}" 改变时间：`, start, end);
  }
});

ctx.model.on('destroy', () => {
  ctx.element.innerHTML = '';
});
```

### `ctx.getModelById(uid: string): FlowModel | null`

* **说明**：根据唯一 ID 获取其他 Model 实例。该方法用于区块间通信和数据联动，返回目标区块的 model 实例引用。若目标 model 尚未初始化或不存在，则返回 null。
* **参数**：

  * `uid`：目标 Model 的唯一标识符。
* **返回**：

  * 对应的 `FlowModel` 实例，若不存在则返回 `null`。
* **使用场景**：多个区块间需要共享或联动数据时。
* **注意事项**：目标 Model 必须已初始化。
* **示例**：

获取图表区块，并重渲染。

```ts
const uid = ctx.model.uid;

ctx.element.innerHTML = `
  <button id="rerenderBtn_${uid}">
    重新渲染 ECharts 图表
  </button>
`;

document.getElementById(`rerenderBtn_${uid}`).onclick = () => {
  const model = ctx.getModelById('33c11bb4298'); // 33c11bb4298 为上文 echarts 图表
  if (model) {
    model.rerender();
  } else {
    alert('未找到目标图表区块');
  }
};
```

### `ctx.request(options: AxiosRequestConfig): Promise<Response>`

* **类型**：`(options: AxiosRequestConfig) => Promise<Response>`
* **说明**：  
  `ctx.request` 是基于 [axios](https://axios-http.com/) 的请求方法，自动集成了 NocoBase 的鉴权机制。你可以像使用 axios 一样发起任意 HTTP 请求，支持所有 axios 的配置参数（如 `url`、`method`、`params`、`data`、`headers` 等）。适用于需要自定义接口调用、一次性数据请求或不适合用 resource 管理的场景。

* **使用场景**：
  - 直接调用后端 API，获取或提交数据。
  - 需要自定义请求参数、请求头或特殊接口调用。
  - 适合一次性请求或不需要响应式联动的场景。

* **注意事项**：
  - 如果是 NocoBase 的数据源的数据表管理，推荐使用 `ctx.model.resource` 操作数据，只有在特殊或自定义接口场景下才使用 `ctx.request`。
  - 返回值为 Promise，resolve 为服务器响应数据，reject 为请求异常。
  - 已自动带上当前用户的鉴权信息，无需手动处理 token。

* **示例**：

```js
try {
  const res = await ctx.request({
    url: '/users',
    method: 'get',
    params: { page: 1, pageSize: 10 }
  });
  console.log('用户列表', res);
} catch (error) {
  console.error('请求失败', error);
}
```

---

## 常见问题解答（FAQ）

**Q: 多个区块之间 getElementById 冲突怎么办？**  
A: 建议都加上 model.uid 后缀。

```ts
const uid = ctx.model.uid;
ctx.element.innerHTML = `
  <button id="rerenderBtn_${uid}">
    重新渲染 ECharts 图表
  </button>
`;
```

**Q: 如何实现区块间数据联动？**  
A: 通过 `getModelById` 获取其他区块的 model 实例，监听其数据变化或调用其方法。

**Q: ctx.request 和 ctx.model.resource 的区别？**  
A:  
- `ctx.request` 是底层的 HTTP 请求方法，直接发起 API 调用，适合简单、一次性的接口请求，返回原始响应数据，需要手动处理数据结构、状态和错误。
- `ctx.model.resource` 是基于资源模型的高级数据操作对象，封装了常用的增删改查（CRUD）、分页、筛选、缓存等能力，并自动与区块的 model 联动，适合需要和后端数据表/资源持续交互、响应式更新的场景。  
一般推荐优先使用 `ctx.resource` 管理数据，只有在特殊或自定义接口场景下才使用 `ctx.request`。

**Q: ctx.requireAsync 和 ctx.requirejs 的区别？**  
A:  
- `ctx.requirejs` 是开源 [requirejs](https://requirejs.org/) 库的加载接口，基于回调函数风格。它用于动态加载外部 JavaScript 模块或 CDN 脚本，适合需要兼容 requirejs 生态或老代码的场景。它本身与“同步/异步”无关，加载过程依然是异步的，只是通过回调获取结果。
- `ctx.requireAsync` 是基于 requirejs 封装的 Promise 风格异步方法，支持 `async/await`，推荐用于现代 JavaScript 开发。加载失败会抛出异常，代码更简洁，易于错误处理。

**推荐优先使用 `ctx.requireAsync`，只有在必须兼容 requirejs 回调风格时才考虑 `ctx.requirejs`。**

**Q: 如果低代码区块的 JavaScript 代码有问题导致页面崩溃无法打开怎么办？**
A: 可以在 URL 末尾添加 `skip_nocobase_lowcode=true` 参数来跳过低代码区块的执行。例如：`http://localhost:3000/admin?skip_nocobase_lowcode=true`。这样可以避免有问题的 JavaScript 代码（或未来版本的破坏性变更）导致页面崩溃而无法从 UI 界面恢复。进入页面后可以修复或删除有问题的低代码区块，然后移除该 URL 参数恢复正常使用。