:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 필터 연산자

Repository의 `find`, `findOne`, `findAndCount`, `count` 등 API의 `filter` 파라미터에서 사용됩니다:

```ts
const repository = db.getRepository('books');

repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

JSON 직렬화를 지원하기 위해 NocoBase에서는 쿼리 연산자를 `$` 접두사가 붙은 문자열로 식별합니다.

또한, NocoBase는 연산자를 확장할 수 있는 API를 제공합니다. 자세한 내용은 [`db.registerOperators()`](../database#registeroperators)를 참조해 주세요.

## 일반 연산자

### `$eq`

필드 값이 지정된 값과 같은지 확인합니다. SQL의 `=`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $eq: '春秋',
    },
  },
});
```

`title: '春秋'`와 동일합니다.

### `$ne`

필드 값이 지정된 값과 같지 않은지 확인합니다. SQL의 `!=`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $ne: '春秋',
    },
  },
});
```

### `$is`

필드 값이 지정된 값인지 확인합니다. SQL의 `IS`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $is: null,
    },
  },
});
```

### `$not`

필드 값이 지정된 값이 아닌지 확인합니다. SQL의 `IS NOT`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $not: null,
    },
  },
});
```

### `$col`

필드 값이 다른 필드의 값과 같은지 확인합니다. SQL의 `=`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $col: 'name',
    },
  },
});
```

### `$in`

필드 값이 지정된 배열에 포함되는지 확인합니다. SQL의 `IN`과 같습니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $in: ['春秋', '战国'],
    },
  },
});
```

### `$notIn`

필드 값이 지정된 배열에 포함되지 않는지 확인합니다. SQL의 `NOT IN`과 같습니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $notIn: ['春秋', '战国'],
    },
  },
});
```

### `$empty`

일반 필드가 비어 있는지 확인합니다. 문자열 필드의 경우 빈 문자열인지, 배열 필드의 경우 빈 배열인지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $empty: true,
    },
  },
});
```

### `$notEmpty`

일반 필드가 비어 있지 않은지 확인합니다. 문자열 필드의 경우 빈 문자열이 아닌지, 배열 필드의 경우 빈 배열이 아닌지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $notEmpty: true,
    },
  },
});
```

## 논리 연산자

### `$and`

논리 AND 연산입니다. SQL의 `AND`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    $and: [{ title: '诗经' }, { isbn: '1234567890' }],
  },
});
```

### `$or`

논리 OR 연산입니다. SQL의 `OR`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    $or: [{ title: '诗经' }, { publishedAt: { $lt: '0000-00-00T00:00:00Z' } }],
  },
});
```

## 불리언 타입 필드 연산자

불리언 타입 필드 (`type: 'boolean'`)에 사용됩니다.

### `$isFalsy`

불리언 타입 필드 값이 거짓(falsy)인지 확인합니다. 필드 값이 `false`, `0`, `NULL`인 경우 모두 `$isFalsy: true`로 판단됩니다.

**예시**

```ts
repository.find({
  filter: {
    isPublished: {
      $isFalsy: true,
    },
  },
});
```

### `$isTruly`

불리언 타입 필드 값이 참(truly)인지 확인합니다. 필드 값이 `true`와 `1`인 경우 모두 `$isTruly: true`로 판단됩니다.

**예시**

```ts
repository.find({
  filter: {
    isPublished: {
      $isTruly: true,
    },
  },
});
```

## 숫자 타입 필드 연산자

다음과 같은 숫자 타입 필드에 사용됩니다:

- `type: 'integer'`
- `type: 'float'`
- `type: 'double'`
- `type: 'real'`
- `type: 'decimal'`

### `$gt`

필드 값이 지정된 값보다 큰지 확인합니다. SQL의 `>`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    price: {
      $gt: 100,
    },
  },
});
```

### `$gte`

필드 값이 지정된 값보다 크거나 같은지 확인합니다. SQL의 `>=`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    price: {
      $gte: 100,
    },
  },
});
```

### `$lt`

필드 값이 지정된 값보다 작은지 확인합니다. SQL의 `<`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    price: {
      $lt: 100,
    },
  },
});
```

### `$lte`

필드 값이 지정된 값보다 작거나 같은지 확인합니다. SQL의 `<=`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    price: {
      $lte: 100,
    },
  },
});
```

### `$between`

필드 값이 지정된 두 값 사이에 있는지 확인합니다. SQL의 `BETWEEN`과 같습니다.

**예시**

```ts
repository.find({
  filter: {
    price: {
      $between: [100, 200],
    },
  },
});
```

### `$notBetween`

필드 값이 지정된 두 값 사이에 없는지 확인합니다. SQL의 `NOT BETWEEN`과 같습니다.

**예시**

```ts
repository.find({
  filter: {
    price: {
      $notBetween: [100, 200],
    },
  },
});
```

## 문자열 타입 필드 연산자

문자열 타입 필드 (`string`)에 사용됩니다.

### `$includes`

문자열 필드에 지정된 부분 문자열이 포함되어 있는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $includes: '三字经',
    },
  },
});
```

### `$notIncludes`

문자열 필드에 지정된 부분 문자열이 포함되어 있지 않은지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $notIncludes: '三字经',
    },
  },
});
```

### `$startsWith`

문자열 필드가 지정된 부분 문자열로 시작하는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $startsWith: '三字经',
    },
  },
});
```

### `$notStatsWith`

문자열 필드가 지정된 부분 문자열로 시작하지 않는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $notStatsWith: '三字经',
    },
  },
});
```

### `$endsWith`

문자열 필드가 지정된 부분 문자열로 끝나는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $endsWith: '三字经',
    },
  },
});
```

### `$notEndsWith`

문자열 필드가 지정된 부분 문자열로 끝나지 않는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $notEndsWith: '三字经',
    },
  },
});
```

### `$like`

필드 값에 지정된 문자열이 포함되어 있는지 확인합니다. SQL의 `LIKE`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $like: '计算机',
    },
  },
});
```

### `$notLike`

필드 값에 지정된 문자열이 포함되어 있지 않은지 확인합니다. SQL의 `NOT LIKE`와 같습니다.

**예시**

```ts
repository.find({
  filter: {
    title: {
      $notLike: '计算机',
    },
  },
});
```

### `$iLike`

필드 값에 지정된 문자열이 대소문자를 구분하지 않고 포함되어 있는지 확인합니다. SQL의 `ILIKE`와 같습니다(PostgreSQL에만 해당).

**예시**

```ts
repository.find({
  filter: {
    title: {
      $iLike: 'Computer',
    },
  },
});
```

### `$notILike`

필드 값에 지정된 문자열이 대소문자를 구분하지 않고 포함되어 있지 않은지 확인합니다. SQL의 `NOT ILIKE`와 같습니다(PostgreSQL에만 해당).

**예시**

```ts
repository.find({
  filter: {
    title: {
      $notILike: 'Computer',
    },
  },
});
```

### `$regexp`

필드 값이 지정된 정규 표현식과 일치하는지 확인합니다. SQL의 `REGEXP`와 같습니다(PostgreSQL에만 해당).

**예시**

```ts
repository.find({
  filter: {
    title: {
      $regexp: '^计算机',
    },
  },
});
```

### `$notRegexp`

필드 값이 지정된 정규 표현식과 일치하지 않는지 확인합니다. SQL의 `NOT REGEXP`와 같습니다(PostgreSQL에만 해당).

**예시**

```ts
repository.find({
  filter: {
    title: {
      $notRegexp: '^计算机',
    },
  },
});
```

### `$iRegexp`

필드 값이 지정된 정규 표현식과 대소문자를 구분하지 않고 일치하는지 확인합니다. SQL의 `~*`와 같습니다(PostgreSQL에만 해당).

**예시**

```ts
repository.find({
  filter: {
    title: {
      $iRegexp: '^COMPUTER',
    },
  },
});
```

### `$notIRegexp`

필드 값이 지정된 정규 표현식과 대소문자를 구분하지 않고 일치하지 않는지 확인합니다. SQL의 `!~*`와 같습니다(PostgreSQL에만 해당).

**예시**

```ts
repository.find({
  filter: {
    title: {
      $notIRegexp: '^COMPUTER',
    },
  },
});
```

## 날짜 타입 필드 연산자

날짜 타입 필드 (`type: 'date'`)에 사용됩니다.

### `$dateOn`

날짜 필드가 특정 날짜에 해당하는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateOn: '2021-01-01',
    },
  },
});
```

### `$dateNotOn`

날짜 필드가 특정 날짜에 해당하지 않는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotOn: '2021-01-01',
    },
  },
});
```

### `$dateBefore`

날짜 필드가 특정 값 이전인지 확인합니다. 전달된 날짜 값보다 작은 것과 같습니다.

**예시**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateBefore: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

### `$dateNotBefore`

날짜 필드가 특정 값 이전이 아닌지 확인합니다. 전달된 날짜 값보다 크거나 같은 것과 같습니다.

**예시**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotBefore: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

### `$dateAfter`

날짜 필드가 특정 값 이후인지 확인합니다. 전달된 날짜 값보다 큰 것과 같습니다.

**예시**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

### `$dateNotAfter`

날짜 필드가 특정 값 이후가 아닌지 확인합니다. 전달된 날짜 값보다 작거나 같은 것과 같습니다.

**예시**

```ts
repository.find({
  filter: {
    createdAt: {
      $dateNotAfter: '2021-01-01T00:00:00.000Z',
    },
  },
});
```

## 배열 타입 필드 연산자

배열 타입 필드 (`type: 'array'`)에 사용됩니다.

### `$match`

배열 필드의 값이 지정된 배열의 값과 일치하는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    tags: {
      $match: ['文学', '历史'],
    },
  },
});
```

### `$notMatch`

배열 필드의 값이 지정된 배열의 값과 일치하지 않는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    tags: {
      $notMatch: ['文学', '历史'],
    },
  },
});
```

### `$anyOf`

배열 필드의 값이 지정된 배열의 값 중 하나라도 포함하는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    tags: {
      $anyOf: ['文学', '历史'],
    },
  },
});
```

### `$noneOf`

배열 필드의 값이 지정된 배열의 값 중 어느 것도 포함하지 않는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    tags: {
      $noneOf: ['文学', '历史'],
    },
  },
});
```

### `$arrayEmpty`

배열 필드가 비어 있는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    tags: {
      $arrayEmpty: true,
    },
  },
});
```

### `$arrayNotEmpty`

배열 필드가 비어 있지 않은지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    tags: {
      $arrayNotEmpty: true,
    },
  },
});
```

## 관계 필드 타입 연산자

관계의 존재 여부를 확인하는 데 사용되며, 필드 타입은 다음과 같습니다:

- `type: 'hasOne'`
- `type: 'hasMany'`
- `type: 'belongsTo'`
- `type: 'belongsToMany'`

### `$exists`

관계 데이터가 존재하는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    author: {
      $exists: true,
    },
  },
});
```

### `$notExists`

관계 데이터가 존재하지 않는지 확인합니다.

**예시**

```ts
repository.find({
  filter: {
    author: {
      $notExists: true,
    },
  },
});
```