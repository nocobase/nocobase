# 服务端事件

NocoBase 在应用、插件、数据库的生命周期中提供了非常多的事件监听，这些方法只有在触发了事件之后才会执行。

## 如何添加事件监听？

事件的注册一般放于 beforeLoad 中

```ts
export class MyPlugin extends Plugin {
  // 只有插件激活之后才会执行 beforeLoad()
  beforeLoad() {
    this.app.on();
    this.db.on();
  }
}
```

### `db.on`

数据库相关事件与 Collection 配置、Repository 的 CRUD 相关，包括：

- 'beforeSync' / 'afterSync'
- 'beforeValidate' / 'afterValidate'
- 'beforeCreate' / 'afterCreate'
- 'beforeUpdate' / 'afterUpdate'
- 'beforeSave' / 'afterSave'
- 'beforeDestroy' / 'afterDestroy'
- 'afterCreateWithAssociations'
- 'afterUpdateWithAssociations'
- 'afterSaveWithAssociations'
- 'beforeDefineCollection'
- 'afterDefineCollection'
- 'beforeRemoveCollection' / 'afterRemoveCollection

更多详情参考 [Database API](/api/database#内置事件)。

### `app.on()`

app 的事件与应用的生命周期相关，相关事件有：

- 'beforeLoad' / 'afterLoad'
- 'beforeInstall' / 'afterInstall'
- 'beforeUpgrade' / 'afterUpgrade'
- 'beforeStart' / 'afterStart'
- 'beforeStop' / 'afterStop'
- 'beforeDestroy' / 'afterDestroy'

更多详情参考 [Application API](/api/server/application#事件)。
