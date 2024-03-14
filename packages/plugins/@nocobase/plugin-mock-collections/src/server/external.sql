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
