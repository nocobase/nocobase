# REST API

NocoBase 的 HTTP API 是 REST API 的超集，标准的 CRUD API 也支持 RESTful 风格。

## Collection 资源

---

### 创建 collection

HTTP API

```bash
POST  /api/<collection>:create

{} # JSON body
```

REST API

```bash
POST  /api/<collection>

{} # JSON body
```

### 查看 collection 列表

HTTP API

```bash
GET   /api/<collection>:list
```

REST API

```bash
GET   /api/<collection>
```

### 查看 collection 详情

HTTP API

```bash
GET   /api/<collection>:get?filterByTk=<collectionIndex>
GET   /api/<collection>:get/<collectionIndex>
```

REST API

```bash
GET   /api/<collection>/<collectionIndex>
```

### 更新 collection

HTTP API

```bash
POST   /api/<collection>:update?filterByTk=<collectionIndex>

{} # JSON body

# 或者
POST   /api/<collection>:update/<collectionIndex>

{} # JSON body
```

REST API

```bash
PUT    /api/<collection>/<collectionIndex>

{} # JSON body
```

### 删除 collection

HTTP API

```bash
POST      /api/<collection>:destroy?filterByTk=<collectionIndex>
# 或者
POST      /api/<collection>:destroy/<collectionIndex>
```

REST API

```bash
DELETE    /api/<collection>/<collectionIndex>
```

## Association 资源

---

### 创建 Association

HTTP API

```bash
POST    /api/<collection>/<collectionIndex>/<association>:create

{} # JSON body
```

REST API

```bash
POST    /api/<collection>/<collectionIndex>/<association>

{} # JSON body
```

### 查看 Association 列表

HTTP API

```bash
GET   /api/<collection>/<collectionIndex>/<association>:list
```

REST API

```bash
GET   /api/<collection>/<collectionIndex>/<association>
```

### 查看 Association 详情

HTTP API

```bash
GET   /api/<collection>/<collectionIndex>/<association>:get?filterByTk=<associationIndex>
# 或者
GET   /api/<collection>/<collectionIndex>/<association>:get/<associationIndex>
```

REST API

```bash
GET   /api/<collection>/<collectionIndex>/<association>:get/<associationIndex>
```

### 更新 Association

HTTP API

```bash
POST   /api/<collection>/<collectionIndex>/<association>:update?filterByTk=<associationIndex>

{} # JSON body

# 或者
POST   /api/<collection>/<collectionIndex>/<association>:update/<associationIndex>

{} # JSON body
```

REST API

```bash
PUT    /api/<collection>/<collectionIndex>/<association>:update/<associationIndex>

{} # JSON 数据
```

### 删除 Association

HTTP API

```bash
POST    /api/<collection>/<collectionIndex>/<association>:destroy?filterByTk=<associationIndex>
# 或者
POST    /api/<collection>/<collectionIndex>/<association>:destroy/<associationIndex>
```

REST API

```bash
DELETE  /api/<collection>/<collectionIndex>/<association>/<associationIndex>
```
