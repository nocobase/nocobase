[English](./README.md) | 简体中文

![](https://www.nocobase.com/images/demo/11.png)  
  
  
说明
----------
NocoBase 仍处于早期开发阶段，功能不完整，稳定性不高，仅用于预览，不适合在生产环境中使用。相对稳定以及包含完善文档的公开测试版预计最早将于 2022 年第一季度发布。

如果你希望加入我们一起开发 NocoBase，或者探讨 NocoBase 未来发展，或者需要提供 NocoBase 使用上的帮助，欢迎通过邮件联系我们：hello@nocobase.com

NocoBase 是什么
----------
NocoBase 是一个开源免费的无代码开发平台。
无论是不懂编程的业务主管，还是精通编程的开发人员，都可以快速搭建各类定制化、私有部署的协作平台、管理系统。  

[https://www.nocobase.com/](https://www.nocobase.com/)

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
   - 所见即所得的可视化配置
   - 数据结构配置与界面配置分离
   - 丰富的区块和操作任意组合
   - 基于角色的访问权限
- 对开发者友好
   - 微内核，灵活易扩展，具备健全的插件体系
   - 基于 Node.js，使用主流框架和技术，包括 Koa、Sequelize、React、Formily、Ant Design 等
   - 渐进式开发，上手难度低，对新人友好
   - 不绑架、不强依赖，可任意组合使用或扩展，可用于现有项目中

NocoBase 架构
----------
![](https://docs.nocobase.com/static/NocoBase.c9542b1f.png)


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
