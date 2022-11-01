# Action API

## Common

---

Collection and Association resources are common.

### `create`

```bash
POST  /api/users:create?whitelist=a,b&blacklist=c,d

{} # Request Body
```

- Parameters
  - whitelist White list
  - blacklist Black list
- Request body: JSON data to be inserted
- Response body data: Created data JSON

#### Add a User

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

#### Add a user's article

```bash
POST  /api/users/1/posts:create

Request Body
{
  "title": "My first post"
}

Response 200 (application/json)
{
  "data": {},
}
```

#### Association in Request Body

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
  - whitelist White list
  - blacklist Black list
  - filterByTk Filter by tk field, by default tk is the primary key of the data table
  - filter Filter，support json string
- Request body: JSON data to be updated

#### Association in Request Body

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



