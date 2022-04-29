English | [中文](./README.zh-CN.md)

![](https://nocobase.oss-cn-beijing.aliyuncs.com/bbcedd403d31cd1ccc4e9709581f5c2f.png)  

What is NocoBase
----------
NocoBase is a scalability-first, open-source no-code development platform. No programming required, build your own collaboration platform, management system with NocoBase in minutes.

Homepage:
https://www.nocobase.com/  

Online Demo:
https://demo.nocobase.com/new

Contact Us:
hello@nocobase.com

Why choose NocoBase
----------
- **Open source and free**
	- Unrestricted commercial use under the Apache-2.0 license
	- Full code ownership, private deployment, private and secure data
	- Free to expand and develop for actual needs
	- Good ecological support
- **Strong no-code capability**
	- Data Model
		- Dozens of field types such as text, attachments, etc., as well as many-to-many, one-to-many, one-to-one relationships.
	- Menu
		- Groups, pages, links combination into menu, support infinite level submenu
	- Block
		- Rich block types such as tables, kanban, calendars, forms, etc. are freely combined within the page to display and manipulate data.
	- Action
		- Configure actions such as filtering, exporting, adding, deleting, modifying, and viewing to process data.
	- ACL
		- Role-based control of user's system configuration rights, action rights and menu access rights.
	- Workflow
		- Repetitive tasks are replaced by automation, reducing manual operations and increasing efficiency.
- **Developer-friendly**
	- Microkernel architecture, flexible and easy to extend, with a robust plug-in system
	- Node.js-based, with popular frameworks and technologies, including Koa, Sequelize, React, Formily, Ant Design, etc.
	- Progressive development, easy for getting-started, friendly to newcomers
	- No binding, no strong dependencies, can be used in any combination or extensions, can be used in existing projects

Architecture
----------

![](https://docs.nocobase.com/static/NocoBase.c9542b1f.png)

Requirements
----------

Node:

- Node.js 14+

Database(Choose one):

- PostgreSQL 10.x+
- MySQL 8.x+
- SQLite 3+

Installation
----------

## Create a project with [Docker](https://docs.docker.com/get-docker/) (Recommended)

### 1. Download NocoBase

Download with Git (or [Download Zip](https://github.com/nocobase/nocobase/archive/refs/heads/main.zip)，and extract it to the `nocobase` directory)

```bash
git clone https://github.com/nocobase/nocobase.git nocobase
```

### 2. Select database (choose one)

Supports SQLite, MySQL, PostgreSQL

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

### 3. Install and start NocoBase

> You can download and install Docker [here](https://docs.docker.com/get-docker/)

It may take dozens of seconds

```bash
# run in the background
$ docker-compose up -d
# view app logs
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

### 4. Log in to NocoBase

Open [http://localhost:13000](http://localhost:13000) in a web browser. The initial account and password are `admin@nocobase.com` and `admin123`.

## Create a project with `create-nocobase-app`

~~~shell
# 1. create project
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
   -e DB_DATABASE=postgres \
   -e DB_USER=postgres \
   -e DB_PASSWORD=postgres

# 2. switch to the project directory
cd my-nocobase-app

# 3. Install dependencies
yarn install

# 4. Install NocoBase
yarn nocobase install --lang=en-US

# 5. start project
yarn start
~~~

Open [http://localhost:8000](http://localhost:8000) in a web browser. The initial account and password are `admin@nocobase.com` and `admin123`.

## Contributing

- Fork the source code to your own repository
- Modify source code
- Submit pull request

```bash
# Replace the following git address with your own repo
git clone https://github.com/nocobase/nocobase.git
cd nocobase
cp .env.example .env
yarn install
yarn nocobase install
yarn start
```

### Building

```bash
# For all packages
yarn build

# For specific package
yarn build --scope @nocobase/database
```

### Testing

```bash
# For all packages
yarn test

# For specific package
yarn test packages/<name>
```
