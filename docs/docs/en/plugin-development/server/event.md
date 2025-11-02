# Event

NocoBase's server (Server) triggers corresponding events (Event) during application lifecycle, plugin lifecycle, and database operations. Plugin developers can listen to these events to implement extension logic, automated operations, or custom behaviors.

NocoBase's event system is mainly divided into two levels:

- **`app.on()` - Application Level Events**: Listen to application lifecycle events, such as startup, installation, enabling plugins, etc.
- **`db.on()` - Database Level Events**: Listen to data model level operation events, such as creating, updating, deleting records, etc.

Both inherit from Node.js's `EventEmitter`, supporting standard `.on()`, `.off()`, `.emit()` interfaces. NocoBase also extends support for `emitAsync`, used to asynchronously trigger events and wait for all listeners to complete execution.

## Where to Register Event Listeners

Event listeners should generally be registered in the plugin's `beforeLoad()` method, ensuring events are ready during the plugin loading phase, and subsequent logic can respond correctly.

```ts
import { Plugin } from '@nocobase/server';

export default class PluginHelloServer extends Plugin {
  async beforeLoad() {

    // Listen to application events
    this.app.on('afterStart', () => {
      app.logger.info('NocoBase has started');
    });

    // Listen to database events
    this.db.on('afterCreate', (model) => {
      if (model.collectionName === 'posts') {
        app.logger.info(`New post: ${model.get('title')}`);
      }
    });
  }
}
```

## Listen to Application Events `app.on()`

Application events are used to capture NocoBase application and plugin lifecycle changes, suitable for initialization logic, resource registration, or plugin dependency detection.

### Common Event Types

| Event Name                  | Trigger Timing | Typical Uses |
| --------------------------- | -------------- | ------------ |
| `beforeLoad` / `afterLoad`  | Before / after application load | Register resources, initialize configuration |
| `beforeStart` / `afterStart` | Before / after service startup | Start tasks, print startup logs |
| `beforeInstall` / `afterInstall` | Before / after application installation | Initialize data, import templates |
| `beforeStop` / `afterStop`  | Before / after service stop | Clean up resources, save state |
| `beforeDestroy` / `afterDestroy` | Before / after application destruction | Delete cache, disconnect connections |
| `beforeLoadPlugin` / `afterLoadPlugin` | Before / after plugin load | Modify plugin configuration or extend functionality |
| `beforeEnablePlugin` / `afterEnablePlugin` | Before / after plugin enable | Check dependencies, initialize plugin logic |
| `beforeDisablePlugin` / `afterDisablePlugin` | Before / after plugin disable | Clean up plugin resources |
| `afterUpgrade`              | After application upgrade completes | Execute data migration or compatibility fixes |

Example: Listen to application startup event

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 NocoBase service has started!');
});
```

Example: Listen to plugin load event

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Plugin ${plugin.name} has been loaded`);
});
```

## Listen to Database Events `db.on()`

Database events can capture various data changes at the model level, suitable for auditing, synchronization, auto-filling, and other operations.

### Common Event Types

| Event Name                          | Trigger Timing |
| ----------------------------------- | -------------- |
| `beforeSync` / `afterSync`          | Before / after synchronizing database structure |
| `beforeValidate` / `afterValidate`  | Before / after data validation |
| `beforeCreate` / `afterCreate`      | Before / after creating records |
| `beforeUpdate` / `afterUpdate`      | Before / after updating records |
| `beforeSave` / `afterSave`          | Before / after save (includes create and update) |
| `beforeDestroy` / `afterDestroy`    | Before / after deleting records |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | After operations including association data |
| `beforeDefineCollection` / `afterDefineCollection` | Before / after defining collections |
| `beforeRemoveCollection` / `afterRemoveCollection` | Before / after removing collections |

Example: Listen for the event after data creation

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Data has been created!');
});
```

Example: Listen for the event before data update

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Data is about to be updated!'); // The original Chinese text had a copy-paste error, this is the corrected log message.
});
```

