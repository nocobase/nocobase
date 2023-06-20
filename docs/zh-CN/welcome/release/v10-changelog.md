# v0.10：更新说明

## 第二季度的新特性

- 关系字段组件改进，支持多种组件切换
  - 下拉选择器
  - 数据选择器
  - 子表单/子详情
  - 子表格
  - 文件管理器
  - 标题（仅阅读模式）
- 快捷创建关系数据，支持两种快捷创建模式
  - 下拉菜单里添加，基于标题字段快速创建一条新纪录
  - 弹窗里添加，可以配置复杂的添加表单
- 复制操作，支持两种复制模式
  - 直接复制
  - 复制到表单里并继续填写
- 表单数据模板
- 筛选数据范围支持变量
- 列表区块
- 网格卡片区块
- 移动端插件
- 用户认证插件，支持不同的登录方式
  - Email/Password
  - SMS
  - OIDC
  - SAML
- 工作流新增节点
  - 人工节点升级，支持从现有数据表里新增和编辑
  - 循环节点
  - 聚合查询节点
- 文件管理器
  - 提供文件表模板
  - 提供文件管理器组件

## 应用升级

### Docker 安装的升级

无变化，升级参考 [Docker 镜像升级指南](/welcome/getting-started/upgrading/docker-compose)

### 源码安装的升级

v0.10 进行了依赖的重大升级，源码升级时，以防出错，需要删掉以下目录之后再升级

```bash
# 删除 .umi 相关缓存
yarn rimraf -rf "./**/{.umi,.umi-production}"
# 删除编译文件
yarn rimraf -rf "packages/*/*/{lib,esm,es,dist,node_modules}"
# 删除依赖
yarn rimraf -rf node_modules
```

更多详情参考 [Git 源码升级指南](/welcome/getting-started/upgrading/git-clone)

### create-nocobase-app 安装的升级

建议 `yarn create` 重新下载新版本，再更新 .env 配置，更多详情参考 [大版本升级指南](/welcome/getting-started/upgrading/create-nocobase-app#大版本升级)

## 即将遗弃和可能不兼容的变化

### 子表格字段组件

不兼容新版，区块字段需要删除重配（只需要 UI 重配）

### 附件上传接口的变更

除了内置的 attachments 表以外，用户也可以自定义文件表，附件的上传接口由 `/api/attachments:upload` 变更为 `/api/<file-collection>:create`，upload 已废弃，依旧兼容 v0.10，但会在下个大版本里移除。

### 登录、注册接口的变更

nocobase 内核提供了更强大的 [auth 模块](https://github.com/nocobase/nocobase/tree/main/packages/plugins/auth)，用户登录、注册、校验、注销接口变更如下：

```bash
/api/users:signin -> /api/auth:signIn
/api/users:signup -> /api/auth:signUp
/api/users:signout -> /api/auth:signOut
/api/users:check -> /api/auth:check
```

注：以上 users 接口，已废弃，依旧兼容 v0.10，但会在下个大版本里移除。

### 日期字段筛选的调整

如果之前数据范围里配置了日期相关筛选，需要删掉重新配置。

## 第三方插件升级指南

### 依赖升级

v0.10 依赖升级，主要包括

- `react` 升级到 v18
- `react-dom` 升级到 v18
- `react-router` 升级到 v6.11
- `umi` 升级到 v4
- `dumi` 升级到 v2

插件的 `package.json` 相关依赖要更改为最新版，如：

```diff
{
  "devDependencies": {
+   "react": "^18".
+   "react-dom": "^18".
+   "react-router-dom": "^6.11.2".
-   "react": "^17".
-   "react-dom": "^17".
-   "react-router-dom": "^5".
  }
}
```

### 代码修改

由于 react-router 的升级，代码层面也需要改动，主要变更包括

#### Layout 布局组件

Layout 布局组件需要使用 `<Outlet />` 代替 `props.children`。

```diff
import React from 'react';
+ import { Outlet } from 'react-router-dom';

export default function Layout(props) {
  return (
    <div>
-      { props.children }
+      <Outlet />
    </div>
  );
}
```

使用了 `React.cloneElement` 方式渲染的路由组件改造，示例：

```diff
import React from 'react';
+ import { Outlet } from 'react-router-dom';

export default function RouteComponent(props) {
  return (
    <div>
-      { React.cloneElement(props.children, { someProp: 'p1' }) }
+      <Outlet context={{ someProp: 'p1' }} />
    </div>
  );
}
```

组件改成从 `useOutletContext` 取值

```diff
import React from 'react';
+ import { useOutletContext } from 'react-router-dom';

- export function Comp(props){
+ export function Comp() {
+   const props = useOutletContext();
  return props.someProp;
}
```

#### Redirect

`<Redirect>` 转为 `<Navigate replace />`。

```diff
- <Redirect to="about" />
+ <Navigate to="about" replace />
```

#### useHistory

`useNavigate` 代替 `useHistory`。

```diff
- import { useHistory } from 'react-router-dom';
+ import { useNavigate} from 'react-router-dom';

- const history = useHistory();
+ const navigate = useNavigate();

- history.push('/about')
+ navigate('/about')

- history.replace('/about')
+ navigate('/about', { replace: true })
```

#### useLocation

`useLocation<type>()` 改为 `useLocation`。

```diff
- const location= useLocation<type>();
+ const location= useLocation();
```

`const { query } = useLocation()` 改为 `useSearchParams()`。

```diff
- const location = useLocation();
- const query = location.query;
- const name = query.name;
+ const [searchParams, setSearchParams] = useSearchParams();
+ searchParams.get('name');
```

#### path

支持下面的 `path` 方式

```
/groups
/groups/admin
/users/:id
/users/:id/messages
/files/*
/files/:id/*
```

不再支持如下方式
```
/tweets/:id(\d+)
/files/*/cat.jpg
/files-*
```

更多改动和 api 变更，请查阅 [react-router@6](https://reactrouter.com/en/main/upgrading/v5)。
