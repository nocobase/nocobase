:::tip
이 문서는 AI로 번역되었습니다. 부정확한 내용이 있을 경우 [영어 버전](/en)을 참조하세요
:::

# IRepository

`Repository` 인터페이스는 데이터 소스의 CRUD(생성, 읽기, 업데이트, 삭제) 작업을 처리하기 위한 다양한 모델 조작 메서드를 정의합니다.

## API

### find()

쿼리 파라미터를 사용하여 조건에 맞는 모델 목록을 반환합니다.

#### 시그니처

- `find(options?: any): Promise<IModel[]>`

### findOne()

쿼리 파라미터를 사용하여 조건에 맞는 모델을 반환합니다. 조건에 맞는 모델이 여러 개일 경우, 첫 번째 모델만 반환합니다.

#### 시그니처

- `findOne(options?: any): Promise<IModel>`

### count()

쿼리 파라미터를 사용하여 조건에 맞는 모델의 개수를 반환합니다.

#### 시그니처

- `count(options?: any): Promise<Number>`

### findAndCount()

쿼리 파라미터를 사용하여 조건에 맞는 모델 목록과 해당 개수를 반환합니다.

#### 시그니처

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

모델 데이터 객체를 생성합니다.

#### 시그니처

- `create(options: any): void`

### update()

쿼리 조건을 사용하여 모델 데이터 객체를 업데이트합니다.

#### 시그니처

- `update(options: any): void`

### destroy()

쿼리 조건을 사용하여 모델 데이터 객체를 삭제합니다.

#### 시그니처

- `destroy(options: any): void`