[English](./README.md) | 简体中文

![](https://www.nocobase.com/images/demo/11.png)  

NocoBase 是什么
----------
NocoBase 是一个极易扩展的开源无代码开发平台。
无需编程，使用 NocoBase 搭建自己的协作平台、管理系统，只需要几分钟时间。 

官网：https://cn.nocobase.com/

在线体验：https://demo-cn.nocobase.com/new

为什么选择 NocoBase
----------
- **开源免费**
   - 采用 Apache-2.0 许可协议，不限制商业使用
   - 拥有全部代码，私有化部署，保障数据私有和安全
   - 针对实际需求自由扩展开发
   - 具备良好的生态支持
- **无代码能力强**
	- 数据模型
		- 使用文本、日期、数字、附件、选项、图标等数十种字段类型，以及一对一、一对多、多对多等各种关联关系，创建独立的数据模型
	- 区块
		- 使用表格、表单、看板、日历、详情等区块类型在页面内自由组合，来展示和操作数据
	- 权限
		- 基于角色控制用户的系统配置权限、数据操作权限和菜单访问权限
	- 工作流
		- 重复性的任务由自动化代替，减少人工操作， 提高效率。重要的事情需经过人工审批。
	- 菜单
		- 可以对菜单分组，支持添加页面和链接，支持无限级子菜单
	- 操作
		- 支持筛选、导出、添加、删除、修改、查看等操作对数据进行处理，可以扩展更多类型
- **对开发者友好**
   - 微内核，灵活易扩展，具备健全的插件体系
   - 基于 Node.js，使用主流框架和技术，包括 Koa、Sequelize、React、Formily、Ant Design 等
   - 渐进式开发，上手难度低，对新人友好
   - 不绑架、不强依赖，可任意组合使用或扩展，可用于现有项目中

说明
----------

如果你希望加入我们一起开发 NocoBase，或者探讨 NocoBase 未来发展，或者需要提供商业服务，欢迎通过邮件联系我们：hello@nocobase.com  

或者添加我们的微信：  

![](https://www.nocobase.com/images/wechat.png)  


NocoBase 架构
----------
![](https://www.nocobase.com/images/NocoBaseMindMapLite.png)

[点此查看完整图片](https://www.nocobase.com/images/NocoBaseMindMap.png)

环境要求
----------

Node:

- Node.js 14+

Database（任选其一）:

- PostgreSQL 10.x+
- MySQL 8.x+
- SQLite 3+

安装 & 运行
----------

### 使用 Docker 创建项目（👍推荐）

⚡⚡请确保你已经安装了 [Docker](https://docs.docker.com/get-docker/)

#### 1. 将 NocoBase 下载到本地

使用 Git 下载（或直接[下载 Zip 包](https://github.com/nocobase/nocobase/archive/refs/heads/main.zip)，并解压到 nocobase 目录下）

```bash
git clone https://github.com/nocobase/nocobase.git nocobase
```

#### 2. 选择数据库（任选其一）

支持 SQLite、MySQL、PostgreSQL 数据库

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

#### 3. 安装并启动 NocoBase

安装过程可能需要等待几十秒钟

```bash
# 在后台运行
$ docker-compose up -d
# 查看 app 进程的情况
$ docker-compose logs app

app-sqlite-app-1  | nginx started
app-sqlite-app-1  | yarn run v1.22.15
app-sqlite-app-1  | $ cross-env DOTENV_CONFIG_PATH=.env node -r dotenv/config packages/app/server/lib/index.js install -s
app-sqlite-app-1  | Done in 2.72s.
app-sqlite-app-1  | yarn run v1.22.15
app-sqlite-app-1  | $ pm2-runtime start --node-args="-r dotenv/config" packages/app/server/lib/index.js -- start
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: Launching in no daemon mode
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: App [index:0] starting in -fork mode-
app-sqlite-app-1  | 2022-04-28T15:45:38: PM2 log: App [index:0] online
app-sqlite-app-1  | 🚀 NocoBase server running at: http://localhost:13000/
```

#### 4. 登录 NocoBase

使用浏览器打开 http://localhost:13000/ 初始化账号和密码是 `admin@nocobase.com` 和 `admin123`。

### 通过 `create-nocobase-app` 创建项目

~~~shell
# 1. 创建项目
# SQLite
yarn create nocobase-app my-nocobase-app -d sqlite
# MySQL
yarn create nocobase-app my-nocobase-app -d mysql \
   -e DB_HOST=mysql \
   -e DB_PORT=3356 \
   -e DB_DATABASE=nocobase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase
# PostgreSQL
yarn create nocobase-app my-nocobase-app -d postgres \
   -e DB_HOST=postgres \
   -e DB_PORT=5432 \
   -e DB_DATABASE=nocobase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase

# 2. 切换目录
cd my-nocobase-app

# 📢 由于网络环境、系统配置等因素影响，接下来这一步骤可能需要十几分钟时间
# 📢 使用 SQLite 数据库时，需要配置 sqlite3_binary_host_mirror
yarn config set sqlite3_binary_host_mirror https://npmmirror.com/mirrors/sqlite3/

# 3. 安装依赖（使用阿里云镜像）
yarn install --registry=https://registry.npmmirror.com

# 4. 安装 NocoBase
yarn nocobase install --lang=zh-CN

# 5. 启动
yarn start
~~~

使用浏览器打开 http://localhost:8000/ 初始化账号和密码是 `admin@nocobase.com` 和 `admin123`。

### 参与贡献

- Fork 源代码到自己的仓库
- 修改源代码
- 提交 Pull Request

```bash
# 替换为自己的仓库地址
git clone https://github.com/nocobase/nocobase.git
cd nocobase
cp .env.example .env
yarn install
yarn nocobase install
yarn dev
```

#### 打包

```bash
# For all packages
yarn build

# For specific package
yarn build app/client app/server
```

#### 测试

```bash
# For all packages
yarn test

# For specific package
yarn test packages/<name>
```
