---
order: 2
---

# 插件化接口有哪些？

插件是按功能划分的可插拔的独立模块，为了以插件的方式扩展功能，需要实现扩展功能的添加和删除方法。  
NocoBase 的插件化接口主要有：

## 中间件

- 添加：app.use()
- 删除：app.unuse() 暂未实现，可以直接操作 app.middleware 数组来移除

## 事件

- 添加：app.on()
- 删除：app.removeListener()

## 资源

- 添加：app.resource()
- 删除：暂无

## 操作

- 添加：app.actions()
- 删除：暂无

## 数据表

- 添加：app.collection()
- 删除：暂无

## 组件（前端）

- 添加 createRouteSwitch、createCollectionField、createSchemaComponent
- 删除：暂无

<Alert title="注意">

目前 NocoBase 的插件化机制还不完善，不能完全实现热插拔。前端的扩展还得依赖开发手动处理再重新构建。

</Alert>


