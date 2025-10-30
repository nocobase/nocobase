# Server-side Events

NocoBase provides many event listeners in the lifecycle of applications, plugins, and databases. These methods are executed only after an event is triggered.

## How to add event listeners?

Event registration is generally placed in `beforeLoad`.

```ts
export class MyPlugin extends Plugin {
  // beforeLoad() is executed only after the plugin is activated
  beforeLoad() {
    this.app.on();
    this.db.on();
  }
}
```

### `db.on`

Database-related events are related to Collection configuration and Repository's CRUD, including:

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

For more details, refer to [Database API](/api/database#内置事件).

### `app.on()`

App events are related to the application's lifecycle. Related events are:

- 'beforeLoad' / 'afterLoad'
- 'beforeInstall' / 'afterInstall'
- 'beforeUpgrade' / 'afterUpgrade'
- 'beforeStart' / 'afterStart'
- 'beforeStop' / 'afterStop'
- 'beforeDestroy' / 'afterDestroy'

For more details, refer to [Application API](/api/server/application#事件).