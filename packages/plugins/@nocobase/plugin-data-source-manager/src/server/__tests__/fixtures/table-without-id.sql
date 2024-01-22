-- 创建表
CREATE TABLE users (
                     user_id TEXT PRIMARY KEY,
                     username TEXT,
                     email TEXT,
                     age INTEGER
);

-- 插入测试数据
INSERT INTO users (user_id, username, email, age) VALUES
                                                    ('user1_id', 'user1', 'user1@example.com', 25),
                                                    ('user2_id', 'user2', 'user2@example.com', 30),
                                                    ('user3_id', 'user3', 'user3@example.com', 22),
                                                    ('user4_id', 'user4', 'user4@example.com', 28);


-- 创建带有自增主键的表
CREATE TABLE users_auto_increment (
                                    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    username TEXT,
                                    email TEXT,
                                    age INTEGER
);

-- 插入测试数据
INSERT INTO users_auto_increment (username, email, age) VALUES
                                                          ('user1', 'user1@example.com', 25),
                                                          ('user2', 'user2@example.com', 30),
                                                          ('user3', 'user3@example.com', 22),
                                                          ('user4', 'user4@example.com', 28);
