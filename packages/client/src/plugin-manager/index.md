---
nav:
  path: /client
group:
  path: /client
---

# PluginManager

## PluginManagerProvider

## PluginManager.Toolbar

插件管理器的工具栏，用于便捷的展示所有插件，不常用的可折叠显示。

<code src="./demos/demo1.tsx"/>

## PluginManager.Toolbar.Item

工具栏项，各个插件都可以配置自己的 `PluginManager.Toolbar.Item`

- `icon` pin 时，只显示 icon
- `title` pin 时，title 以 tooltip 的方式显示

最简单的示例

```tsx | pure
Plugin1.ToolbarItem = () => {
  return (
    <PluginManager.Toolbar.Item
      icon={<DatabaseOutlined />}
      title={'Plugin1'}
      onClick={() => {
        alert('Plugin1');
      }}
    />
  );
};
```

弹出抽屉

```tsx | pure
Plugin2.ToolbarItem = () => {
  const [visible, setVisible] = useState(false);
  return (
    <ActionContext.Provider value={{ visible, setVisible }}>
      <PluginManager.Toolbar.Item
        icon={<VerifiedOutlined />}
        title={'Plugin2'}
        onClick={() => {
          setVisible(true);
        }}
      />
      <SchemaComponent scope={{ useCloseAction }} schema={schema} />
    </ActionContext.Provider>
  );
};
```
