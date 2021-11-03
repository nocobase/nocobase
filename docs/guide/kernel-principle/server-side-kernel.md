---
order: 1
---

# Server-side Kernel

## Microservices

To understand NocoBase faster, let's create an application with a new app.js file with the following code.

```ts
const { Application } = require('@nocobase/server');

const app = new Application({
  // omit the configuration information
});

// configure a users table
app.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'username' },
    { type: 'password', name: 'password' }
  ],
});

// parse argv arguments, terminal does different operations via command line
app.parse(process.argv);
```

The terminal runs

```bash
# Generate database table structure based on configuration
node app.js db:sync
# Start the application
node app.js start --port=3000
```

The REST API for the relevant users table is generated

```bash
GET http://localhost:3000/api/users
POST http://localhost:3000/api/users
GET http://localhost:3000/api/users/1
PUT http://localhost:3000/api/users/1
DELETE http://localhost:3000/api/users/1
```

The above example creates a real working REST API service in just about 10 lines of code. In addition to the built-in REST API, you can also customize other actions such as login, registration, logout, etc. via ``app.actions()`.

```ts
app.actions({
  async login(ctx, next) {},
  async register(ctx, next) {},
  async logout(ctx, next) {},
}, {
  resourceName: 'users', // resource belonging to users
});
```

The HTTP API for the above custom operation is

```bash
POST http://localhost:3000/api/users:login
POST http://localhost:3000/api/users:register
POST http://localhost:3000/api/users:logout
```

The custom HTTP API remains in the style of the REST API, represented in the ``<resourceName>:<actionName>` format. In fact, the REST API can also explicitly specify ``actionName``, and when ``actionName`` is specified, it does not matter what request method is used, e.g.

```bash
# Update actions
PUT http://localhost:3000/api/users/1
# is equivalent to
POST http://localhost:3000/api/users:update/1

# Delete operation
DELETE http://localhost:3000/api/users/1
# Equivalent to
GET http://localhost:3000/api/users:destroy/1
# Equivalent to
POST http://localhost:3000/api/users:destroy/1
```

NocoBase's Resourcer is designed based on Resource and Action, combining REST and RPC to provide a more flexible and unified Resource Action API. combined with the client SDK it looks like

```ts
const { ClientSDK } = require('@nocobase/sdk');

const api = new ClientSDK({
  // can be adapted to different requests
  request(params) => Promise.resolve({}),
});

await api.resource('users').list();
await api.resource('users').create();
await api.resource('users').get();
await api.resource('users').update();
await api.resource('users').destroy();
await api.resource('users').login();
await api.resource('users').register();
await api.resource('users').logout();
```

## Application

NocoBase's Application inherits Koa, integrates with DB and CLI, adds some essential APIs, here are some highlights.

- `app.db`: database instance, each app has its own db.
    - `db.getCollection()` data table/dataset
      - `collection.repository` data warehouse
      - `collection.model` data model
  - `db.on()` Add event listener, provided by EventEmitter
  - ` db.exit()` Triggers an event, provided by EventEmitter
  - `db.exitAsync()` Triggers an asynchronous event
- `app.cli`, the Commander instance, provides command-line operations
- `app.context`, the context
  - `ctx.db`
  - `ctx.action`, the current resource operation instance
    - `action.params` operation parameters
    - `action.mergeParams()` parameter merge method
- `app.constructor()` initialization
- `app.collection()` Define data Schema, equivalent to `app.db.collection()`
- `app.resource()` Define resources
- `app.actions()` defines the resource's action methods
- `app.on()` Add event listeners, provided by EventEmitter
- `app.exit()` Triggers an event, provided by the EventEmitter
- `app.exitAsync()` Triggers an asynchronous event
- `app.use()` Add middleware, provided by Koa
- `app.command()` Custom command line, equivalent to `app.cli.command()`
- `app.plugin()` Add plugins
- `app.load()` Load configuration, mainly for loading plugins
- `app.parse()` parse argv arguments, written at the end, equivalent to `app.cli.parseAsync()`

## Collection

NocoBase defines the Schema of the data through the `app.collection()` method, the types of Schema include

Attribute

- Boolean Boolean
- String String
- Text long text
- Integer integer
- Float Floating-point
- Decimal Currency
- Json/Jsonb/Array Different database JSON types are not the same, there are compatibility problems
- Time Time
- Date
- Virtual Virtual fields
- Reference
- Formula Calculation formula
- Context Context
- Password Password
- Sort Sort

Relationships Association/Realtion

- HasOne One-to-One
- HasMany One-to-Many
- BelongsToMany
- BelongsToMany Many-to-many
- Polymorphic Polymorphism

For example, the table structure of a micro-blog can be designed like this

```ts
// users
app.collection({
  name: 'users',
  fields: {
    username: { type: 'string', unique: true },
    password: { type: 'password', unique: true },
    posts: { type: 'hasMany' },
  },
});

// Articles
app.collection({
  name: 'posts',
  fields: {
    title: 'string',
    content: 'text',
    tags: 'believesToMany',
    comments: 'hasMany',
    author: { type: 'belongsTo', target: 'users' }
  },
});

// Tags
app.collection({
  name: 'tags',
  fields: [
    { type: 'string', name: 'name' }
    { type: 'belongsToMany', name: 'posts' },
  ],
});

// Comments
app.collection({
  name: 'comments',
  fields: [
    { type: 'text', name: 'content' },
    { type: 'belongsTo', name: 'user' },
  ],
});
```

In addition to configuring the schema via `app.collection()`, you can also directly call the api to insert or modify the schema, the core API of collection are

- `collection` The data structure of the current collection
  - `collection.hasField()` Determine if a field exists
  - `collection.addField()` Add a field configuration
  - `collection.getField()` Get the field configuration
  - `collection.removeField()` Remove a field configuration
  - `collection.sync()` Synchronize with database table structure
- `collection.repository` The data repository for the current collection
  - `repository.findMany()`
  - `repository.findOne()`
  - `repository.create()`
  - `repository.update()`
  - `repository.destroy()`
  - `repository.relatedQuery().for()`
    - `create()`
    - `update()`
    - `destroy()`
    - `findMany()`
    - `findOne()`
    - `set()`
    - `add()`
    - `remove()`
    - `toggle()`
- `collection.model` The data model of the current collection

Collection example.

```ts
const collection = app.db.getCollection('posts');

collection.hasField('title');

collection.getField('title');

// Add or update
collection.addField({
  type: 'string',
  name: 'content',
});

// Remove
collection.removeField('content');

// add, or specify a key path to replace
collection.mergeField({
  name: 'content',
  type: 'string',
});

In addition to the global `db.sync()`, there is also the `collection.sync()` method.

await collection.sync();
```

`db:sync` is one of the very commonly used command lines to generate a table structure from the collection's schema. See the CLI section for more details. After ``db:sync``, you can write data to the table, either using Repository or Model operations.

- Repository initially provides findAll, findOne, create, update, destroy core operations.
- Model. See the Sequelize documentation for detailed instructions on how to use it.
- Model depends on the adapted ORM, Repository provides a unified interface based on Model.

Creating data via Repository

```ts
const User = app.db.getCollection('users');

const user = await User.repository.create({
  title: 't1',
  content: 'c1',
  author: 1,
  tags: [1,2,3],
}, {
  whitelist: [],
  blacklist: [],
});

await User.repository.findMany({
  filter: {
    title: 't1',
  },
  fields: ['id', 'title', 'content'],
  sort: '-created_at',
  page: 1,
  perPage: 20,
});

await User.repository.findOne({
  filter: {
    title: 't1',
  },
  fields: ['id', 'title', 'content'],
  sort: '-created_at',
  page: 1,
  perPage: 20,
});

await User.repository.update({
  title: 't1',
  content: 'c1',
  author: 1,
  tags: [1,2,3],
}, {
  filter: {},
  whitelist: [],
  blacklist: [],
});

await User.repository.destroy({
  filter: {},
});
```

Create data from Model

```ts
const User = db.getCollection('users');
const user = await User.model.create({
  title: 't1',
  content: 'c1',
});
```

## Resource & Action

Resource is an Internet resource, and all Internet resources correspond to an address. In REST, the request method (GET/POST/PUT/DELETE) is used to identify the specific action, but the request method is rather limited, for example, the above mentioned login, registration and logout cannot be represented by REST API. To solve such problems, NocoBase represents resource actions in `<resourceName>:<actionName>` format. In the world of the relational model, relationships are everywhere, and based on relationships, NocoBase extends the concept of relational resources, with actions corresponding to relational resources in the format `<associatedName>. <resourceName>:<actionName>`.

The Collection is automatically synchronized to the Resource, as defined in the Schema in the Collection section above, and the resources that can be refined are

- `users`
- `users.posts`
- `posts`
- `posts.tags`
- `posts.comments`
- `posts.author`
- `tags`
- `tags.posts`
- `comments`
- `comments.user`

<Alert title="Relationship and differences between Collection and Resource" type="warning">

- Collection defines the schema (structure and relationships) of the data
- Resource defines the action of the data
- The data structure of the Resource request and response is defined by the Collection
- Collection is automatically synchronized to Resource by default
- The concept of Resource is much larger and can interface to external data or other customizations in addition to the Collection

</Alert>

Resource-related APIs are.

- `app.resource()`
- `app.actions()`
- `ctx.action`

A resource can have multiple actions.

```ts
// Data classes
app.resource({
  name: 'users',
  actions: {
    async list(ctx, next) {},
    async get(ctx, next) {},
    async create(ctx, next) {}, async create(ctx, next) {},
    async update(ctx, next) {},
    async destroy(ctx, next) {}, async destroy(ctx, next) {},
  },
});

// Non-data classes
app.resource({
  name: 'server',
  actions: {
    // Get the server time
    getTime(ctx, next) {},
    // Health check
    healthCheck(ctx, next) {},
  },
});
```

General operations can be used for different resources

```ts
app.actions({
  async list(ctx, next) {},
  async get(ctx, next) {},
  async create(ctx, next) {},
  async update(ctx, next) {},
  async destroy(ctx, next) {},
}, {
  // shared globally if resourceName is not specified
  resourceNames: ['posts', 'comments', 'users'],
});
```

The action defined inside the resource will not be shared, regular operations like adding, deleting, changing and checking are recommended to be set as global, `app.resource()` only set parameters, e.g.

```ts
app.resource({
  name: 'users',
  actions: {
    list: {
      fields: ['id', 'username'], // output only the id and username fields
      filter: {
        'username.$ne': 'admin', // data range filtering filter username ! = admin
      },
      sort: ['-created_at'], // reverse order of creation time
      perPage: 50,
    },
    get: {
      fields: ['id', 'username'], // output only the id and username fields
      filter: {
        'username.$ne': 'admin', // data range filtering filter username ! = admin
      },
    },
    create: {
      fields: ['username'], // whitelist
    },
    update: {
      fields: ['username'], // whitelist
    },
    destroy: {
      filter: { // cannot delete admin
        'username.$ne': 'admin',
      },
    },
  },
});

// The app has built-in list, get, create, update, destroy operations by default
app.actions({
  async list(ctx, next) {},
  async get(ctx, next) {},
  async create(ctx, next) {}, async create(ctx, next) {},
  async update(ctx, next) {},
  async destroy(ctx, next) {}, async destroy(ctx, next) {},
});
```

In both the Middleware Handler and the Action Handler, the current action instance is available via `ctx.action`, providing two very useful APIs.

- ``ctx.action.params``: Get the parameters of the action
- `ctx.action.mergeParams()`: handles merging of parameters from multiple sources

`ctx.action.params` has.

- Locate resources and actions
  - `actionName`
  - `resourceName`
  - `associatedName`
- Locate the resource ID
  - `resourceId`
  - `associatedId`
- request query
  - `filter`
  - `fields`
  - `sort`
  - `page`
  - `perPage`
  - Other query values
- request body
  - `values`

Example.

```ts
async function (ctx, next) {
  const { resourceName, resourceId, filter, fields } = ctx.action.params;
  // ...
}
```

`ctx.action.mergeParams()` is mainly used for merging multi-source parameters, using the `filter` parameter as an example. E.g., client request for articles created on 2021-09-15

```bash
GET /api/posts:list?filter={"created_at": "2021-09-15"}
```

Resource settings are locked to view only published posts

```ts
app.resource({
  name: 'posts',
  actions: {
    list: {
      filter: { status: 'publish' }, // Only view published posts
    },
  },
})
```

Permissions to view only articles you have created

```ts
app.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action.params;
  if (resourceName === 'posts' && actionName === 'list') {
    ctx.action.mergeParams({
      filter: {
        created_by_id: ctx.state.currentUser.id,
      },
    });
  }
  await next();
});
```

We specify filter parameters within the client, resource configuration, and middleware above, and the parameters from the three sources will eventually be merged together as the final filter condition: `

```ts
async function list(ctx, next) {
  // The filter obtained in the list operation
  console.log(ctx.params.filter);
  // filter is a special and merge
  // {
  // and: [
  // { created_at: '2021-09-15' }
  // { status: 'published' },
  // { created_by_id: 1, }
  // ]
  // }
}
```

## Event

Event listeners are placed before and after the execution of an action, and can be added via `app.db.on()` and `app.on()`. The difference is that

- `app.db.on()` adds a database level listener
- `app.on()` adds a listener at the server application level

Take `users:login` as an example, it is a `query` operation in the database and a `login` operation in the application. In other words, if you need to log the login operation, you have to handle it in `app.on()`.

```ts
// Triggered when User.create() is executed when creating data
app.db.on('users.beforeCreate', async (model) => {});

// Triggered when the client `POST /api/users:login`
app.on('users.beforeLogin', async (ctx, next) => {});

// Triggered when the client `POST /api/users`
app.on('users.beforeCreate', async (ctx, next) => {});
```

## Middleware

Server Application is based on Koa, all Koa plugins (middleware) can be used directly and can be added via `app.use()`. For example

```ts
const responseTime = require('koa-response-time');
app.use(responseTime());

app.use(async (ctx, next) => {
  await next();
});
```

Slightly different from `koa.use(middleware)`, `app.use(middleware, options)` has an additional options parameter that can be used to qualify the resource and action, as well as to control where the middleware is inserted.

```ts
import { middleware } from '@nocobase/server';

app.use(async (ctx, next) => {}, {
  name: 'middlewareName1',
  resourceNames: [], // acts on all actions within the resource
  actionNames: [
    'list', // all list actions
    'users:list', // List action for users resource only,
  ],
  insertBefore: '',
  insertAfter: '',
});
```

## CLI

Application can be a CLI (with built-in Commander) in addition to being an HTTP Server. The current built-in commands are

- `init` initialize
- `db:sync --force` to configure synchronization with the database table structure
- `start --port` to start the application
- `plugin:**` Plugin-related

Customization.

```ts
app.command('foo').action(async () => {
  console.log('foo...') ;
});
```

## Plugin

Above, the core extension interfaces are described, including but not limited to.

- Database/Collection
  - `app.db` database instance
  - `app.collection()` is equivalent to `app.db.collection()`
- Resource/Action
  - `app.resource()` is the same as `app.resourcer.define()`
  - `app.actions()` is the same as `app.resourcer.registerActions()`
- Hook/Event
  - `app.on()` Add a server listener
  - `app.db.on()` Add a database listener
- Middleware
  - `app.use()` Add middleware
- CLI
  - `app.cli` commander instance
  - `app.command()` is equivalent to `app.cli.command()`

Based on the above extension interface, further modular and pluggable plugins are provided, which can be added via `app.plugin()`. The process of plugins includes install, upgrade, activate, load, disable, uninstall, and the unwanted process can be missing. For example.

**the simplest plugin**

```ts
app.plugin(function pluginName1() {

});
```

Plugins added in this way will load directly, no installation required.

**JSON style**

```ts
const plugin = app.plugin({
  enable: false, // default is true, you can disable it if you don't need to enable it.
  name: 'plugin-name1',
  displayName: 'plugin-name',
  version: '1.2.3',
  dependencies: {
    pluginName2: '1.x', 
    pluginName3: '1.x',
  },
  async install() {},
  async upgrade() {},
  async activate() {},
  async bootstrap() {},
  async deactivate() {},
  async unstall() {},
});
// Activate the plugin via the api
plugin.activate();
```

**OOP style**

```ts
class MyPlugin extends Plugin {
  async install() {}
  async upgrade() {}
  async bootstrap() {}
  async activate() {}
  async deactivate() {}
  async unstall() {}
}

app.plugin(MyPlugin);
// or
app.plugin({
  name: 'plugin-name1',
  displayName: 'plugin-name',
  version: '1.2.3',
  dependencies: {
    pluginName2: '1.x', 
    pluginName3: '1.x',
  },
  plugin: MyPlugin,
});
```

**Reference to a separate Package**

```ts
app.plugin('@nocobase/plugin-action-logs');
```

Plugin information can also be written directly in `package.json`

```js
{
  name: 'pluginName1',
  displayName: 'pluginName',
  version: '1.2.3',
  dependencies: {
    pluginName2: '1.x', 
    pluginName3: '1.x',
  },
}
```

**Plugins CLI**

```bash
plugin:install pluginName1
plugin:unstall pluginName1
plugin:activate pluginName1
plugin:deactivate pluginName1
```

Currently available plugins.

- @nocobase/plugin-collections provides data table configuration interface to manage data tables via HTTP API.
- @nocobase/plugin-action-logs Action logs
- @nocobase/plugin-automations Automation (not upgraded to v0.5, not available yet)
- @nocobase/plugin-china-region China Administrative Region
- @nocobase/plugin-client provides a client-side, codeless visual configuration interface that needs to be used in conjunction with @nocobase/client
- @nocobase/plugin-export exports
- @nocobase/plugin-file-manager File manager
- @nocobase/plugin-permissions Roles and permissions
- @nocobase/plugin-system-settings System configuration
- @nocobase/plugin-ui-router Front-end routing configuration
- @nocobase/plugin-ui-schema ui configuration
- @nocobase/plugin-users user module

## Testing

If you have code, you need to test it. @nocobase/test provides mockDatabase and mockServer for database and server testing, e.g.

```ts
import { mockServer, MockServer } from '@nocobase/test';

describe('mock server', () => {
  let api: MockServer;

  beforeEach(() => {
    api = mockServer({
      dataWrapping: false,
    });
    api.actions({
      list: async (ctx, next) => {
        ctx.body = [1, 2];
        await next();
      },
    });
    api.resource({
      name: 'test',
    });
  });

  afterEach(async () => {
    return api.destroy();
  });

  it('agent.get', async () => {
    const response = await api.agent().get('/test');
    expect(response.body).toEqual([1, 2]);
  });

  it('agent.resource', async () => {
    const response = await api.agent().resource('test').list();
    expect(response.body).toEqual([1, 2]);
  });
});
```

## Client

To allow more non-developers to participate, NocoBase provides a companion client plugin - a visual configuration interface without code. The client plugin needs to be used in conjunction with @nocobase/client and can be used directly or modified by yourself.

Plugin configuration

```ts
app.plugin('@nocobase/plugin-client', {
  // Customize the dist path
  dist: path.resolve(__dirname, '. /node_modules/@nocobase/client/app'),
});
```

To meet the needs of various scenarios, the client `@nocobase/client` provides a rich set of basic components.

- Action - Action
  - Window Open in the current browser window/tab
  - Drawer opens the drawer (default right-hand drawer)
  - Action.Modal Open dialog box
  - Dropdown Dropdown menu
  - Popover Bubble card
  - Action.Group Grouping of buttons
  - Action.Bar Action Bar
- AddNew "Add" module
  - AddNew.CardItem - add a block
  - AddNew.PaneItem - add block (view panel, related to currently viewed data)
  - AddNew.FormItem - add fields
- BlockItem/CardItem/FormItem - decorators
  - BlockItem - normal decorator (no wrapping effect)
  - CardItem - card decorator
  - FormItem - field decorator
- Calendar - Calendar
- Cascader - Cascade selection
- Chart - Chart
- Checkbox - Checkboxes
- Checkbox.Group - Multiple checkboxes
- Collection - Data Table Configuration
- Collection.Field - Data table fields
- ColorSelect - color selector
- DatePicker - date picker
- DesignableBar - Configuration Toolbar
- Filter - filter
- Form - Form
- Grid - Grid layout
- IconPicker - Icon selector
- Input - input box
- TextArea - Multi-line input box
- InputNumber - Number box
- Kanban - Kanban board
- ListPicker - list picker (for selecting and displaying associated data)
- Markdown editor
- Menu - Menu
- Password - password
- Radio - radio box
- Select - selector
- Table - Table
- Tabs - Tabs
- TimePicker - time picker
- Upload - Upload

You can extend the component by yourself, the above component is built based on Formily, how to customize the component you see the related component source code or Formily documentation, here is something different.

- How to extend the database fields?
- How to add third party blocks to the AddNew module?
- How to add more built-in actions to the action bar?
- How can I customize the configuration toolbar?

In addition to the components having flexible extensions, the client can also be used in any front-end framework to customize Request and Router, e.g.

<pre lang="tsx">
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { ClientSDK, Application } from '@nocobase/client';

// Initialize the client instance
const client = new ClientSDK({
  request: (options) => Promise.resolve({}),
});

// Adapting the Route Component
const RouteSwitch = createRouteSwitch({
  components: {
    AdminLayout,
    AuthLayout,
    RouteSchemaRenderer,
  },
});

ReactDOM.render(
  <ClientProvider client={client}>
    <MemoryRouter initialEntries={['/admin']}>
      <RouteSwitch routes={[]}/>
    </MemoryRouter
  </ClientProvider>,
  document.getElementById('root'),
);
</pre>

For more details, you can initialize the project scaffolding and experience it via `create-nocobase-app`.

```bash
yarn create nocobase-app my-nocobase-project
```

By default, nocobase-app uses umijs as the project builder and integrates Server as the data interface. The initialized directory structure is as follows

```bash
|- src
  |- pages
  |- apis
|- .env
|- .umirc.ts
|- package.json
```

## Cases

Small MIS with full front and back ends.

<img src="../../images/MiniMIS.png" style="max-width: 300px; width: 100%;">

API service with no client, providing a pure back-end interface.

<img src="../../images/API.png" style="max-width: 280px; width: 100%;">

Applet + Backend admin, only one set of database, but two sets of users and permissions, one for backend users and one for applet users.

<img src="../../images/MiniProgram.png" style="max-width: 600px; width: 100%;">

SaaS service (shared user), each application has its own supporting database and the data of each application is completely isolated. Applications don't need user and permission modules, SaaS master is shared globally now.

<img src="../../images/SaaS2.png" style="max-width: 450px; width: 100%;">

SaaS service (independent user), each app has its own independent user module and permissions, and the app can be bound to its own domain.

<img src="../../images/SaaS1.png" style="max-width: 450px; width: 100%;">
