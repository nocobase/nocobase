# Overview

HTTP API of NocoBase is designed based on Resource & Action, a superset of REST API. The operation includes but not limited to create, read, update and delete. Resource Action can be extended arbitrarily in NocoBase.

## Resource

In NocoBase, resource has two expressions:

- `<collection>`
- `<collection>.<association>`

<Alert>

- Collection is the set of all abstract data
- Association is the associated data of collection
- Resource includes both collection and collection.association

</Alert>

### Example

- `posts` Post
- `posts.user` Post user
- `posts.tags` Post tags

## Action

Action on resource is expressed by `:<action>`

- `<collection>:<action>`
- `<collection>.<association>:<action>`

Built-in global actions for collection or association:

- `create`
- `get`
- `list`
- `update`
- `destroy`
- `move`

Built-in association actions for association only:

- `set`
- `add`
- `remove`
- `toggle`

### Example

- `posts:create` Create post
- `posts.user:get` Get post user
- `posts.tags:add` Add tags to post (associate existing tags with post)

## Request URL

```bash
<GET|POST>   /api/<collection>:<action>
<GET|POST>   /api/<collection>:<action>/<collectionIndex>
<GET|POST>   /api/<collection>/<collectionIndex>/<association>:<action>
<GET|POST>   /api/<collection>/<collectionIndex>/<association>:<action>/<associationIndex>
```

### Example

posts resource

```bash
POST  /api/posts:create
GET   /api/posts:list
GET   /api/posts:get/1
POST  /api/posts:update/1
POST  /api/posts:destroy/1
```

posts.comments resource

```bash
POST  /api/posts/1/comments:create
GET   /api/posts/1/comments:list
GET   /api/posts/1/comments:get/1
POST  /api/posts/1/comments:update/1
POST  /api/posts/1/comments:destroy/1
```

posts.tags resource

```bash
POST  /api/posts/1/tags:create
GET   /api/posts/1/tags:get
GET   /api/posts/1/tags:list
POST  /api/posts/1/tags:update
POST  /api/posts/1/tags:destroy
POST  /api/posts/1/tags:add
GET   /api/posts/1/tags:remove
```

## Locate Resource

- Collection resource locates the data to be processed by `collectionIndex`, `collectionIndex` must be unique.
- Association resource locates the data to be processed by `collectionIndex` and `associationIndex` jointly, `associationIndex` may not be unique, but the joint index of `collectionIndex` and `associationIndex` must be unique.

When viewing details of association resource, the requested URL needs to provide both `<collectionIndex>` and `<associationIndex>`, `<collectionIndex>` is necessary as `<associationIndex>` may not be unique.

For example, `tables.fields` represents the fields of a data table:

```bash
GET   /api/tables/table1/fields/title
GET   /api/tables/table2/fields/title
```

Both table1 and table2 have the title field, title is unique in one table, but other tables may also have fields of that name.

## Request Parameters

Request parameters can be placed in the headers, parameters (query string), and body (GET requests do not have a body) of the request.

Some special request parameters:

- `filter` Data filtering, used in actions related to query.
- `filterByTk` Filter by tk field, used in actions to specify details of data.
- `sort` Sorting, used in actions related to query.
- `fields` Date to output, used in actions related to query
- `appends` Fields of additional relationship, used in actions related to query.
- `except` Exclude some fields (not to output), used in actions related to query.
- `whitelist` Fields whitelist, used in actions related to data creation and update.
- `blacklist` Fields blacklist, used in actions related to data creation and update.

### filter

Data filtering.

```bash
# simple
GET /api/posts?filter[status]=publish
# json string format is recommended, which requires encodeURIComponent encoding
GET /api/posts?filter={"status":"published"}

# filter operators
GET /api/posts?filter[status.$eq]=publish
GET /api/posts?filter={"status.$eq":"published"}

# $and 
GET /api/posts?filter={"$and": [{"status.$eq":"published"}, {"title.$includes":"a"}]}
# $or
GET /api/posts?filter={"$or": [{"status.$eq":"pending"}, {"status.$eq":"draft"}]}

# association field
GET /api/posts?filter[user.email.$includes]=gmail
GET /api/posts?filter={"user.email.$includes":"gmail"}
```

[Click here for more information about filter operators](http-api/filter-operators) 

### filterByTk

Filter by tk field. In the default settings:

- collection resource: tk is the primary key of the data table.
- association resource: tk is the targetKey field of the association.

```bash
GET   /api/posts:get?filterByTk=1&fields=name,title&appends=tags
```

### sort

Sorting. To sort in the descending order, put `-` in front of the field.

```bash
# Sort createAt field in the ascending order
GET /api/posts:get?sort=createdAt
# Sort createAt field in the descending order
GET /api/posts:get?sort=-createdAt
# Sort multiple fields jointly, createAt field descending, title A-Z ascending
GET /api/posts:get?sort=-createdAt,title
```

### fields

Data to output.

```bash
GET   /api/posts:list?fields=name,title

Response 200 (application/json)
{
  "data": [
    {
      "name": "",
      "title": ""
    }
  ],
  "meta": {}
}
```

### appends

Fields of additional relationship.

### except

Exclude some fields (not to output), used in actions related to query.

### whitelist

Whitelist.

```bash
POST  /api/posts:create?whitelist=title

{
  "title": "My first post",
  "date": "2022-05-19"      # The date field will be filtered out and not be written to the database
}
```

### blacklist

Blacklist.

```bash
POST  /api/posts:create?blacklist=date

# The date field will be filtered out and not be written to the database
{
  "title": "My first post"
}
```

## Request Response

Format of the response:

```ts
type ResponseResult = {
  data?: any;               // Main data
  meta?: any;               // Additional Data
  errors?: ResponseError[]; // Errors
};

type ResponseError = {
  code?: string;
  message: string;
};
```

### Example

View list:

```bash
GET /api/posts:list

Response 200 (application/json)

{
  data: [
    {
      id: 1
    }
  ],
  meta: {
    count: 1
    page: 1,
    pageSize: 1,
    totalPage: 1
  },
}
```

View details:

```bash
GET /api/posts:get/1

Response 200 (application/json)

{
  data: {
    id: 1
  }
}
```

Error:

```bash
POST /api/posts:create

Response 400 (application/json)

{
  errors: [
    {
      message: 'name must be required',
    },
  ],
}
```
