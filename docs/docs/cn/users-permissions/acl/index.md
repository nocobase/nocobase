# 权限控制

## 介绍

NocoBase 的 ACL 模块主要由两部分组成：

- 内核中的 `@nocobase/acl`，提供核心功能
- 插件中的 `@nocobase/plugin-acl`，提供动态配置能力

## 安装

内置插件，无需单独安装。

## 开发指南

### 扩展一个新的权限配置栏

下面以“移动端菜单”配置项为例，演示如何扩展一个新的权限配置栏。效果如下图所示：

![20240903210248](https://static-docs.nocobase.com/20240903210248.png)

代码如下：

```typescript
import { Plugin } from '@nocobase/client';
import PluginACLClient from '@nocobase/plugin-acl/client';

class PluginMobileClient extends Plugin {
  async load() {
    const aclInstance = this.app.pm.get(PluginACLClient);

    aclInstance?.settingsUI.addPermissionsTab(({ t, TabLayout, activeKey }) => ({
      key: 'mobile-menu',
      label: t('Mobile menu', {
        ns: 'plugin-mobile',
      }),
      children: (
        <TabLayout>
          <MenuPermissions />
        </TabLayout>
      ),
    }));
  }
}
```

首先，我们需要获取到 `PluginACLClient` 插件的实例（[获取插件实例的其它方法](https://docs-cn.nocobase.com/development/client/life-cycle#%E8%8E%B7%E5%8F%96%E6%8F%92%E4%BB%B6)），通过 `settingsUI.addPermissionsTab` 方法添加一个新的权限配置栏。在这个例子中，我们添加了一个名为“移动端菜单”的权限配置栏。

`settingsUI` 属性的值是一个名为 `ACLSettingsUI` 的类的实例，其类型信息如下：

```typescript
import { TabsProps } from 'antd/es/tabs/index';

interface ACLSettingsUI {
  addPermissionsTab(tab: Tab | TabCallback): void;
  getPermissionsTabs(props: PermissionsTabsProps): Tab[];
}

type Tab = TabsProps['items'][0];

type TabCallback = (props: PermissionsTabsProps) => Tab;

interface PermissionsTabsProps {
  /**
   * the key of the currently active tab panel
   */
  activeKey: string;
  /**
   * the currently selected role
   */
  role: Role;
  /**
   * translation function
   */
  t: TFunction;
  /**
   * used to constrain the size of the container in the Tab
   */
  TabLayout: React.FC;
}
```
