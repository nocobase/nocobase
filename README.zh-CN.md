[English](./README.md) | 简体中文

![](https://www.nocobase.com/images/demo/11.png)  

NocoBase 是什么
----------
NocoBase 是一个极易扩展的开源无代码开发平台。
无需编程，使用 NocoBase 搭建自己的协作平台、管理系统，只需要几分钟时间。 

[https://www.nocobase.com/cn](https://www.nocobase.com/cn)

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

说明
----------
NocoBase 仍处于早期开发阶段，功能不完整，稳定性不高，仅用于预览，不适合在生产环境中使用。相对稳定以及包含完善文档的公开测试版预计最早将于 2022 年第一季度发布。

如果你希望加入我们一起开发 NocoBase，或者探讨 NocoBase 未来发展，或者需要提供 NocoBase 使用上的帮助，欢迎通过邮件联系我们：hello@nocobase.com  

或者添加我们的微信：  

![](https://www.nocobase.com/images/wechat.png)  


NocoBase 架构
----------
![](https://docs.nocobase.com/static/NocoBase.c9542b1f.png)


环境要求
----------

Node:

- Node.js 12.20+

Database:

- PostgreSQL 10.x+
- Sqlite 3+

安装 & 运行
----------

### 通过 `create-nocobase-app` 创建项目

#### 快速启动
~~~shell
yarn create nocobase-app my-nocobase-app --quickstart
~~~

#### 分步骤执行
~~~shell
# 1. 创建项目
yarn create nocobase-app my-nocobase-app

# 2. 切换到项目根目录
cd my-nocobase-app

# 3. 初始化数据
yarn nocobase init --import-demo

# 4. 启动项目
yarn start
~~~

使用浏览器打开 http://localhost:8000

### 使用 docker compose

创建 `docker-compose.yml` 文件

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

终端运行

```
docker-compose run nocobase bash -c 'yarn serve init'
docker-compose up -d
```

浏览器内打开 http://localhost:28000

### 参与开发

~~~shell
git clone https://github.com/nocobase/nocobase.git
cd nocobase
cp .env.example .env # 配置数据库信息、APP 端口等
docker-compose up -d postgres # 用 docker 启动数据库
yarn install
yarn bootstrap
yarn build
yarn nocobase init
yarn start
~~~

浏览器内打开 http://localhost:8000
