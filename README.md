English | [简体中文](./README.zh-CN.md)

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

When to use NocoBase
----------
- **SMEs and organizations build business platforms and management systems for themselves or for their industry**
	- Want the price to be low enough or even free
	- Can be flexibly customized without programming knowledge
	- Need full control of source code and data
	- Can freely distribute and sell as their own products
- **Service providers and outsourcing teams develop collaboration platforms and management systems for their clients**
	- Want to keep development costs as low as possible
	- Need the most user-friendly secondary development experience
	- Must be deployed privately as a standalone product for the client
	- Can be freely distributed and sold by the client

Why choose NocoBase
----------
- **Open source and free**
	- Unrestricted commercial use under the MIT license
	- Full code ownership, private deployment, private and secure data
	- Free to expand and develop for actual needs
	- Good ecological support
- **Strong no-code capability**
	- WYSIWYG visual configuration
	- Separation of data structure configuration from interface configuration
	- Rich combination of blocks and operations
	- Role-based access control
- **Developer-friendly**
	- Microkernel architecture, flexible and easy to extend, with a robust plug-in system
	- Node.js-based, with popular frameworks and technologies, including Koa, Sequelize, React, Formily, Ant Design, etc.
	- Progressive development, easy for getting-started, friendly to newcomers
	- No binding, no strong dependencies, can be used in any combination or extensions, can be used in existing projects

Note
----------
NocoBase is still in early development and is for preview purposes only and is not suitable for use in a production environment.  A relatively stable and well-documented public beta is expected to be released as early as the first quarter of 2022.
If you are interested in NocoBase, please join us to discuss and develop it together.

Architecture
----------

![](https://docs.nocobase.com/static/NocoBase.c9542b1f.png)

Requirements
----------

Node:

- Node.js 12.20+

Database:

- PostgreSQL 10.x+
- MySQL 8.x+
- SQLite 3+

Installation
----------

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
