# 表单区块

## 介绍

表单区块是用于构建数据输入和编辑界面的重要区块。它具有高度的定制性，基于数据模型来使用相应的组件显示所需的字段。通过联动规则等事件流，表单区块可以动态展示字段。此外，还可以与工作流程结合，实现自动化流程触发和数据处理，进一步提高工作效率或实现逻辑编排。

## 区块配置项

![20240416220148](https://static-docs.nocobase.com/20240416220148.png)

### 联动规则

通过联动规则控制表单字段行为。

![20240416220254](https://static-docs.nocobase.com/20240416220254.png)

更多内容参考 [联动规则](/handbook/ui/blocks/block-settings/field-linkage-rule)

## 配置字段

### 本表字段

** 注意 ** 继承表的字段（父表字段）也会合并显示出来

![20240416230739](https://static-docs.nocobase.com/20240416230739.png)

### 关系表字段

关系表字段在表单中只读，通常配合关系字段一起使用，可以显示关系数据的多个字段值。

![20240416230811](https://static-docs.nocobase.com/20240416230811.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240416231152.mp4" type="video/mp4">
</video>

表单字段配置项可参考 [表单字段](/handbook/ui/fields/generic/form-item)

## 配置操作

![20240417115249](https://static-docs.nocobase.com/20240417115249.png)

- [提交](/handbook/ui/actions/types/submit)
- [触发工作流](/handbook/workflow/manual/triggers/custom-action)
