# IRepository

`Repository` 接口定义了一系列的模型操作方法，用于适配数据源的增删改查操作。

## API 

### find()

根据查询参数，给出符合条件的模型列表

#### 签名

- `find(options?: any): Promise<IModel[]>`

### findOne()

根据查询参数，给出符合条件的模型，如果有多个符合条件的模型，只返回第一个

#### 签名 

- `findOne(options?: any): Promise<IModel>`


### count()

根据查询参数，给出符合条件的模型数量

#### 签名

- `count(options?: any): Promise<Number>`

### findAndCount()

根据查询参数，给出符合条件的模型列表和数量

#### 签名

- `findAndCount(options?: any): Promise<[IModel[], Number]>`

### create()

创建一个模型数据对象

#### 签名

- `create(options: any): void`

### update()

根据查询条件，更新模型数据对象

#### 签名

- `update(options: any): void`

### destroy()

根据查询条件，删除模型数据对象

#### 签名

- `destroy(options: any): void`
