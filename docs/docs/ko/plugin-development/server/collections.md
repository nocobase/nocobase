:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# 컬렉션 (데이터 테이블)

NocoBase 플러그인 개발에서 **컬렉션(데이터 테이블)**은 가장 핵심적인 개념 중 하나입니다. 컬렉션을 정의하거나 확장하여 플러그인에서 데이터 테이블 구조를 추가하거나 수정할 수 있습니다. 데이터 소스 관리 인터페이스를 통해 생성된 데이터 테이블과 달리, **코드로 정의된 컬렉션은 일반적으로 시스템 수준의 메타데이터 테이블**이며, 데이터 소스 관리 목록에는 나타나지 않습니다.

## 데이터 테이블 정의하기

약속된 디렉터리 구조에 따라 컬렉션 파일은 `./src/server/collections` 디렉터리에 위치해야 합니다. 새 테이블을 생성할 때는 `defineCollection()`을 사용하고, 기존 테이블을 확장할 때는 `extendCollection()`을 사용합니다.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: '示例文章',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: '제목', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: '본문' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: '작성자' },
    },
  ],
});
```

위 예시에서:

- `name`: 테이블 이름 (데이터베이스에 동일한 이름의 테이블이 자동으로 생성됩니다.)
- `title`: 인터페이스에서 이 테이블의 표시 이름입니다.
- `fields`: 필드 컬렉션으로, 각 필드는 `type`, `name` 등의 속성을 포함합니다.

다른 플러그인의 컬렉션에 필드를 추가하거나 설정을 수정해야 할 때 `extendCollection()`을 사용할 수 있습니다.

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

플러그인을 활성화하면 시스템은 `isPublished` 필드를 기존 `articles` 테이블에 자동으로 추가합니다.

:::tip
약속된 디렉터리는 모든 플러그인의 `load()` 메서드가 실행되기 전에 로드를 완료하여, 일부 데이터 테이블이 로드되지 않아 발생하는 의존성 문제를 방지합니다.
:::

## 데이터베이스 구조 동기화

플러그인이 최초 활성화될 때 시스템은 컬렉션 설정과 데이터베이스 구조를 자동으로 동기화합니다. 플러그인이 이미 설치되어 실행 중인 경우, 컬렉션을 추가하거나 수정한 후에는 수동으로 업그레이드 명령을 실행해야 합니다.

```bash
yarn nocobase upgrade
```

동기화 과정에서 예외 또는 불량 데이터(dirty data)가 발생하면 애플리케이션을 재설치하여 테이블 구조를 재구축할 수 있습니다.

```bash
yarn nocobase install -f
```

## 리소스(Resource) 자동 생성

컬렉션을 정의하면 시스템은 해당 리소스(Resource)를 자동으로 생성하며, API를 통해 해당 리소스에 대해 직접 CRUD(생성, 읽기, 업데이트, 삭제) 작업을 수행할 수 있습니다. 자세한 내용은 [리소스 관리](./resource-manager.md)를 참조하십시오.