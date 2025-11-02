# Events

NocoBase's server triggers corresponding events during the application lifecycle, plugin lifecycle, and database operations. Plugin developers can listen to these events to implement extended logic, automated operations, or custom behaviors.

NocoBase's event system is mainly divided into two levels:

- **`app.on()` - Application-level events**: Listen to application lifecycle events, such as starting, installing, and enabling plugins.
- **`db.on()` - Database-level events**: Listen to operation events at the data model layer, such as creating, updating, and deleting records.


Both inherit from Node.js's `EventEmitter` and support standard interfaces like `.on()`, `.off()`, and `.emit()`. NocoBase also extends support for `emitAsync` to asynchronously trigger events and wait for all listeners to complete execution.

## Where to Register Event Listeners

Event listeners should generally be registered in the plugin's `beforeLoad()` method. This ensures that the events are ready during the plugin loading phase, allowing subsequent logic to respond correctly.

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

## Listening to Application Events `app.on()`

Application events are used to capture lifecycle changes of the NocoBase application and its plugins, suitable for initialization logic, resource registration, or plugin dependency checks.

### Common Event Types

| Event Name | Triggered When | Typical Use Cases |
|-----------|------------|-----------|
| `beforeLoad` / `afterLoad` | Before / After application load | Registering resources, initializing configuration |
| `beforeStart` / `afterStart` | Before / After service start | Starting tasks, printing startup logs |
| `beforeInstall` / `afterInstall` | Before / After application installation | Initializing data, importing templates |
| `beforeStop` / `afterStop` | Before / After service stop | Cleaning up resources, saving state |
| `beforeDestroy` / `afterDestroy` | Before / After application destruction | Deleting cache, disconnecting |
| `beforeLoadPlugin` / `afterLoadPlugin` | Before / After plugin load | Modifying plugin configuration or extending functionality |
| `beforeEnablePlugin` / `afterEnablePlugin` | Before / After plugin enable | Checking dependencies, initializing plugin logic |
| `beforeDisablePlugin` / `afterDisablePlugin` | Before / After plugin disable | Cleaning up plugin resources |
| `afterUpgrade` | After application upgrade is complete | Executing data migration or compatibility fixes |

Example: Listening to the application start event

```ts
app.on('afterStart', async () => {
  app.logger.info('🚀 NocoBase service has started!');
});
```

Example: Listening to the plugin load event

```ts
app.on('afterLoadPlugin', ({ plugin }) => {
  app.logger.info(`Plugin ${plugin.name} has been loaded`);
});
```

## Listening to Database Events `db.on()`

Database events can capture various data changes at the model layer and are suitable for operations like auditing, synchronization, and auto-filling.

### Common Event Types

| Event Name | Triggered When |
|-----------|------------|
| `beforeSync` / `afterSync` | Before / After synchronizing database structure |
| `beforeValidate` / `afterValidate` | Before / After data validation |
| `beforeCreate` / `afterCreate` | Before / After creating a record |
| `beforeUpdate` / `afterUpdate` | Before / After updating a record |
| `beforeSave` / `afterSave` | Before / After saving (includes create and update) |
| `beforeDestroy` / `afterDestroy` | Before / After deleting a record |
| `afterCreateWithAssociations` / `afterUpdateWithAssociations` / `afterSaveWithAssociations` | After an operation involving associated data |
| `beforeDefineCollection` / `afterDefineCollection` | Before / After defining a collection |
| `beforeRemoveCollection` / `afterRemoveCollection` | Before / After removing a collection |

Example: Listening to the after-create event

```ts
db.on('afterCreate', async (model, options) => {
  db.logger.info('Data has been created!');
});
```

Example: Listening to the before-update event

```ts
db.on('beforeUpdate', async (model, options) => {
  db.logger.info('Data is about to be updated!');
});
```