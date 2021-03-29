Note
----------
NocoBase is still in early development and is for preview purposes only and is not suitable for use in a production environment.  
If you are interested in NocoBase, please join us to discuss and develop it together.

https://www.nocobase.com/  
hello@nocobase.com

What is NocoBase
----------
NocoBase is an open source and free no-code development platform. Whether you are a business executive who does not know programming or a developer who is proficient in programming, you can quickly build various customized and privately deployed collaboration platforms and management systems.

Who is NocoBase for
----------
- **SMEs and organizations**
	- Proficient in the business of their organization or industry
	- Looking to build digital systems
- **IT service providers and outsourcing teams**
	- Provide digital upgrade for SMEs and organizations
	- Have development capabilities

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
	- More advanced codeless architecture, both flexible and easy to use, can make a powerful system even if you don't know programming
	- Support tables, calendars, forms, details, statistical charts and other types of views freely combined into the page
	- Unlimited hierarchical configuration of navigation menus, allowing flexible organization of pages
	- Precise configuration of data manipulation rights, access rights to pages and menus
- **Developer-friendly**
	- Microkernel architecture, flexible and easy to extend, with a robust plug-in system
	- Node.js-based, using mainstream frameworks and technologies, including Koa, Sequelize, React, Ant Design, etc.
	- Progressive development, low start-up difficulty, friendly to newcomers
	- No abduction, no strong dependencies, can be used in any combination or extensions, can be used in existing projects

Development
----------

Install Dependencies

~~~shell
# Install dependencies for root project
npm i

# Install dependencies for sub packages via lerna
npm run bootstrap
~~~

Set Environment Variables

~~~shell
cp .env.example .env
~~~

Build

~~~shell
# for all packages
npm run build

# for specific package
npm run build <package_name_1> <package_name_2> ...
~~~

Test

~~~
# For all packages
npm test

# For specific package
npm test packages/<name>
~~~
