---
order: 3
---

# 项目安装和启动流程

## app.init

- app.load()
- db.sync()
- db.emitAsync('init')

## app.start

- app.load()
- db.emitAsync('start')
  - 加载数据库里的 collections 配置
  - 加载数据库里的 pm 配置
    - 启动激活的插件
- app.listen()

