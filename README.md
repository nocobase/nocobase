English | [中文](./README.zh-CN.md)

![](https://nocobase.oss-cn-beijing.aliyuncs.com/bbcedd403d31cd1ccc4e9709581f5c2f.png)  

## What is NocoBase

NocoBase is a scalability-first, open-source no-code development platform. No programming required, build your own collaboration platform, management system with NocoBase in minutes.

Homepage:  
https://www.nocobase.com/  

Online Demo:  
https://demo.nocobase.com/new

Documents:  
https://docs.nocobase.com/


Contact Us:  
hello@nocobase.com

## Who is NocoBase for

NocoBase is designed for you if you have the following needs.

- Develop an internal management system
- Build 90% of your system with no-code development in two days
- Develop freely for particular requirements, the rest 10% of the system
- The system requires frequent changes
- Private deployment with full control of code and data
- Free to use or pay for more technical support

## Why choose NocoBase

- **Open source and free**
	- Unrestricted commercial use under the Apache-2.0 license
	- Full code ownership, private deployment, private and secure data
	- Free to expand and develop for actual needs
	- Good ecological support
- **Strong no-code capability**
	- Data Model
		- Create independent data models using dozens of field types such as text, date, number, attachment, option, icon, etc., and various association relationships such as one-to-one, one-to-many, many-to-many, etc.
	- Block
		- Display and manipulate data within a page using a free combination of block types such as tables, forms, kanban, calendars, details, etc.
	- ACL
		- Role-based control of user's system configuration rights, data action rights and menu access rights.
	- Workflow
		- Repetitive tasks are replaced by automation to increase efficiency. Manual approval is required for important matters.
	- Menu
		- You can group menus, support adding pages and links, and support unlimited submenus.
	- Action
		- Support filtering, exporting, adding, deleting, modifying, viewing and other operations to process data, which can be extended to more types.
- **Built for extended development**
	- Microkernel architecture, flexible and easy to extend, with a robust plug-in system
	- Node.js-based, with popular frameworks and technologies, including Koa, Sequelize, React, Formily, Ant Design, etc.
	- Progressive development, easy for getting-started, friendly to newcomers
	- No binding, no strong dependencies, can be used in any combination or extensions, can be used in existing projects

## Architecture

![](https://www.nocobase.com/images/NocoBaseMindMapLite.png)

[Click here to view the full image](https://www.nocobase.com/images/NocoBaseMindMap.png)

## Installation

NocoBase supports both Docker and CLI installation methods. Docker is recommended if you are new to NocoBase.

### Docker (👍Recommended)

#### 0. Before start

⚡⚡ Please make sure you have installed [Docker](https://docs.docker.com/get-docker/)

#### 1. Download NocoBase

Download with Git (or Download Zip，and extract it to the nocobase directory)

```bash
git clone https://github.com/nocobase/nocobase.git nocobase
```

#### 2. Select database (choose one)

Supports SQLite, MySQL, PostgreSQL

```bash
# SQLite
cd nocobase/docker/app-sqlite
# MySQL
cd nocobase/docker/app-mysql
# PostgreSQL
cd nocobase/docker/app-postgres
```

#### 3. Install and start NocoBase

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

#### 4. Log in to NocoBase

Open [http://localhost:13000](http://localhost:13000) in a web browser. The initial account and password are `admin@nocobase.com` and `admin123`.


### CLI

#### 0. Before start

Please make sure you have Node.js 12.x or above installed. You can download and install the latest LTS version from the official website. It is recommended to use nvm (or nvm-windows for Win systems) to manage Node.js versions if you plan to work with Node.js for a long time.

```bash
$ node -v

v16.13.2
```

yarn package manager is recommend.

```bash
$ npm install --global yarn
$ yarn -v

1.22.10
```

Also, make sure you have configured and started the required database, which supports SQLite, MySQL, PostgreSQL.

#### 1. Create a NocoBase project

```bash
# SQLite
yarn create nocobase-app my-nocobase-app -d sqlite
# MySQL
yarn create nocobase-app my-nocobase-app -d mysql \
   -e DB_HOST=localhost \
   -e DB_PORT=3356 \
   -e DB_DATABASE=nocobase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase
# PostgreSQL
yarn create nocobase-app my-nocobase-app -d postgres \
   -e DB_HOST=localhost \
   -e DB_PORT=5432 \
   -e DB_DATABASE=nocobase \
   -e DB_USER=nocobase \
   -e DB_PASSWORD=nocobase
```

#### 2. Switch to the project directory

```bash
cd my-nocobase-app
```

#### 3. Install dependencies

```bash
yarn install
```

#### 4. Install & Start NocoBase

```bash
yarn nocobase install --lang=en-US
yarn start
```

#### 5. Log in to NocoBase

Open [http://localhost:8000](http://localhost:8000) in a web browser. The initial account and password are `admin@nocobase.com` and `admin123`.

## Contributing

- Fork the source code to your own repository
- Modify source code
- Submit pull request

### Download 

```bash
# Replace the following git address with your own repo
git clone https://github.com/nocobase/nocobase.git
cd nocobase
cp .env.example .env
yarn install
```

### Development and Testing

```bash
# Install NocoBase
yarn nocobase install --lang=en-US
# Start NocoBase
yarn start
# Run all tests
yarn test
# Run all test files in the folder
yarn test <dir>
# Run a single test file
yarn test <file>
```

### Documentation preview

```bash
# Start documentation
yarn doc --lang=zh-CN
yarn doc --lang=en-US
```

The documentation is in the docs directory and follows Markdown syntax

```bash
|- /docs/
  |- en-US
  |- zh-CN
```
