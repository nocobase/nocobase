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

- Node.js 12.20+

Database:

- PostgreSQL 10.x+

Installation
----------

### Create a project with `create-nocobase-app`

~~~shell
mkdir my-nocobase-app && cd my-nocobase-app
yarn create nocobase-app
cp .env.example .env
docker-compose up -d postgres
yarn install
yarn nocobase init
yarn start
~~~

Open http://localhost:8000 in a web browser.

### Use docker compose

Create a `docker-compose.yml` file

```yaml
version: "3"
networks:
  nocobase:
    driver: bridge
services:
  adminer:
    image: adminer
    restart: always
    networks:
      - nocobase
    ports:
      - 28080:8080
  postgres:
    image: postgres:10
    restart: always
    networks:
      - nocobase
    command: postgres -c wal_level=logical
    environment:
      POSTGRES_USER: nocobase
      POSTGRES_DB: nocobase
      POSTGRES_PASSWORD: nocobase
  nocobase:
    image: nocobase/nocobase:0.5.0-alpha.14
    networks:
      - nocobase
    command: [ "yarn", "serve", "start", "--port", "8000" ]
    environment:
      DB_DIALECT: postgres
      DB_DATABASE: nocobase
      DB_USER: nocobase
      DB_PASSWORD: nocobase
      DB_PORT: 5432
      DB_HOST: postgres
    ports:
      - "28000:8000"
```

Run the command on your terminal

```
docker-compose run nocobase bash -c 'yarn serve init'
docker-compose up -d
```

Open http://localhost:28000 in a web browser.

### Participate in the development

~~~shell
git clone https://github.com/nocobase/nocobase.git
cd nocobase
cp .env.example .env
docker-compose up -d postgres
yarn install
yarn bootstrap
yarn build
yarn nocobase init
yarn start
~~~

Open http://localhost:8000 in a web browser.