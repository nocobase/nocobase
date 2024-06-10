# SchemaInitializerItem 组件

## 介绍

这里的组件指的是如下图所示的一个个选项：

![20240610180325](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20240610180325.png)

点击其中某个选项，可以在页面中增加相应的元素，比如区块、操作按钮、字段等。

![20240610180436](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20240610180436.gif)

## 示例

比如表格区块中的“Add new”选项（如下图所示），其底层所用的组件就是 [ActionInitializerItem](./action-initializer-item) 。

![20240610182445](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20240610182445.png)

具体的代码如下所示：
  
```tsx | pure
/**
 * 基于 ActionInitializerItem 封装的一个组件
 */
export const CreateActionInitializer = () => {
  const schema = {
    type: 'void',
    'x-action': 'create',
    'x-acl-action': 'create',
    title: "{{t('Add new')}}",
    'x-toolbar': 'ActionSchemaToolbar',
    'x-settings': 'actionSettings:addNew',
    'x-component': 'Action',
    'x-decorator': 'ACLActionProvider',
    'x-component-props': {
      openMode: 'drawer',
      type: 'primary',
      component: 'CreateRecordAction',
      icon: 'PlusOutlined',
    },
    properties: {
      ...others,
    },
  };
  return <ActionInitializerItem schema={schema} />;
};

// 最终会被添加到 SchemaInitializer 实例中
const addNewOption = {
  type: 'item',
  title: "{{t('Add new')}}",
  name: 'addNew',
  Component: CreateActionInitializer,
  ...others,
}
```

参考：[ActionInitializerItem](./action-initializer-item) 。
