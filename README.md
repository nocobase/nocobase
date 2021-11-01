English | [简体中文](./README.zh-CN.md)

![](https://www.nocobase.com/images/demo/11.png)  

What is NocoBase
----------
NocoBase is a scalability-first, open-source no-code development platform. No programming required, build your own collaboration platform, management system with NocoBase in minutes.

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

https://www.nocobase.com/  
hello@nocobase.com

Architecture
----------

![](https://docs.nocobase.com/static/NocoBase.c9542b1f.png)

Requirements
----------

Node:

- Node.js 12.20+

Database:

- PostgreSQL 10.x+
- Sqlite 3+

Installation
----------

### Create a project with `create-nocobase-app`

#### Quickstart
~~~shell
yarn create nocobase-app my-nocobase-app --quickstart
~~~

#### Step by step
~~~shell
# 1. create project
yarn create nocobase-app my-nocobase-app

# 2. switch to the project directory
cd my-nocobase-app

# 3. create initialization data
yarn nocobase init --import-demo

# 4. start project
yarn start
~~~

Open http://localhost:8000 in a web browser.

### Use docker

```bash
docker run --name my-nocobase-app -p 8000:13002 -d nocobase/nocobase:0.5.0-alpha.23
docker logs my-nocobase-app
```

Open http://localhost:8000 in a web browser.

## Contributing

https://docs.nocobase.com/guide/contributing
