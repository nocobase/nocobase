# v0.10：更新说明

## 应用升级

### Docker 安装的升级

无变化

### 源码安装的升级

v0.10 进行了依赖的重大升级，源码升级时，以防出错，需要删掉以下目录之后再升级

```bash
# 删除 .umi 相关缓存
yarn rimraf -rf ./**/{.umi,.umi-production}
# 删除编译文件
yarn rimraf -rf packages/*/*/{lib,esm,es,dist,node_modules}
# 删除依赖
yarn rimraf -rf node_modules
```

### create-nocobase-app 安装的升级

建议直接重新 `yarn create nocobase-app`，再更新 .env 配置

## 功能特色

Q2 季度主要的新特色包括：

- 关系字段组件改进
  - 下拉菜单
  - 数据选择器
  - 子表单
  - 子表格
  - 文件管理器
  - 子详情（阅读模式）
  - 标题（阅读模式）
- 快捷新增关系数据
- 表单数据模板
- 复制操作
- 移动端插件
- 列表区块
- 网格卡片区块
- 用户认证插件（支持不同的登录方式）
- 筛选数据范围支持变量
- 工作流
  - 人工节点升级
  - 聚合查询字段
  - 循环节点
- 文件管理器改进
  - 文件表
  - 附件字段配置
  - 文件管理器组件

### 即将遗弃和可能不兼容的变化

#### 子表格字段组件

不兼容新版，区块字段需要删除（只需要 UI 重配）

```bash
这是一张图
```

#### 附件上传 API 变更

```bash
这是一段说明
```

#### 登录、注册接口的变更

```bash
这是一段说明
```

#### 其他补充

## 第三方插件升级指南

### 依赖升级

v0.10 依赖升级，主要包括

- `react` 升级 v18
- `react-dom` 升级 v18
- `react-router` 升级 v6.11
- `umi` 升级 v4
- `dumi` 升级 v2

插件的 `package.json` 相关依赖要更改为最新版，如：

```diff
{
  "devDependencies": {
+   "react": "^18",
+   "react-dom": "^18",
+   "react-router-dom": "^6.11.2",
-   "react": "^17",
-   "react-dom": "^17",
-   "react-router-dom": "^5",
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
