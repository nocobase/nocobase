# v0.15

## 新特性

## 不兼容的变化

### 插件配置页面注册方式

以前使用 `SettingsCenterProvider` 注册插件配置页面，例如：

```tsx | pure

const HelloProvider = React.memo((props) => {
  return (
    <SettingsCenterProvider
      settings={{
        'hello': {
          title: 'Hello',
          icon: 'ApiOutlined',
          tabs: {
            tab1: {
              title: 'Hello tab',
              component: HelloPluginSettingPage,
            },
          },
        },
      }}
    >
      {props.children}
    </SettingsCenterProvider>
  );
});
```

现在需要改为：

```tsx | pure
class HelloPlugin extends Plugin {
  async load() {
    this.app.settingsCenter.add('hello', {
      title: 'Hello', // 原 title
      icon: 'ApiOutlined', // 原 icon
      Component: HelloPluginSettingPage, // 原 tab component
      aclSnippet: 'pm.hello.tab1', // 权限片段，保证权限的 code 和之前的一致，如果是新插件，不需要传这个参数
    });
  }
}
```

如果插件配置页面内部有链接跳转的话，需要进行相应的更改，例如：

```tsx | pure
navigate('/admin/settings/hello/tab1');
```

改为：

```tsx | pure
import { useApp } from '@nocobase/client'
const app = useApp();
navigate(app.settingsCenter.getRoutePath('hello')); // 当然也可以直接写 navigate('/admin/settings/hello');
```

更多信息，请参考 [插件配置页面](/development/client/settings-center)。
