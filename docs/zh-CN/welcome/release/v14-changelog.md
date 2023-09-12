# v0.14：全新的插件管理器，支持通过界面添加插件了

这一版本终于实现了生产环境下插件的即插即用，可以直接通过界面添加插件了，支持从 npm registry（可以是私有的）下载、本地上传、URL 下载。

## 新特性

### 全新的插件管理器界面

<img src="https://demo-cn.nocobase.com/storage/uploads/6de7c906518b6c6643570292523b06c8.png" />

### 上传的插件位于 storage/plugins 目录

提供 storage/plugins 目录用于上传即插即用的插件，目录以 npm packages 的方式组织

```bash
|- /storage/
  |- /plugins/
    |- /@nocobase/
      |- /plugin-hello1/
      |- /plugin-hello2/
    |- /@foo/
      |- /bar/
    |- /my-nocobase-plugin-hello/
```

### 插件的更新

目前仅 storage/plugins 下的插件才有更新操作，如图：

<img src="https://demo-cn.nocobase.com/storage/uploads/703809b8cd74cc95e1ab2ab766980817.gif" />

备注：为了便于维护和升级，例如因为升级导致 storage 插件不可用，也可以直接将新插件放到 storage/plugins 目录下，再执行升级操作

## 不兼容的变化

### 插件名的变化

- 不再提供 PLUGIN_PACKAGE_PREFIX 环境变量
- 插件名和包名统一，旧的插件名仍然可以以别名的形式存在

### pm.add 的改进

```bash
# 用 packageName 代替 pluginName，从本地查找，找不到报错
pm add packageName

# 只有提供了 registry 时，才从远程下载，也可以指定版本
pm add packageName --registry=xx --auth-token=yy --version=zz

# 也可以提供本地压缩包，多次 add 用最后的替换
pm add /a/plugin.zip

# 远程压缩包，同名直接替换
pm add http://url/plugin.zip
```
