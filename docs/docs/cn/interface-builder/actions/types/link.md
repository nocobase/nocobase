# 链接

## 介绍

链接操作以路由跳转的形式，支持传入变量，目标页面可根据传入的数据动态调整内容，支持在数据区块中配置使用。

![20240603150755](https://static-docs.nocobase.com/20240603150755.png)

## 操作配置项

![20240603150823](https://static-docs.nocobase.com/20240603150823.png)

### 编辑链接

![20240603150944](https://static-docs.nocobase.com/20240603150944.png)

![20240603224322](https://static-docs.nocobase.com/20240603224322.png)

### 使用场景

示例：作者表和文章表是一对多的关系，在作者表格的中配置「查看作者文章」的链接操作。点击该链接后，将作者的 ID 作为参数传递给文章表格。目标页面的文章表格根据传入的作者 ID 过滤文章列表。

![20240603151934](https://static-docs.nocobase.com/20240603151934.png)

### 新窗口打开

勾选「新窗口打开」后，链接将在新窗口中打开。

![20240718160541](https://static-docs.nocobase.com/20240718160541.png)

完整配置示例如下：

<video width="100%" height="440" controls>

 <source src="https://static-docs.nocobase.com/20240603224044.mp4" type="video/mp4">

</video>


- [编辑按钮](/handbook/ui/actions/action-settings/edit-button)：编辑按钮的标题、颜色、图标；
- [联动规则](/handbook/ui/actions/action-settings/linkage-rule)：动态控制按钮状态；
