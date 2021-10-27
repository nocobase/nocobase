---
title: 项目安装启动流程
order: 3
group:
  title: 内核原理
  path: /guide/core
  order:  6
---

# 项目安装启动流程

## 项目安装

```bash
yarn nocobase init
```

- app.constructor()
- app.parse()
  - yarn nocobase init  
    初始化安装
    - app.load()  
      加载配置
      - app.emitAsync('beforeLoad')  
        所有配置加载之前的钩子
      - app.pluginManager.load()  
        按顺序载入所有激活的插件的配置
        - 加载 plugin-collections 的配置
        - 添加 app.on('init') 监听
          - db.getModel('collections').load()  
            把 collections 表的配置都导入 db.table()
          - app.db.sync({force: false})  
            再执行 sync，创建 collections 表里配置的数据表
      - app.emitAsync('afterLoad')  
        所有配置加载之后的钩子
      - app.db.sync({force: true})  
        根据配置生成数据表、字段、索引等
      - app.emitAsync('init')  
        执行所有 init listeners，一般是初始化的数据操作
        - 触发 plugin-collections 的 init 事件，数据表就创建好了
      - app.stop()  
        结束

## 项目启动

```bash
yarn nocobase start --init --sync
# --init 用于启动时快捷安装
# --sync 开发环境时，当 app.collection() 有更新时快速建表或更新表
```



- app.constructor()
- app.parse()
  - yarn nocobase start  
    初始化安装
    - app.load()  
      加载配置
      - app.emitAsync('beforeLoad')  
        所有配置加载之前的钩子
      - app.pluginManager.load()
        按顺序载入所有激活的插件的配置
        - 加载 plugin-collections 的配置
          - 添加 app.on('start') 监听
          - db.getModel('collections').load()  
            把 collections 表的配置都导入 db.table()，在 start 流程里不需要再 db.sync
      - app.emitAsync('afterLoad')  
        所有配置加载之后的钩子
      - app.db.sync({force: false})  
        yarn nocobase start --sync 有更新时快速建表或更新表  
        yarn nocobase start --init 快捷 init
      - app.emitAsync('init')  
        yarn nocobase start --init 快捷 init
      - app.emitAsync('start')  
        执行所有 start listeners，一般是从数据表里读取一些必要的数据
      - app.listen()
        启动 http server
