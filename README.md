English | [简体中文](./README.zh-CN.md)

![](https://www.nocobase.com/images/demo/11.png)  

Note
----------
NocoBase is still in early development and is for preview purposes only and is not suitable for use in a production environment.  A relatively stable and well-documented public beta is expected to be released as early as the first quarter of 2022.
If you are interested in NocoBase, please join us to discuss and develop it together.

https://www.nocobase.com/  
hello@nocobase.com

What is NocoBase
----------
NocoBase is an open source and free no-code development platform. Whether you are a business executive who does not know programming or a developer who is proficient in programming, you can quickly build various customized and privately deployed collaboration platforms and management systems.

When to use Nocobase
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

Architecture
----------

![](https://docs.nocobase.com/static/NocoBase.c9542b1f.png)

Requirements
----------

Node:

- Node.js 12.x or 14.x

Database(Choose any one):

- PostgreSQL 10.x+ (Recommend)
- MySQL 5.7.x+

Installation
----------

Use only as a no-code platform

~~~bash
# Create project directory
mkdir my-nocobase-project && cd my-nocobase-project
# npm initialization
npm init
# Installing nocobase dependencies
npm i @nocobase/api @nocobase/app
# Copy and configure env, don't forget to change the database information
cp -r node_modules/@nocobase/api/.env.example .env
# Database initialization
npx nocobase db-init
# Start app
npx nocobase start
~~~

Want to participate in the development

~~~shell
# You can use docker to start the database
docker-compose up -d postgres
# Set Environment Variables
cp .env.example .env
npm install
npm run bootstrap
npm run build
npm run db-migrate init
npm start
~~~

Nodejs provided by docker

```shell
git clone https://github.com/nocobase/nocobase.git
cd nocobase
# You can use docker to start the database
docker-compose up -d postgres
# Set Environment Variables
cp .env.example .env

# Installing dependencies and initializing
docker-compose run nocobase bash -c 'npm install && npm run bootstrap && npm run build && npm run db-migrate init'

# Start nocobase
docker-compose up -d nocobase

# View log
docker-compose logs nocobase
```


Build
----------

~~~shell
# for all packages
npm run build

# for specific package
npm run build <package_name_1> <package_name_2> ...
~~~

Test
----------

~~~
# For all packages
npm test

# For specific package
npm test packages/<name>
~~~
