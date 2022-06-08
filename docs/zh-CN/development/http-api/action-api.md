# Action API

## Common

---

Collection 和 Association 资源通用。

### `create`

```bash
POST  /api/users:create?whitelist=a,b&blacklist=c,d

{} # Request Body
```

- Parameters
  - whitelist 白名单
  - blacklist 黑名单
- Request body: 待插入的 JSON 数据
- Response body data: 已创建的数据 JSON

#### 新增用户

```bash
POST  /api/users:create

Request Body
{
  "email": "demo@nocobase.com",
  "name": "Admin"
}

Response 200 (application/json)
{
  "data": {},
}
```

#### 新增用户文章

```bash
POST  /api/users/1/posts:create

Request Body
{
  "title": "My first post"
}

Response 200 (application/json)
{
  "data": {}
}
```

#### Request Body 里的 association

```bash
POST  /api/posts:create

Request Body
{
  "title": "My first post",
  "user": 1
}

Response 200 (application/json)
{
  "data": {
    "id": 1,
    "title": "My first post",
    "userId": 1,
    "user": {
      "id": 1
    }
  }
}
```

### `update`

```bash
POST  /api/users:create?filterByTk=1&whitelist=a,b&blacklist=c,d

{} # Request Body
```

- Parameters
  - whitelist 白名单
  - blacklist 黑名单
  - filterByTk 根据 tk 字段过滤，默认情况 tk 为数据表的主键
  - filter 过滤，支持 json string
- Request body: 待更新的 JSON 数据

#### Request Body 里的 association

```bash
POST  /api/posts:update/1

Request Body
{
  "title": "My first post 2",
  "user": 2
}

Response 200 (application/json)
{
  "data": [
    {
      "id": 1,
      "title": "My first post 2",
      "userId": 2,
      "user": {
        "id": 2
      }
    }
  ]
}
```

### `list`

### `get`

### `destroy`

### `move`

## Association

---

### `add`

### `set`

### `remove`

### `toggle`
