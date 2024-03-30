CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建 users 表
CREATE TABLE users (
                     user_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                     username VARCHAR(100) NOT NULL
);

-- 创建 profiles 表
CREATE TABLE profiles (
                        profile_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                        address VARCHAR(255),
                        user_uuid UUID REFERENCES users(user_uuid)
);

-- 创建 roles 表
CREATE TABLE roles (
                     role_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                     role_name VARCHAR(100) NOT NULL
);

-- 创建 user_roles 关联表
CREATE TABLE user_roles (
                          user_uuid UUID REFERENCES users(user_uuid),
                          role_uuid UUID REFERENCES roles(role_uuid),
                          PRIMARY KEY (user_uuid, role_uuid)
);


-- 创建 orders 表
CREATE TABLE orders (
                      order_uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                      user_uuid UUID REFERENCES users(user_uuid),
                      order_name VARCHAR(255) NOT NULL
  -- ... 其他字段
);

-- 向 users 表插入测试数据
INSERT INTO users (username) VALUES
                               ('Alice'),
                               ('Bob');

INSERT INTO orders (user_uuid, order_name) VALUES
                                             ((SELECT user_uuid FROM users WHERE username = 'Alice'), 'Order1'),
                                             ((SELECT user_uuid FROM users WHERE username = 'Bob'), 'Order2');


-- 向 profiles 表插入测试数据
INSERT INTO profiles (address, user_uuid) VALUES
                                            ('123 Main St', (SELECT user_uuid FROM users WHERE username = 'Alice')),
                                            ('456 High St', (SELECT user_uuid FROM users WHERE username = 'Bob'));

-- 向 roles 表插入测试数据
INSERT INTO roles (role_name) VALUES
                                ('Admin'),
                                ('User');

-- 建立 users 和 roles 之间的关系
INSERT INTO user_roles (user_uuid, role_uuid) VALUES
                                                ((SELECT user_uuid FROM users WHERE username = 'Alice'), (SELECT role_uuid FROM roles WHERE role_name = 'Admin')),
                                                ((SELECT user_uuid FROM users WHERE username = 'Bob'), (SELECT role_uuid FROM roles WHERE role_name = 'User'));


CREATE TABLE "test_table" (
                                "id2" SERIAL PRIMARY KEY,
                                "smallint" int2,
                                "integer" int4,
                                "bigint" int8,
                                "boolean" bool,
                                "numeric" numeric,
                                "real" float4,
                                "double" float8,
                                "money" money,
                                "date" date,
                                "time" time,
                                "timestamp" timestamp,
                                "timestamptz" timestamptz,
                                "interval" interval,
                                "char" bpchar,
                                "varchar" varchar,
                                "text" text,
                                "tsquery" tsquery,
                                "tsvector" tsvector,
                                "uuid" uuid,
                                "xml" xml,
                                "json" json,
                                "jsonb" jsonb,
                                "bit" bit,
                                "bitvarying" varbit,
                                "bytea" bytea,
                                "cidr" cidr,
                                "inet" inet,
                                "macaddr" macaddr,
                                "txidsnapshot" txid_snapshot,
                                "box" box,
                                "circle" circle,
                                "line" line,
                                "lseg" lseg,
                                "path" path,
                                "point" point,
                                "polygon" polygon
);


-- 创建 authors 表
CREATE TABLE authors (
    author_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_name VARCHAR(100) NOT NULL
);

-- 创建 posts 表
CREATE TABLE posts (
    post_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_title VARCHAR(100) NOT NULL,
    post_content TEXT NOT NULL,
    author_id UUID REFERENCES authors(author_id)
);

-- 创建 comments 表
CREATE TABLE comments (
    comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comment_content TEXT NOT NULL,
    post_id UUID REFERENCES posts(post_id),
    author_id UUID REFERENCES authors(author_id)
);

-- 创建 tags 表
CREATE TABLE tags (
    tag_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_name VARCHAR(100) NOT NULL
);

-- 创建 post_tags 关联表
CREATE TABLE post_tags (
    post_id UUID REFERENCES posts(post_id),
    tag_id UUID REFERENCES tags(tag_id),
    PRIMARY KEY (post_id, tag_id)
);

-- 向 authors 表插入测试数据
INSERT INTO authors (author_name) VALUES
    ('Author1'),
    ('Author2');

-- 向 posts 表插入测试数据
INSERT INTO posts (post_title, post_content, author_id) VALUES
    ('Post1', 'This is the content of Post1', (SELECT author_id FROM authors WHERE author_name = 'Author1')),
    ('Post2', 'This is the content of Post2', (SELECT author_id FROM authors WHERE author_name = 'Author2'));

-- 向 comments 表插入测试数据
INSERT INTO comments (comment_content, post_id, author_id) VALUES
    ('This is a comment on Post1', (SELECT post_id FROM posts WHERE post_title = 'Post1'), (SELECT author_id FROM authors WHERE author_name = 'Author1')),
    ('This is a comment on Post2', (SELECT post_id FROM posts WHERE post_title = 'Post2'), (SELECT author_id FROM authors WHERE author_name = 'Author2'));

-- 向 tags 表插入测试数据
INSERT INTO tags (tag_name) VALUES
    ('Tag1'),
    ('Tag2');

-- 建立 posts 和 tags 之间的关系
INSERT INTO post_tags (post_id, tag_id) VALUES
    ((SELECT post_id FROM posts WHERE post_title = 'Post1'), (SELECT tag_id FROM tags WHERE tag_name = 'Tag1')),
    ((SELECT post_id FROM posts WHERE post_title = 'Post2'), (SELECT tag_id FROM tags WHERE tag_name = 'Tag2'));


-- 创建无主键的表 test_table_no_pk
CREATE TABLE test_table_no_pk (
    column1 VARCHAR(100),
    column2 INT
);

-- 向 test_table_no_pk 表插入测试数据
INSERT INTO test_table_no_pk (column1, column2) VALUES
    ('TestData1', 1),
    ('TestData2', 2);
