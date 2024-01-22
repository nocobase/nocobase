-- 创建用户表
CREATE TABLE IF NOT EXISTS Users (
                                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                                   username TEXT,
                                   email TEXT
);

-- 插入用户数据
INSERT INTO Users (username, email) VALUES ('user1', 'user1@example.com');
INSERT INTO Users (username, email) VALUES ('user2', 'user2@example.com');
-- 可以继续插入更多用户数据

-- 创建文章表
CREATE TABLE IF NOT EXISTS Articles (
                                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                                      title TEXT,
                                      content TEXT,
                                      user_id INTEGER,
                                      FOREIGN KEY (user_id) REFERENCES Users(id)
  );

-- 插入文章数据
INSERT INTO Articles (title, content, user_id) VALUES ('Article 1', 'Content of Article 1', 1);
INSERT INTO Articles (title, content, user_id) VALUES ('Article 2', 'Content of Article 2', 2);
-- 可以继续插入更多文章数据

-- 创建订单表
CREATE TABLE IF NOT EXISTS Orders (
                                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                                    amount REAL,
                                    user_id INTEGER,
                                    FOREIGN KEY (user_id) REFERENCES Users(id)
  );

-- 插入订单数据
INSERT INTO Orders (amount, user_id) VALUES (50.0, 1);
INSERT INTO Orders (amount, user_id) VALUES (75.5, 2);
-- 可以继续插入更多订单数据

-- 创建评论表
CREATE TABLE IF NOT EXISTS Comments (
                                      id INTEGER PRIMARY KEY AUTOINCREMENT,
                                      text TEXT,
                                      user_id INTEGER,
                                      article_id INTEGER,
                                      FOREIGN KEY (user_id) REFERENCES Users(id),
  FOREIGN KEY (article_id) REFERENCES Articles(id)
  );

-- 插入评论数据
INSERT INTO Comments (text, user_id, article_id) VALUES ('Comment 1', 1, 1);
INSERT INTO Comments (text, user_id, article_id) VALUES ('Comment 2', 2, 1);
-- 可以继续插入更多评论数据


-- 创建带有 NOT NULL 约束的数据表
CREATE TABLE example_table (
                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                             name TEXT NOT NULL,
                             age INTEGER NOT NULL,
                             email TEXT
);

-- 创建带有 BLOB 类型字段的表
CREATE TABLE blob_table (
                             id INTEGER PRIMARY KEY,
                             data BLOB
);
