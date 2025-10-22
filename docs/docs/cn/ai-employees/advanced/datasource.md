# 进阶

## 介绍

在 AI 员工插件中可以配置数据源，预设一些数据表查询，然后在与 AI 员工对话时作为应用上下文发送，AI 员工根据数据表查询结果来进行回答。

## 数据源配置

进入 AI 员工插件配置页面，点击 `Data source` 标签页，进入 AI 员工数据源管理页。

![20251022103526](https://static-docs.nocobase.com/20251022103526.png)

点击 `Add data source` 按钮，进入数据源创建页面。

第一步，输入`Collection`基本信息：
- 在 `Title` 输入框中输入数据源易于记忆的名称；
- 在 `Collection` 输入框中选择要使用的数据源和数据表；
- 在 `Description` 输入框中输入数据源的描述信息。
- 在 `Limit` 输入框中输入数据源的查询限制数，避免返回过多数据超出 AI 对话上下文。

![20251022103935](https://static-docs.nocobase.com/20251022103935.png)

第二步，选择要查询的字段：

在 `Fields` 列表中勾选要查询的字段。

![20251022104516](https://static-docs.nocobase.com/20251022104516.png)

第三步，设置查询条件：

![20251022104635](https://static-docs.nocobase.com/20251022104635.png)

第四步，设置排序条件：

![20251022104722](https://static-docs.nocobase.com/20251022104722.png)

最后，在保存数据源前，可以预览数据源查询结果

![20251022105012](https://static-docs.nocobase.com/20251022105012.png)

## 在对话中发送数据源

在 AI 员工对话框中，点击左下角 `Add work context` 按钮，选择`Data source`，可以看到刚才添加的数据源。

![20251022105240](https://static-docs.nocobase.com/20251022105240.png)

勾选要发送的数据源，选中数据源会附加在对话框中。

![20251022105401](https://static-docs.nocobase.com/20251022105401.png)

输入提问消息后和发送消息一样，点击发送按钮，AI 员工会基于数据源回复。

数据源也会出现在消息列表中。

![20251022105611](https://static-docs.nocobase.com/20251022105611.png)

## 注意

数据源会根据当前用户 ACL 权限自动过滤用户有访问权限的数据。
