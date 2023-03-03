# Built-in Common Resource Actions

## Overview

NocoBase has built-in operation methods for commonly used actions of data resources, such as CRUD, and automatically maps related actions through data table resources.

```javascript
import { Application } from "@nocobase/server";

const app = new Application({
  database: {
    dialect: 'sqlite',
    storage: './db.sqlite',
  },
  registerActions: true // Register built-in resource actions, true by default
});

```

Built-in actions are registered to the `resourcer` instance in `application`. Generally, built-in actions are not called directly unless you need to extend the default action, then you can call the default method within a custom action method.

## Resource Actions

### `list()`

Get a list of data. The URL for the corresponding resource action is `GET /api/<resource>:list`.

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `filter` | `Filter` | - | Filtering parameter |
| `fields` | `string[]` | - | Fields to get |
| `except` | `string[]` | - | Fields to exclude |
| `appends` | `string[]` | - | Association fields to append |
| `sort` | `string[]` | - | Sorting parameter |
| `page` | `number` | 1 | Page break |
| `pageSize` | `number` | 20 | Size per page |

**Example**

When there is a need to provide an interface for querying a list of data that is not output in JSON format by default, it can be extended based on the built-in default method:

```ts
import actions from '@nocobase/actions';

app.actions({
  async ['books:list'](ctx, next) {
    ctx.action.mergeParams({
      except: ['content']
    });

    await actions.list(ctx, async () => {
      const { rows } = ctx.body;
      // transform JSON to CSV output
      ctx.body = rows.map(row => Object.keys(row).map(key => row[key]).join(',')).join('\n');
      ctx.type = 'text/csv';

      await next();
    });
  }
});
```

Example of a request that will get a file in CSV format:

```shell
curl -X GET http://localhost:13000/api/books:list
```

### `get()`

Get a single piece of data. The URL for the corresponding resource action is `GET /api/<resource>:get`.

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `filterByTk` | `number \| string` | - | Filtering primary key |
| `filter` | `Filter` | - | Filtering parameter |
| `fields` | `string[]` | - | Fields to get |
| `except` | `string[]` | - | Fields to exclude |
| `appends` | `string[]` | - | Association fields to append |
| `sort` | `string[]` | - | Sorting parameter |
| `page` | `number` | 1 | Page break |
| `pageSize` | `number` | 20 | Size per page |

**Example**

Extend the build-in file management plugin of NocoBase to return file stream when the client requests to download a file with the resource identifier:

```ts
import path from 'path';
import actions from '@nocobase/actions';
import { STORAGE_TYPE_LOCAL } from '@nocobase/plugin-file-manager';

app.actions({
  async ['attachments:get'](ctx, next) {
    ctx.action.mergeParams({
      appends: ['storage'],
    });

    await actions.get(ctx, async () => {
      if (ctx.accepts('json', 'application/octet-stream') === 'json') {
        return next();
      }

      const { body: attachment } = ctx;
      const { storage } = attachment;

      if (storage.type !== STORAGE_TYPE_LOCAL) {
        return ctx.redirect(attachment.url);
      }

      ctx.body = fs.createReadStream(path.resolve(storage.options.documentRoot?, storage.path));
      ctx.attachment(attachment.filename);
      ctx.type = 'application/octet-stream';

      await next();
    });
  }
});
```

Example request that will get the file stream:

```shell
curl -X GET -H "Accept: application/octet-stream" http://localhost:13000/api/attachments:get?filterByTk=1
```

### `create()`

Create a single piece of data. The URL for the corresponding resource action is `POST /api/<resource>:create`.

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `values` | `Object` | - | The data to create |

**Example**

Create data with binary content as attachment to the uploaded file, it is similar to the file management plugin:

```ts
import multer from '@koa/multer';
import actions from '@nocobase/actions';

app.actions({
  async ['files:create'](ctx, next) {
    if (ctx.request.type === 'application/json') {
      return actions.create(ctx, next);
    }

    if (ctx.request.type !== 'multipart/form-data') {
      return ctx.throw(406);
    }

    // Only use multer() as example here to save and process file, it does not represent the full logic
    multer().single('file')(ctx, async () => {
      const { file, body } = ctx.request;
      const { filename, mimetype, size, path } = file;

      ctx.action.mergeParams({
        values: {
          filename,
          mimetype,
          size,
          path: file.path,
          meta: typeof body.meta === 'string' ? JSON.parse(body.meta) : {};
        }
      });

      await actions.create(ctx, next);
    });
  }
});
```

Example request to create plain data for a file table, you can submit it with an attachment:

```shell
# Create plain data only
curl -X POST -H "Content-Type: application/json" -d '{"filename": "some-file.txt", "mimetype": "text/plain", "size": 5, "url": "https://cdn.yourdomain.com/some-file.txt"}' "http://localhost:13000/api/files:create"

# Submit with attachment
curl -X POST -F "file=@/path/to/some-file.txt" -F 'meta={"length": 100}' "http://localhost:13000/api/files:create"
```

### `update()`

Update one or more pieces of data. The corresponding URL is `PUT /api/<resource>:update`.

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `filter` | `Filter` | - | Filtering parameter |
| `filterByTk` | `number \| string` | - | Filtering primary key |
| `values` | `Object` | - | Data values to update |

Note: Either or both `filter` or `filterByTk` should be provided.

**Example**

Similar to the example of `create()`, you can extend updating file record to a file that carries data with binary content:

```ts
import multer from '@koa/multer';
import actions from '@nocobase/actions';

app.actions({
  async ['files:update'](ctx, next) {
    if (ctx.request.type === 'application/json') {
      return actions.update(ctx, next);
    }

    if (ctx.request.type !== 'multipart/form-data') {
      return ctx.throw(406);
    }

    // Only use multer() as example here to save and process file, it does not represent the full logic
    multer().single('file')(ctx, async () => {
      const { file, body } = ctx.request;
      const { filename, mimetype, size, path } = file;

      ctx.action.mergeParams({
        values: {
          filename,
          mimetype,
          size,
          path: file.path,
          meta: typeof body.meta === 'string' ? JSON.parse(body.meta) : {};
        }
      });

      await actions.update(ctx, next);
    });
  }
});
```

Example request to create plain data for a file table, you can submit it with an attachment:

```shell
# Create plain data only
curl -X PUT -H "Content-Type: application/json" -d '{"filename": "some-file.txt", "mimetype": "text/plain", "size": 5, "url": "https://cdn.yourdomain.com/some-file.txt"}' "http://localhost:13000/api/files:update"

# Submit with attachment
curl -X PUT -F "file=@/path/to/some-file.txt" -F 'meta={"length": 100}' "http://localhost:13000/api/files:update"
```

### `destroy()`

Delete one or more pieces of data. The corresponding URL is `DELETE /api/<resource>:destroy`.

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `filter` | `Filter` | - | Filtering parameter |
| `filterByTk` | `number \| string` | - | Filtering primary key |

Note: Either or both `filter` or `filterByTk` should be provided.

**Example**

Similar to the file management plug-in extension, a deletion of file data also requires the deletion of the corresponding file operation processing simultaneously:

```ts
import actions from '@nocobase/actions';

app.actions({
  async ['files:destroy'](ctx, next) {
    // const repository = getRepositoryFromParams(ctx);

    // const { filterByTk, filter } = ctx.action.params;

    // const items = await repository.find({
    //   fields: [repository.collection.filterTargetKey],
    //   appends: ['storage'],
    //   filter,
    //   filterByTk,
    //   context: ctx,
    // });

    // await items.reduce((promise, item) => promise.then(async () => {
    //   await item.removeFromStorage();
    //   await item.destroy();
    // }), Promise.resolve());

    await actions.destroy(ctx, async () => {
      // do something
      await next();
    });
  }
});
```

### `move()`

The corresponding URL is `POST /api/<resource>:move`.

This method is used to move data and adjust the order of data. For example, if you drag an element above or below another element in a page, you can call this method to achieve order adjustment.

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `sourceId` | `targetKey` | - | ID of the element to move |
| `targetId` | `targetKey` | - | ID of the element to switch position with the  moving element |
| `sortField` | `string` | `sort` | The stored field names of sorting |
| `targetScope` | `string` | - | The scope of sorting, a resource can be sorted by different scopes |
| `sticky` | `boolean` | - | Whether or not to top the moving element |
| `method` | `insertAfter` \| `prepend` | - | Type of insertion, before or after the target element |

## Resource Actions of Association Resource

### `add()`

Add an association to an object. The corresponding URL is `POST /api/<resource.assocition>:add`. Apply to `hasMany` and `belongsToMany` associations.

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `values` | `TargetKey \| TargetKey[]` | - | ID of the association object to add |

### `remove()`

Remove the association to an object. The corresponding URL is `POST /api/<resource.assocition>:remove`.

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `values` | `TargetKey \| TargetKey[]` | - | ID of the associated object to remove |

### `set()`

Set the associated association object. The corresponding URL is `POST /api/<resource.assocition>:set`.

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `values` | `TargetKey \| TargetKey[]` | - | ID of the association object to set |

### `toggle()`

Toggle the associated association object. The corresponding URL is `POST /api/<resource.assocition>:toggle`. `toggle` internally determines if the associated object already exists, removes it if it does, otherwise adds it.

**Parameter**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `values` | `TargetKey` | - | ID of the association object to toggle |
