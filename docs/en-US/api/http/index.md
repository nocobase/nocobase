# Overview

NocoBase HTTP API is designed based on Resource & Action, it is a superset of REST API. The operation is not limited to add, delete, change, and check, Resource Action can be extended arbitrarily in NocoBase.

## Resource

Resource has two expressions in NocoBase.

- `<collection>`
- `<collection>.<association>`

<Alert>

- collection is the set of all abstract data
- association is the association data for the collection
- resource includes both collection and collection.association

</Alert>

### Example

- `posts` Post
- `posts.user` Post user
- `posts.tags` Post tags

## Action

Representing resource operations as `:<action>`

- `<collection>:<action>`
- `<collection>.<association>:<action>`

Built-in global operations for collection or association

- `create`
- `get`
- `list`
- `update`
- `destroy`
- `move`

Built-in association operation for association only

- `set`
- `add`
- `remove`
- `toggle`

### Example

- `posts:create` Create posts
- `posts.user:get` View posts user
- `posts.tags:add` Attach post tags (associate existing tags with post)

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

## Resource location

- collection resource, locates the data to be processed by `collectionIndex`, `collectionIndex` must be unique
- association resource, locates the data to be processed by `collectionIndex` and `associationIndex` jointly, `associationIndex` may not be unique, but `collectionIndex` and `associationIndex`'s association indexes must be unique

When viewing association resource details, the requested URL needs to provide both `<collectionIndex>` and `<associationIndex>`, `<collectionIndex>` is not redundant because `<associationIndex>` may not be unique.

For example, `tables.fields` indicates the fields of a data table

```bash
GET   /api/tables/table1/fields/title
GET   /api/tables/table2/fields/title
```

Both table1 and table2 have a title field. The title is unique in table1, but other tables may also have a title field

## Request parameters

Request parameters can be placed in the request's headers, parameters (query string), and body (GET requests do not have a body).

A few special request parameters

- `filter` Data filtering, used in query-related operations.
- `filterByTk` filter by tk field, used in operations that specify details of the data.
- `sort` Sorting, used in query-related operations.
- `fields` which data to output, for use in query-related operations.
- `appends` additional relationship fields for use in query-related operations.
- `except` which fields to exclude (no output), used in query-related operations.
- `whitelist` fields whitelist, used in data creation and update related operations.
- `blacklist` fields blacklist, used in data creation and update related operations.

### filter

Data filter

```bash
# simple
GET /api/posts?filter[status]=publish
# Recommend using the json string format, which requires encodeURIComponent encoding
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

Filter by tk field. By default

- collection resource, tk is the primary key of the data table.
- association resource, tk is the targetKey field of the association.

```bash
GET   /api/posts:get?filterByTk=1&fields=name,title&appends=tags
```

### sort

Sorting. When sorting in descending order, the fields are preceded by the minus sign `-`.

```bash
# createAt field in ascending order
GET /api/posts:get?sort=createdAt
# createAt field descending
GET /api/posts:get?sort=-createdAt
# Multiple fields sorted jointly, createAt field descending, title A-Z ascending
GET /api/posts:get?sort=-createdAt,title
```

### fields

Which fields to output

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

Appends a relationship field

### except

Which fields to exclude (not output) for use in query-related operations.

### whitelist

Whitelist

```bash
POST  /api/posts:create?whitelist=title

{
  "title": "My first post",
  "date": "2022-05-19"      # The date field will be filtered out and will not be written to the database
}
```

### blacklist

Blacklist

```bash
POST  /api/posts:create?blacklist=date

{
  "title": "My first post",
  "date": "2022-05-19"      # The date field will be filtered out and will not be written to the database
}
```

## Request Response

Format of the response

```ts
type ResponseResult = {
  data?: any;               // Master data
  meta?: any;               // Additional Data
  errors?: ResponseError[]; // Errors
};

type ResponseError = {
  code?: string;
  message: string;
};
```

### Example

View list

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

View details

```bash
GET /api/posts:get/1

Response 200 (application/json)

{
  data: {
    id: 1
  }
}
```

Error

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
