---
order: 4
---

# How to Choose an ORM

本篇文章，需要读者至少熟悉一种较流行的 ORM，对 Model、Migration、QueryBuilder、Repository 也有所了解。在正式介绍 NocoBase 的 Database 设计之前，先来看看大部分 ORM 都有的三个概念：

- Model（ModelAttributes）、Entity（EntitySchema）：将数据表与模型类或实体类对应起来
- Migration、Sync API：用于创建、修改、删除数据库表、字段、索引等
- QueryBuilder、EntityManager、Repository、CRUD API：提供增删改查



## Model/Entity
无代码的第一个改造，**Model 动态化**。
​

简单来说 Model/Entity 的作用就是将数据表、字段、索引、关系映射到类、属性或方法上。我们先来看看 Node.js 里各个 ORM 都是怎么做的。
### Typeorm
在 Typeorm 里叫 Entity，通过类属性映射表字段，装饰器风格来配置字段属性
```typescript
import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 100
    })
    name: string;

    @Column("text")
    description: string;

    @Column()
    filename: string;

    @Column("double")
    views: number;

    @Column()
    isPublished: boolean;
}
```
这种写法，如果 Entity 有修改，需要修改代码，不过 Typeorm 提供了 JSON 风格的 EntitySchema
```typescript
import {EntitySchema} from "typeorm";

export const CategoryEntity = new EntitySchema({
    name: "category",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true
        },
        name: {
            type: String
        }
    }
});

export const PostEntity = new EntitySchema({
    name: "post",
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true
        },
        title: {
            type: String
        },
        text: {
            type: String
        }
    },
    relations: {
        categories: {
            type: "many-to-many",
            target: "category" // CategoryEntity
        }
    }
});
```
修改 JSON 就容易多了，这种写法非常适用于无代码平台。平台配置 JSON 动态生成对应的 Entity。 
### Prisma
与 Typeorm 装饰器的风格非常接近，但不同的是 Prisma 另辟蹊径，提供了自成一套的 PSL（Prisma Schema Language）：
```ts
datasource db {
  url      = env("DATABASE_URL")
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  posts     Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  published Boolean  @default(false)
  title     String   @db.VarChar(255)
  author    User?    @relation(fields: [authorId], references: [id])
  authorId  Int?
}

enum Role {
  USER
  ADMIN
}
```
这种写法，需要修改 PSL 文件，除非自己实现一套 PSL 解析与生成器，不然没办法直接无代码改造。
### Sequelize
作为老牌 ORM，下载量和使用量也是惊人，提供了多种配置 Model 的风格：

1. 传统的 JSON 风格
```ts
sequelize.define('User', {
  // Model attributes are defined here
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING
    // allowNull defaults to true
  }
}, {
  // model options
});
```

2. 改进之后的 Model 风格
```ts
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = new Sequelize('sqlite::memory');

class User extends Model {}

User.init({
  // Model attributes are defined here
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING
    // allowNull defaults to true
  }
}, {
  // Other model options go here
  sequelize, // We need to pass the connection instance
  modelName: 'User' // We need to choose the model name
});

// the defined model is the class itself
console.log(User === sequelize.models.User); // true
```

3. 装饰器风格
```ts
import { Table, Column, Model, HasMany } from 'sequelize-typescript'

@Table
class Person extends Model {
  @Column
  name: string

  @Column
  birthday: Date

  @HasMany(() => Hobby)
  hobbies: Hobby[]
}
```
Sequelize 可以使用 JSON 风格配置 Model，非常适用于无代码平台。平台配置 JSON 动态生成对应的 Model。 
### Objection.js
基于 Knex，Model 如下：
```typescript
const { Model } = require('objection');

class Person extends Model {
  // Table name is the only required property.
  static get tableName() {
    return 'persons';
  }

  // Each model must have a column (or a set of columns) that uniquely
  // identifies the rows. The column(s) can be specified using the `idColumn`
  // property. `idColumn` returns `id` by default and doesn't need to be
  // specified unless the model's primary key is something else.
  static get idColumn() {
    return 'id';
  }

  // Methods can be defined for model classes just as you would for
  // any JavaScript class. If you want to include the result of these
  // methods in the output json, see `virtualAttributes`.
  fullName() {
    return this.firstName + ' ' + this.lastName;
  }

  // Optional JSON schema. This is not the database schema!
  // No tables or columns are generated based on this. This is only
  // used for input validation. Whenever a model instance is created
  // either explicitly or implicitly it is checked against this schema.
  // See http://json-schema.org/ for more info.
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['firstName', 'lastName'],

      properties: {
        id: { type: 'integer' },
        parentId: { type: ['integer', 'null'] },
        firstName: { type: 'string', minLength: 1, maxLength: 255 },
        lastName: { type: 'string', minLength: 1, maxLength: 255 },
        age: { type: 'number' },

        // Properties defined as objects or arrays are
        // automatically converted to JSON strings when
        // writing to database and back to objects and arrays
        // when reading from database. To override this
        // behaviour, you can override the
        // Model.jsonAttributes property.
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            city: { type: 'string' },
            zipCode: { type: 'string' }
          }
        }
      }
    };
  }

  // This object defines the relations to other models.
  static get relationMappings() {
    // Importing models here is a one way to avoid require loops.
    const Animal = require('./Animal');
    const Movie = require('./Movie');

    return {
      pets: {
        relation: Model.HasManyRelation,
        // The related model. This can be either a Model
        // subclass constructor or an absolute file path
        // to a module that exports one. We use a model
        // subclass constructor `Animal` here.
        modelClass: Animal,
        join: {
          from: 'persons.id',
          to: 'animals.ownerId'
        }
      },

      movies: {
        relation: Model.ManyToManyRelation,
        modelClass: Movie,
        join: {
          from: 'persons.id',
          // ManyToMany relation needs the `through` object
          // to describe the join table.
          through: {
            // If you have a model class for the join table
            // you need to specify it like this:
            // modelClass: PersonMovie,
            from: 'persons_movies.personId',
            to: 'persons_movies.movieId'
          },
          to: 'movies.id'
        }
      },

      children: {
        relation: Model.HasManyRelation,
        modelClass: Person,
        join: {
          from: 'persons.id',
          to: 'persons.parentId'
        }
      },

      parent: {
        relation: Model.BelongsToOneRelation,
        modelClass: Person,
        join: {
          from: 'persons.parentId',
          to: 'persons.id'
        }
      }
    };
  }
}
```
直观感受，并没有 Typeorm、Prisma、Sequelize 精炼。不过 Objection.js 提供了 mixin，也可以将 Model 进一步抽象，代码就精炼多了，也可以支持装饰器风格，比如这样：
```ts
const { compose, Model } = require('objection');

const mixins = compose(
  SomeMixin,
  SomeOtherMixin,
  EvenMoreMixins,
  LolSoManyMixins,
  ImAMixinWithOptions({ foo: 'bar' })
);

class Person extends mixins(Model) {}

@SomeMixin
@MixinWithOptions({ foo: 'bar' })
class Person extends Model {}
```
从构思上来说，可改造空间大，也可以巧妙的将各种配置 JSON 化，从而达到动态生成的 Model 目的。
### Bookshelf.js
基于 Knex，也是类 JSON 的配置风格，一些非常流行的开源项目 Ghost、Strapi 就用的它。
```typescript
const knex = require('knex')({
  client: 'mysql',
  connection: process.env.MYSQL_DATABASE_CONNECTION
})
const bookshelf = require('bookshelf')(knex)

const User = bookshelf.model('User', {
  tableName: 'users',
  posts() {
    return this.hasMany(Posts)
  }
})

const Post = bookshelf.model('Post', {
  tableName: 'posts',
  tags() {
    return this.belongsToMany(Tag)
  }
})

const Tag = bookshelf.model('Tag', {
  tableName: 'tags'
})

```
同样支持动态化改造。Bookshelf 的可改造空间巨大，不过看似作者已经不再维护了。
### 总结
到底哪个好呢？**仅从动态化 Model/Entity 角度来说：**

- Sequelize 细节做的最好
- Typeorm 非常活跃，才迭代了 v0.2.38，但 stars 就已经超 25k+ 以上所有 ORM 关注度最多，装饰器的风格也被大家所喜爱。但是 EntitySchema 的细节做的还不够，需要进一步优化和改造，存在许多未知
- Objection.js 的构思非常不错，尤其是 mixin，灵活性和可改造性非常强
- Bookshelf.js 也不错，如果是早几年，Bookshelf 可能会是我的第一选择
- 至于 Prisma，特立独行的 PSL，深受大家喜爱，但是 PSL 并不支持动态化 Model

​

以上 ORM 都是以关系型数据库为主，不过 Typeorm 和 Prisma 也支持 MongoDB（细节有差异），只支持 MongoDB 的 ORM 不在讨论范围内。
​

## Migration


有了 Model/Entity 之后，需要创建对应的数据库表、字段和索引。上文提及的大多数 Model/Entity 都可以详细的描述字段的属性和关系（Model 的 DSL），理论上就可以直接生成表和关系约束了，而并不需要单独再配置 migration 文件了。比如：
### Sequelize
提供了 `sequelize.sync()` 和 `Model.sync()` 方法，可以快速的根据 Model Attributes 生成数据表、字段和索引。sync 提供了丰富的参数，支持删掉重建、只新增不删除、只同步某些表等等处理。
```typescript
const User = sequelize.define('User', {
  // Model attributes are defined here
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING
    // allowNull defaults to true
  }
}, {
  // Other model options go here
});

await sequelize.sync();
// Or
await User.sync();
```
除了 sync，Sequelize 也提供了 migration 工具，具体写法如：
```typescript
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Person', {
      name: Sequelize.DataTypes.STRING,
      isBetaMember: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Person');
  }
};
```
在生产环境或者希望精确控制时，都可以通过 Sequelize 提供的 queryInterface 来处理。
### Typeorm
没有给力的 sequelize.sync() 方法，但是提供了 synchronize: true 配置参数，效果类似，会自动创建表，因为会重新建表，并不适用于生产环境。生产环境建议使用更为安全的 migration 方式。
```typescript
createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    entities: [
        Photo
    ],
    synchronize: true,
    logging: false
});
```
Migration 如下，具体的 QueryRunner 细节大家可以看官网，提供了一套标准的 Migration API
```typescript
import {MigrationInterface, QueryRunner, Table, TableIndex, TableColumn, TableForeignKey } from "typeorm";

export class QuestionRefactoringTIMESTAMP implements MigrationInterface {

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "question",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true
                },
                {
                    name: "name",
                    type: "varchar",
                }
            ]
        }), true)

        await queryRunner.createIndex("question", new TableIndex({
            name: "IDX_QUESTION_NAME",
            columnNames: ["name"]
        }));

        await queryRunner.createTable(new Table({
            name: "answer",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true
                },
                {
                    name: "name",
                    type: "varchar",
                },
                {
                  name: 'created_at',
                  type: 'timestamp',
                  default: 'now()'
                }
            ]
        }), true);

        await queryRunner.addColumn("answer", new TableColumn({
            name: "questionId",
            type: "int"
        }));

        await queryRunner.createForeignKey("answer", new TableForeignKey({
            columnNames: ["questionId"],
            referencedColumnNames: ["id"],
            referencedTableName: "question",
            onDelete: "CASCADE"
        }));
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("answer");
        const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("questionId") !== -1);
        await queryRunner.dropForeignKey("answer", foreignKey);
        await queryRunner.dropColumn("answer", "questionId");
        await queryRunner.dropTable("answer");
        await queryRunner.dropIndex("question", "IDX_QUESTION_NAME");
        await queryRunner.dropTable("question");
    }

}
```
### Knex
Objection.js 和 Bookshelf 都基于 Knex，所以 Migration 都使用的 Knex。
```typescript
knex.schema.createTable('users', function (table) {
  table.increments();
  table.string('name');
  table.timestamps();
})
// Outputs:
// create table `users` (`id` int unsigned not null auto_increment primary key, `name` varchar(255), `created_at` datetime, `updated_at` datetime)
```
Knex 和 Laravel 的 QueryBuilder 非常接近，Schema Builder 也如此。单纯从 Migration API 设计来说，个人更喜欢这种语法风格，干净、简洁。
### Prisma
Migration 的思路与上述的做法不同，Prisma 提供了完整的配置 Model 的 PSL 语法，为开发环境提供了 migrate dev 支持，每次修改 PSL 文件之后，可以执行 migrate dev 生成对应变更的 sql 文件，生产环境再执行 migrate 命令来同步修改，详情查看官方文档 [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate) 章节 
```bash
migrations/
└─ 20210305110829_first_migration/
  └─ migration.sql
└─ 20210305120829_add_fields/
  └─ migration.sql
└─ 20210308102042_type-change/
  └─ migration.sql
```
### 总结

- 流程上，Prisma 的做法最省事儿，只配置一份 PSL，每次修改之后，通过 migrate dev 命令生成 sql，无需修改。
- 其次是 Sequelize，提供了 sequelize.sync 方法，配置的 Model 都可以通过 sync 方法同步给数据库。但是这种方式有些暴力和冗余，如果能稍加改进就更好了。
- 至于传统的 Migration 做法，配置 Model 已经写了一份 DSL 了，配置 Migration 再写另外一份 DSL，非常不友好，无代码改造也非常困难。



**怎么无代码改造来解决 Migration 问题呢？**
Sequelize 的方案非常不错，虽然有些暴力和冗余，但是可以再稍加改进，尤其是需要达到生产环境的精准控制。
​

**sequelize.sync 是否会有安全问题呢？**
因为 sync 支持 force: true 参数，会强制删除重建，在生产环境要关掉。
修改了 Model 的 DSL，在 sync 里怎么判断是创建、修改或删除呢？篇幅有限这里就不细说了。


## QueryBuilder、EntityManager、Repository、CRUD API


有了 Model/Entity，也创建数据表和字段了，那接下来就能操控数据库了。Model/Entity 常见有两种模式 Active Record 和 Data Mapper，Typeorm 支持的最完整，所以我们先来看看 Typeorm 吧。
### Typeorm

1. Active Record 模式
```typescript
import {BaseEntity, Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    isActive: boolean;

    static findByName(firstName: string, lastName: string) {
        return this.createQueryBuilder("user")
            .where("user.firstName = :firstName", { firstName })
            .andWhere("user.lastName = :lastName", { lastName })
            .getMany();
    }
}

// example how to save AR entity
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.isActive = true;
await user.save();

// example how to remove AR entity
await user.remove();

// example how to load AR entities
const users = await User.find({ skip: 2, take: 5 });
const newUsers = await User.find({ isActive: true });
const timber = await User.findOne({ firstName: "Timber", lastName: "Saw" });
const timber = await User.findByName("Timber", "Saw");
```

2. Data Mapper 模式
```typescript
import {Entity, EntityRepository, Repository, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    isActive: boolean;

}

// custom repository
@EntityRepository()
export class UserRepository extends Repository<User> {

    findByName(firstName: string, lastName: string) {
        return this.createQueryBuilder("user")
            .where("user.firstName = :firstName", { firstName })
            .andWhere("user.lastName = :lastName", { lastName })
            .getMany();
    }

}

const userRepository = connection.getRepository(User);

// example how to save DM entity
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.isActive = true;
await userRepository.save(user);

// example how to remove DM entity
await userRepository.remove(user);

// example how to load DM entities
const users = await userRepository.find({ skip: 2, take: 5 });
const newUsers = await userRepository.find({ isActive: true });
const timber = await userRepository.findOne({ firstName: "Timber", lastName: "Saw" });

// custom repository
const userRepository = connection.getCustomRepository(UserRepository);
const timber = await userRepository.findByName("Timber", "Saw");
```
从无代码、低代码改造角度来说，Data Mapper 模式更适合，通过 EntitySchema 生成 Entity，再交给 EntityManager 或 Repository 来处理数据的增删改查，也可以根据需要自定义 Repository。这就是低代码的扩展能力，通用的 Repository 处理常规需求，特殊需求自定义扩展。除了常用的 CRUD API，Typeorm 也提供了强大的 QueryBuilder 来自定义其他 API，如上文例子的 findByName。
### Sequelize
Sequelize 的 Model 是 Active Record 模式，提供了常用的 CRUD API，如：
```ts
const jane = await User.create({ name: "Jane" });
console.log(jane.name); // "Jane"
jane.name = "Ada";
// the name is still "Jane" in the database
await jane.save();
// Now the name was updated to "Ada" in the database!

Model.findAll({
  attributes: ['foo', 'bar']
});
// SELECT foo, bar FROM ...

Post.findAll({
  where: {
    authorId: 2
  }
});
// SELECT * FROM post WHERE authorId = 2

const { Op } = require("sequelize");
Post.findAll({
  where: {
    [Op.and]: [{ a: 5 }, { b: 6 }],            // (a = 5) AND (b = 6)
    [Op.or]: [{ a: 5 }, { b: 6 }],             // (a = 5) OR (b = 6)
    someAttribute: {
      // Basics
      [Op.eq]: 3,                              // = 3
      [Op.ne]: 20,                             // != 20
      [Op.is]: null,                           // IS NULL
      [Op.not]: true,                          // IS NOT TRUE
      [Op.or]: [5, 6],                         // (someAttribute = 5) OR (someAttribute = 6)

      // Using dialect specific column identifiers (PG in the following example):
      [Op.col]: 'user.organization_id',        // = "user"."organization_id"

      // Number comparisons
      [Op.gt]: 6,                              // > 6
      [Op.gte]: 6,                             // >= 6
      [Op.lt]: 10,                             // < 10
      [Op.lte]: 10,                            // <= 10
      [Op.between]: [6, 10],                   // BETWEEN 6 AND 10
      [Op.notBetween]: [11, 15],               // NOT BETWEEN 11 AND 15

      // Other operators

      [Op.all]: sequelize.literal('SELECT 1'), // > ALL (SELECT 1)

      [Op.in]: [1, 2],                         // IN [1, 2]
      [Op.notIn]: [1, 2],                      // NOT IN [1, 2]

      [Op.like]: '%hat',                       // LIKE '%hat'
      [Op.notLike]: '%hat',                    // NOT LIKE '%hat'
      [Op.startsWith]: 'hat',                  // LIKE 'hat%'
      [Op.endsWith]: 'hat',                    // LIKE '%hat'
      [Op.substring]: 'hat',                   // LIKE '%hat%'
      [Op.iLike]: '%hat',                      // ILIKE '%hat' (case insensitive) (PG only)
      [Op.notILike]: '%hat',                   // NOT ILIKE '%hat'  (PG only)
      [Op.regexp]: '^[h|a|t]',                 // REGEXP/~ '^[h|a|t]' (MySQL/PG only)
      [Op.notRegexp]: '^[h|a|t]',              // NOT REGEXP/!~ '^[h|a|t]' (MySQL/PG only)
      [Op.iRegexp]: '^[h|a|t]',                // ~* '^[h|a|t]' (PG only)
      [Op.notIRegexp]: '^[h|a|t]',             // !~* '^[h|a|t]' (PG only)

      [Op.any]: [2, 3],                        // ANY ARRAY[2, 3]::INTEGER (PG only)

      // In Postgres, Op.like/Op.iLike/Op.notLike can be combined to Op.any:
      [Op.like]: { [Op.any]: ['cat', 'hat'] }  // LIKE ANY ARRAY['cat', 'hat']

      // There are more postgres-only range operators, see below
    }
  }
});
```
常规的 CRUD API 支持的还不错，但是自定义查询或者基于 QueryBuilder 实现更复杂查询的支持就弱爆了，比如：
```ts
Post.findAll({
  where: {
    [Op.or]: [
      sequelize.where(sequelize.fn('char_length', sequelize.col('content')), 7),
      {
        content: {
          [Op.like]: 'Hello%'
        }
      },
      {
        [Op.and]: [
          { status: 'draft' },
          sequelize.where(sequelize.fn('char_length', sequelize.col('content')), {
            [Op.gt]: 10
          })
        ]
      }
    ]
  }
});

Model.findAll({
  attributes: [
    'id', 'foo', 'bar', 'baz', 'qux', 'hats', // We had to list all attributes...
    [sequelize.fn('COUNT', sequelize.col('hats')), 'n_hats'] // To add the aggregation...
  ]
});

// This is shorter, and less error prone because it still works if you add / remove attributes from your model later
Model.findAll({
  attributes: {
    include: [
      [sequelize.fn('COUNT', sequelize.col('hats')), 'n_hats']
    ]
  }
});
```
Sequelize 在配置 Model 和 Migration 的表现上都比较不错，但是在 QueryBuilder 的支持上弱爆了，几乎不解决各数据库的兼容性问题，提供的 queryInterface 也非常难用，一点也不 SQL-Friendly。
### Prisma
提供了 Prisma Client 用于支持数据的 CRUD，用法与 Sequelize 相似。没有提供 QueryBuilder 如果常规 CRUD API 支持的不好，可能很难改造，这部分了解的不多，细节存在非常多未知。感兴趣的看官网 [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client) 章节。
```ts
const user = await prisma.user.create({
  data: {
    email: 'elsa@prisma.io',
    name: 'Elsa Prisma',
  },
})

const getPosts = await prisma.post.findMany({
  where: {
    title: {
      contains: 'cookies',
    },
  },
  include: {
    author: true, // Return all fields
  },
})
```
这种风格的 CRUD API 非常不利于调试，一旦出现问题将很难改造。
### Objection.js
得益于 Knex，Objection 在 QueryBuilder 的表现上非常不错 SQL-Friendly，可造性非常强。
```ts
const jennifer = await Person.query().insert({
  firstName: 'Jennifer',
  lastName: 'Lawrence'
});
// insert into "persons" ("firstName", "lastName") values ('Jennifer', 'Lawrence')

console.log(jennifer instanceof Person); // --> true
console.log(jennifer.firstName); // --> 'Jennifer'
console.log(jennifer.fullName()); // --> 'Jennifer Lawrence'

const numUpdated = await Person.query()
  .patch({ lastName: 'Dinosaur' })
  .where('age', '>', 60);
// update "persons" set "lastName" = 'Dinosaur' where "age" > 60

console.log(numUpdated, 'people were updated');

const middleAgedJennifers = await Person.query()
  .select('age', 'firstName', 'lastName')
  .where('age', '>', 40)
  .where('age', '<', 60)
  .where('firstName', 'Jennifer')
  .orderBy('lastName');

console.log('The last name of the first middle aged Jennifer is');
console.log(middleAgedJennifers[0].lastName);

// select "age", "firstName", "lastName"
// from "persons"
// where "age" > 40
// and "age" < 60
// and "firstName" = 'Jennifer'
// order by "lastName" asc
```
### Bookshelf
一样基于 Knex，细节就不一一罗列了
​

### 总结
除了常规的增删改查，还有一个非常重要的能力就是关系数据的处理能力，关系数据的 eager loading 也是各 ORM 永恒的话题，这里就不细说了


- 从完整性来说，Typeorm 的最完整
- 如果说有什么理由让我选择 Objection.js，我会说它的 QueryBuilder 非常给力，写起来非常舒服，可造性也非常强
- Sequelize 的常规 CRUD API 并没有太大问题，但是在关系数据的处理上问题太多了。而且黑箱设计的 CRUD API，非常难以调试和改造
- Prisma 的 CRUD API 与 Sequelize 相似，这让我非常担心它是否也会有 Sequelize 的各种糟心问题
- 至于 Bookshelf，已经不维护了就不深入讨论了，Objection.js 是类似最好的替代品

​

## 如何选择？

- 综合实力 Typeorm 最强，各方面表现的都不差，但细节还差那么点，需要更深入使用才能知道细节表现力，存在非常多未知，但因为社区活跃，成长空间巨大
- 从无代码改造角度来说，Sequelize 工作量是最少的，尤其是给力的 sync 方法。但我非常不喜欢它的 QueryBuilder 设计。Sequelize 的社区活跃度也很高，但是核心团队看起来出现了些问题 [issue #12956](https://github.com/sequelize/sequelize/issues/12956) 
- 我非常喜欢 Objection.js 在 QueryBuilder 上的表现力，可造性非常强，但是要完整的无代码支持，工作量也非常多

​

**在这样的大环境下，无代码的 Database 要如何选择 ORM 和改造呢？**
综合考虑，Sequelize 最适合作为蓝本，基于 Sequelize 优先实现第一版，即使 Sequelize 存在问题，后续也可以替换为 Typeorm 或 Objection.js 等。


## 改造开始
### Collection
NocoBase 首先基于 Sequelize 的 ModelOptions、 ModelAttributes、ModelAssociations 提炼了一套更适合无代码配置的 JSON 风格的配置协议，称之为 Collection Schema Language，简称 CSL。示例如下：
```typescript
// 用户
db.collection({
  name: 'users',
  fields: {
    username: { type: 'string', unique: true },
    password: { type: 'password', unique: true },
    posts:    { type: 'hasMany' },
  },
});

// 文章
db.collection({
  name: 'posts',
  fields: {
    title:    'string',
    content:  'text',
    tags:     'belongsToMany',
    comments: 'hasMany',
    author:   { type: 'belongsTo', target: 'users' },
  },
});

// 标签
db.collection({
  name: 'tags',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'belongsToMany', name: 'posts' },
  ],
});

// 评论
db.collection({
  name: 'comments',
  fields: [
    { type: 'text', name: 'content' },
    { type: 'belongsTo', name: 'user' },
  ],
});
```
与现在流行的装饰器配置的结构很像，只不过它是用 JSON 编写的，便于动态生成 Model。与 Typeorm 的 EntitySchema 做法也非常接近。
​

**那为什么不直接使用 EntitySchema 呢？**
一方面对 EntitySchema 细节表现力如何未知，另一方面需要考虑后续的自定义字段需求，尤其是 UISchema 的扩展能力，自成一体的 CSL 更适合。而且结构上与 Typeorm 和 Prisma 的装饰器风格非常接近，学习成本并不高。
### Model & Repository
配置好了 CSL 之后，会根据它自动初始化 ORM 的 Model（Active Record）和 Repository（Data Mapper）：
```typescript
const User = app.collection({
  name: 'users',
  fields: {
    username: { type: 'string', unique: true },
    password: { type: 'password', unique: true },
    posts:    { type: 'hasMany' },
  },
});

User.model;
User.repository;
```
Model 的具体形态取决于适配的 ORM，保留原滋原味，细节就不多说了。Repository 自成一体，提供更适合 NocoBase 的 CRUD API。Model 和 Repository 都可以自定义，如：
```ts
class UserModel extends Model {

}

class UserRepository extends Repository {

}

const User = app.collection({
  name: 'users',
  model: UserModel,
  repository: UserRepository,
  fields: {
    username: { type: 'string', unique: true },
    password: { type: 'password', unique: true },
    posts:    { type: 'hasMany' },
  },
});
```
支持 Model 也支持 Repository，与 Typeorm 的做法非常接近，但是 Repository 并不是 Typeorm 的 Repository，我们来看看 Repository API 吧。
### Repository API
NocoBase 的 Repository API 有：

- repository.findMany()
- repository.findOne()
- repository.create()
- repository.update()
- repository.destroy()
- repository.relation().of()
   - findMany()
   - findOne()
   - create()
   - update()
   - destroy()
   - set()
   - add()
   - remove()
   - toggle()
#### findMany
```ts
repository.findMany({
  // 过滤
  filter: {
    $and: [{ a: 5 }, { b: 6 }],            // (a = 5) AND (b = 6)
    $or: [{ a: 5 }, { b: 6 }],             // (a = 5) OR (b = 6)
    someAttribute: {
      // Basics
      $eq: 3,                              // = 3
      $ne: 20,                             // != 20
      $is: null,                           // IS NULL
      $not: true,                          // IS NOT TRUE
      $gt: 6,                              // > 6
      $gte: 6,
    },
    'someAttribute.$eq': 3,
    'nested.someAttribute': {
      //
    },
    nested: {
      someAttribute: {},
    },
  },
  // 字段白名单
  fields: [],
  // 附加字段，主要用于附加关系字段
  appends: [],
  // 字段黑名单
  expect: [],
  sort: [],
  page: 1,
  pageSize: 2,
});
```
#### findOne
```typescript
repository.findOne({
  // 过滤
  filter: {},
  // 为更快速的 pk 过滤提供
  filterByPk: 1, // 通常情况等同于 filter: {id: 1}
  // 字段白名单
  fields: [],
  // 附加字段，主要用于附加关系字段
  appends: [],
  // 字段黑名单
  expect: [],
});
```
#### create
```ts
repository.create({
  // 待存数据
  values: {
    a: 'a',
    // 快速建立关联
    o2o: 1,    // 建立一对一关联
    m2o: 1,    // 建立多对一关联
    o2m: [1,2] // 建立一对多关联
    m2m: [1,2] // 建立多对多关联
    // 新建关联数据并建立关联
    o2o: {
      key1: 'val1',
    },
    o2m: [{key1: 'val1'}, {key2: 'val2'}],
    // 子表格数据
    subTable: [
      // 如果数据存在，更新处理
      {id: 1, key1: 'val1111'},
      // 如果数据不存在，直接创建并关联
      {key2: 'val2'},
    ],
  },
  // 字段白名单
  whitelist: [],
  // 字段黑名单
  blacklist: [],
  // 关系数据默认会新建并建立关联处理，如果是已存在的数据只关联，但不更新关系数据
  // 如果需要更新关联数据，可以通过 updateAssociations 指定
  updateAssociations: ['subTable'],
});
```
#### update
```ts
repository.update({
  // 待更新数据
  values: {},
  // 过滤，哪些数据要更新
  filter: {},
  // 为更快速的 pk 过滤提供
  filterByPk: 1, // 通常情况等同于 filter: {id: 1}
  // 字段白名单
  whitelist: [],
  // 字段黑名单
  blacklist: [],
  // 指定需要更新数据的关联字段
  updateAssociations: [],
});
```
#### destroy
```ts
// 特定 primary key 值
repository.destroy(1);

// 批量 primary key 值
repository.destroy([1, 2, 3]);

// 复杂的 filter
repository.destroy({
  filter: {},
});
```
#### relation
关系数据的 CRUD，用法与常规 Repository 的一致
```ts
// user_id = 1 的 post 的 repository
const userPostsRepository = repository.relation('posts').of(1);

userPostsRepository.findMany({
  
});

userPostsRepository.findOne({
  
});

userPostsRepository.create({
  values: {},
});

userPostsRepository.update({
  values: {},
});

userPostsRepository.destroy({
  
});
```
关联操作，只处理关系约束的建立与解除
```ts
// user_id = 1 的 post 的 relatedQuery
const userPostsRepository = repository.relation('posts').of(1);

// 建立关联
userPostsRepository.set(1);

// 批量，仅用于 HasMany 和 BelongsToMany
userPostsRepository.set([1,2,3]);

// BelongsToMany 的中间表
userPostsRepository.set([
  [1, {/* 中间表数据 */}],
  [2, {/* 中间表数据 */}],
  [3, {/* 中间表数据 */}],
]);

// 仅用于 HasMany 和 BelongsToMany
userPostsRepository.add(1);

// BelongsToMany 的中间表
userPostsRepository.add(1, {/* 中间表数据 */});

// 删除关联
userPostsRepository.remove(1);

// 建立或解除
userPostsRepository.toggle(1);
userPostsRepository.toggle([1, 2, 3]);
```
### Collection Sync
在 Migration 章节，介绍了各种 ORM 的 Migration 做法。得出结论 Sequelize.sync() 的方案较优，但不够精细，而且有些暴力，不过也没有关系，Collection 也打算这样做，再进一步的改进 sync 的细节，流程上就变得非常友好了。
​

只执行某个 collection 的 sync。虽然有 hasMany 的 posts，但因为关系表不存在并不会创建
```ts
const User = db.collection({
  name: 'users',
  fields: {
    username: { type: 'string', unique: true },
    password: { type: 'password', unique: true },
    posts:    { type: 'hasMany' },
  },
});

await User.sync();
```
我们也可以通过 db.sync 批量的将多个 collections 同步给数据库，通常不需要关注建表顺序、关系主外键和关系约束的先后顺序等等，collection 内部通通自动帮你处理好。比如下面例子：

- 不需要特意声明外键 user_id
- 不需要考虑关系外键要怎么建立，在哪里建立，也不需要考虑顺序问题
- 自动创建多对多中间表以及相关外键及约束
```ts
// 文章
db.collection({
  name: 'posts',
  fields: {
    title:    'string',
    content:  'text',
    tags:     'belongsToMany',
    comments: 'hasMany',
    author:   { type: 'belongsTo', target: 'users' },
  },
});

// 用户
db.collection({
  name: 'users',
  fields: {
    username: { type: 'string', unique: true },
    password: { type: 'password', unique: true },
    posts:    { type: 'hasMany' },
  },
});

// 标签
db.collection({
  name: 'tags',
  fields: [
    { type: 'string', name: 'name' },
    { type: 'belongsToMany', name: 'posts' },
  ],
});

// 评论
db.collection({
  name: 'comments',
  fields: [
    { type: 'text', name: 'content' },
    { type: 'belongsTo', name: 'user' },
  ],
});

await db.sync();
```
### 动态化
为了更好的支持动态配置 collection，提供了以下 API：

- db.collection 创建
- db.getCollection 获取
- collection.mergeOptions 和 collection 配置，不删除
- collection.hasField
- collection.getField
- collection.addField
- collection.setFields
- collection.mergeField 合并参数，如果 field 不存在则添加
- collection.removeField 移除
- collection.sync

备注：name 是非常重要的标识，但如果涉及 name 的修改如何处理比较合适？
​

有了 Collection API 就可以实现动态 Collection 了。解决动态数据的持久化问题，可以将数据储存在数据表里。为此，我们可以创建 collections 和 fields 两张表。
```ts
const Collection = db.collection({
  name: 'collections',
  fields: [
    { name: 'name', type: 'string', unique: true },
    { name: 'fields', type: 'hasMany', foreignKey: 'collectionName' },
  ],
});

const Field = db.collection({
  name: 'fields',
  fields: [
    { name: 'name', type: 'string' },
  ],
});

db.on('collections.afterCreate', async (model) => {
  const collection = db.collection(model.toJSON()); // 实际可能不是用 model.toJSON() 方法
  await collection.sync();
});

db.on('collections.afterUpdate', async (model) => {
  const collection = db.getCollection(model.get('name'));
  // 更新配置
  collection.mergeOptions(model.get());
  await collection.sync();
});

db.on('fields.afterCreate', async (model) => {
  const collection = db.getCollection(model.get('collectionName'));
  // 新增字段
  collection.addField(model.toJSON()); // 实际可能不是用 model.toJSON() 方法
  await collection.sync();
});

db.on('fields.afterUpdate', async (model) => {
  const collection = db.getCollection(model.get('collectionName'));
  // 更新字段配置
  collection.mergeField(model.toJSON()); // 实际可能不是用 model.toJSON() 方法
  await collection.sync();
});
```
备注：db.on 之后会另起一篇和 app.on 一起介绍
​

这样就可以用 Collection.repository.create() 来动态创建表了，比如：
```ts
await Collection.repository.create({
  values: {
    name: 'test',
    fields: [
      { name: 'name', type: 'string' },
    ],
  },
});
```
以上就是 plugin-collections 的核心实现逻辑了。
