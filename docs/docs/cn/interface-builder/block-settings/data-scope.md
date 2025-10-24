# 设置数据范围

## 介绍

设置数据范围是指为数据区块定义默认筛选条件，用户可以根据不同的需求灵活调整区块的数据范围。

## 使用手册

![20240407180322](https://static-docs.nocobase.com/20240407180322.png)

筛选字段支持选择本表字段、关系表字段（最多三层关系）。

![20240422113637](https://static-docs.nocobase.com/20240422113637.png)

### 操作符

不同类型的字段支持不同的操作符，例如文本字段支持等于、不等于、包含等操作符，数字字段支持大于、小于等操作符，日期字段则支持在范围内、在特定日期之前等操作符。

![20240424154003](https://static-docs.nocobase.com/20240424154003.png)

### 静态值

示例：订单「状态」为「已发货」。

 <video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240415204206.mp4" type="video/mp4">
</video>

### 变量值

示例：「发货日期」早于「昨天」。

![20240422090134](https://static-docs.nocobase.com/20240422090134.png)

 <video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240415214709.mp4" type="video/mp4">
</video>

更多关于变量内容参考 [变量](/handbook/ui/variables)
