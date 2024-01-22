CREATE TABLE 用户 (
                    用户ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    姓名 TEXT,
                    年龄 INTEGER
);

-- 创建课程表
CREATE TABLE 课程 (
                    课程ID INTEGER PRIMARY KEY AUTOINCREMENT,
                    课程名称 TEXT,
                    学分 INTEGER
);

-- 创建用户-课程关联表
CREATE TABLE 用户课程 (
                         关联ID INTEGER PRIMARY KEY AUTOINCREMENT,
                         用户ID INTEGER,
                         课程ID INTEGER,
                         FOREIGN KEY (用户ID) REFERENCES 用户(用户ID),
                         FOREIGN KEY (课程ID) REFERENCES 课程(课程ID)
);

-- 插入一些示例数据
INSERT INTO 用户 (姓名, 年龄) VALUES ('张三', 25);
INSERT INTO 用户 (姓名, 年龄) VALUES ('李四', 28);

INSERT INTO 课程 (课程名称, 学分) VALUES ('数学', 4);
INSERT INTO 课程 (课程名称, 学分) VALUES ('历史', 3);

INSERT INTO 用户课程 (用户ID, 课程ID) VALUES (1, 1); -- 张三修数学
INSERT INTO 用户课程 (用户ID, 课程ID) VALUES (1, 2); -- 张三修历史
INSERT INTO 用户课程 (用户ID, 课程ID) VALUES (2, 2); -- 李四修历史
