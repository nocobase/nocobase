[English](./README.md) | 简体中文

![](https://nocobase.oss-cn-beijing.aliyuncs.com/b44a2146ad4c4b20e6f7fe52a0e8d04e.png)  
  
  
说明
----------
NocoBase 仍处于早期开发阶段，仅用于预览，不适合在生产环境中使用。相对稳定以及包含完善文档的公开测试版预计将于 2021 年第三季度发布。

如果你希望加入我们一起开发 NocoBase，或者探讨 NocoBase 未来发展，或者需要提供 NocoBase 使用上的帮助，欢迎通过邮件联系我们：hello@nocobase.com

NocoBase 是什么
----------
NocoBase 是一个开源免费的无代码开发平台。
无论是不懂编程的业务主管，还是精通编程的开发人员，都可以快速搭建各类定制化、私有部署的协作平台、管理系统。  

[https://www.nocobase.com/](https://www.nocobase.com/)

哪些人适合使用 NocoBase
----------
- 中小企业和组织
   - 精通所在组织或行业的业务
   - 希望搭建数字化系统
- IT 服务商和外包团队
   - 为中小企业和组织提供数字化升级
   - 拥有系统开发能力

哪些场景适合使用 NocoBase
----------
- 中小企业和组织为自己或者为所在行业搭建业务平台和管理系统
   - 希望价格足够低，甚至免费
   - 不懂编程也可以灵活定制
   - 需要完全掌控源代码和数据
   - 可以以自有产品的形态自由分发和销售
- 服务商和外包团队为客户开发协作平台和管理系统
   - 希望尽可能降低开发成本
   - 需要极致友好的二次开发体验
   - 必须以独立产品的形态为客户私有部署
   - 客户可以自由分发和销售

为什么选择 NocoBase
----------
- 开源免费
   - 采用 MIT 许可协议，不限制商业使用
   - 拥有全部代码，私有化部署，保障数据私有和安全
   - 针对实际需求自由扩展开发
   - 具备良好的生态支持
- 无代码能力强
   - 灵活的“菜单→页面→视图→数据”架构，不懂编程也能做出强大的系统
   - 像创建文档一样无限制地创建页面，并通过不限层级的导航菜单灵活组织
   - 像输入文字一样向页面中添加表格、日历、表单、图表等各类视图并自由组合
   - 精确配置数据的操作权限、页面和菜单的访问权限
- 对开发者友好
   - 微内核，灵活易扩展，具备健全的插件体系
   - 基于 Node.js，使用主流框架和技术，包括 Koa、Sequelize、React、Ant Design 等
   - 渐进式开发，上手难度低，对新人友好
   - 不绑架、不强依赖，可任意组合使用或扩展，可用于现有项目中

NocoBase 架构
----------
![](https://nocobase.oss-cn-beijing.aliyuncs.com/4fde069587182dacbdb00b020d914404.jpg)

- **微内核**  
NocoBase 采用微内核架构，框架只保留核心的概念，具体各类功能都以插件的形式扩展。各个包可以拆出来单独或组合使用，可用于现有项目中，这也是渐进式框架的意义所在。除此之外，我们也非常注重与现有技术框架融合，做连接现有生态的桥梁，而不是闭门造车。

- **插件化**  
所有的功能需求都通过插件形式扩展，除了现有的几个核心插件以外，开发者还可以自由的扩展，包括但不局限于：
   - Collection - 数据表
   - Relationship - 相关数据
   - Field - 字段
   - Model - 模型
   - Hook - 事件
   - Resource - 资源
   - Action - 操作方法
   - Middleware - 中间件
   - View - 视图
   - Page - 页面

- **配置化驱动**  
配置化是常见的无代码/低代码技术方案，NocoBase 也是基于配置驱动的，为了方便各类配置需求，配置有三类写法：
   - 直接写在代码里，多用于处理动态配置
   - 保存在文件里，多用于系统表配置或纯开发配置
   - 保存在数据表里，多用于业务表配置

环境要求
----------

Node:

- Node.js 12.x or 14.x

Database:

- PostgreSQL 10.x+
- MySQL 5.7.x+

安装 & 运行
----------

仅作为无代码平台使用

~~~shell
# 创建项目目录
mkdir my-nocobase-project && cd my-nocobase-project
# 初始化 npm
npm init
# 安装 nocobase 包
npm i @nocobase/api @nocobase/app
# 复制并配置 env，不要忘了修改数据库信息
cp -r node_modules/@nocobase/api/.env.example .env
# 数据库初始化
npx nocobase db-init
# 启动应用
npx nocobase start
~~~

想要参与项目开发

~~~shell
git clone https://github.com/nocobase/nocobase.git
cd nocobase
docker-compose up -d postgres # 用 docker 启动数据库
cp .env.example .env # 配置数据库信息、APP 端口等
npm install
npm run bootstrap
npm run build
npm run db-migrate init
npm start
~~~

如果本地 node 有问题，可以使用 docker 提供的环境

```shell
git clone https://github.com/nocobase/nocobase.git
cd nocobase
docker-compose up -d postgres # 用 docker 启动数据库
cp .env.example .env # 配置数据库信息、APP 端口等

# 使用 docker 提供的 node 环境安装依赖与初始化
docker-compose run nocobase bash -c 'npm install && npm run bootstrap && npm run build && npm run db-migrate init'

# 启动 nocobase 应用
docker-compose up -d nocobase

# 查看日志
docker-compose logs nocobase
```

打包
----------

~~~shell
# for all packages
npm run build

# for specific package
npm run build <package_name_1> <package_name_2> ...
~~~

测试
----------

~~~
# For all packages
npm test

# For specific package
npm test packages/<name>
~~~
