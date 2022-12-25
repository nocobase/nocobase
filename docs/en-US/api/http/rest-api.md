# REST API

HTTP API of NocoBase is a superset of REST API, and the standard CRUD API also supports the RESTful style.

## Collection Resources

### Create Collection

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

### View Collection List

HTTP API

```bash
GET   /api/<collection>:list
```

REST API

```bash
GET   /api/<collection>
```

### View Collection Details

HTTP API

```bash
GET   /api/<collection>:get?filterByTk=<collectionIndex>
GET   /api/<collection>:get/<collectionIndex>
```

REST API

```bash
GET   /api/<collection>/<collectionIndex>
```

### Update Collection

HTTP API

```bash
POST   /api/<collection>:update?filterByTk=<collectionIndex>

{} # JSON body

# Or
POST   /api/<collection>:update/<collectionIndex>

{} # JSON body
```

REST API

```bash
PUT    /api/<collection>/<collectionIndex>

{} # JSON body
```

### Delete Collection

HTTP API

```bash
POST      /api/<collection>:destroy?filterByTk=<collectionIndex>
# Or
POST      /api/<collection>:destroy/<collectionIndex>
```

REST API

```bash
DELETE    /api/<collection>/<collectionIndex>
```

## Association Resources

### Create Association

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

### View Association List

HTTP API

```bash
GET   /api/<collection>/<collectionIndex>/<association>:list
```

REST API

```bash
GET   /api/<collection>/<collectionIndex>/<association>
```

### View Association Details

HTTP API

```bash
GET   /api/<collection>/<collectionIndex>/<association>:get?filterByTk=<associationIndex>
# Or
GET   /api/<collection>/<collectionIndex>/<association>:get/<associationIndex>
```

REST API

```bash
GET   /api/<collection>/<collectionIndex>/<association>:get/<associationIndex>
```

### Update Association

HTTP API

```bash
POST   /api/<collection>/<collectionIndex>/<association>:update?filterByTk=<associationIndex>

{} # JSON body

# Or
POST   /api/<collection>/<collectionIndex>/<association>:update/<associationIndex>

{} # JSON body
```

REST API

```bash
PUT    /api/<collection>/<collectionIndex>/<association>:update/<associationIndex>

{} # JSON 
```

### Delete Association

HTTP API

```bash
POST    /api/<collection>/<collectionIndex>/<association>:destroy?filterByTk=<associationIndex>
# Or
POST    /api/<collection>/<collectionIndex>/<association>:destroy/<associationIndex>
```

REST API

```bash
DELETE  /api/<collection>/<collectionIndex>/<association>/<associationIndex>
```
