# 事件流

## 介绍

如果你想在某个表单变更时触发一些自定义的操作，就可以使用事件流来实现。除了表单之外，页面、区块、按钮和字段都可以使用事件流来配置一些自定义的操作。

## 如何使用

下面会以一个简单的例子，来说明如何配置事件流。让我们来实现两个表格之间的联动，当点击左侧表格的某一行时，自动筛选右侧表格的数据。

![20251031092211_rec_](https://static-docs.nocobase.com/20251031092211_rec_.gif)

配置步骤如下：

1. 点击左侧表格区块右上角的“闪电”图标，打开事件流配置界面。
![20251031092425](https://static-docs.nocobase.com/20251031092425.png)
2. 点击“添加事件流（Add event flow）”，“触发事件”选择“行点击”，表示当点击表格行时触发。
![20251031092637](https://static-docs.nocobase.com/20251031092637.png)
3. 配置“执行时机”，用于控制这条事件流相对于系统内置流程的先后顺序。一般保持默认即可；如果希望在内置逻辑执行完后再提示/跳转，可选择“所有流之后”。更多说明见下文 [执行时机](#执行时机)。
![event-flow-event-flow-20260204](https://static-docs.nocobase.com/event-flow-event-flow-20260204.png)
4. “触发条件（Trigger condition）”是用来配置条件的，当满足条件时才会触发事件流。这里我们不需要配置，只要点击行都会触发事件流。
![20251031092717](https://static-docs.nocobase.com/20251031092717.png)
5. 鼠标悬浮到“添加步骤（Add step）”，可以添加一些操作步骤。我们选“设置数据范围（Set data scope）”，来设置右侧表格的数据范围。
![20251031092755](https://static-docs.nocobase.com/20251031092755.png)
6. 复制右侧表格的 UID，填入 “目标区块 UID（Target block UID）”输入框。下面会立即显示一个条件配置界面，这里可以配置右侧表格的数据范围。
![20251031092915](https://static-docs.nocobase.com/20251031092915.png)
7. 让我们来配置一个条件，如下图所示：
![20251031093233](https://static-docs.nocobase.com/20251031093233.png)
8. 配置完数据范围，还需要刷新区块才会显示筛选的结果。接下来让我们来配置刷新右侧表格区块。添加一个“刷新目标区块（Refresh target blocks）”步骤，然后填入右侧表格的 UID。
![20251031093150](https://static-docs.nocobase.com/20251031093150.png)
![20251031093341](https://static-docs.nocobase.com/20251031093341.png)
9. 最后点击右下角的保存按钮，配置就完成了。

## 事件详解

### 渲染前

通用事件，在页面、区块、按钮或者字段中都可以使用。在这个事件中，可以做一些初始化的工作。比如在不同的条件下，配置不同的数据范围。

### 行点击（Row click）

表格区块专属事件。当点击表格行时触发。触发时会在上下文中增加一个 Clicked row record，可以作为变量在条件和步骤中使用。

### 表单值变更（Form values change）

表单区块专属事件。当表单字段的值变更时触发。可以在条件和步骤中通过“Current form”变量来获取表单的值。

### 点击（Click）

按钮的专属事件。当点击按钮时触发。

## 执行时机

在事件流配置里，有两个容易混淆的概念：

- **触发事件：** 什么时候开始执行（例如：渲染前、行点击、点击、表单值变更等）。
- **执行时机：** 同一个触发事件发生后，你这条**自定义事件流**要插入到**内置流程**的哪个位置执行。

### 什么是“内置流程/内置步骤”？

很多页面、区块或操作本身就带有一套系统内置的处理流程（例如：提交、打开弹窗、请求数据等）。当你为同一个事件（例如“点击”）新增自定义事件流时，“执行时机”用来决定：

- 先执行你的事件流，还是先执行内置逻辑；
- 或者把你的事件流插入到内置流程的某一步前后执行。

### UI 里的执行时机选项怎么理解？

- **所有流之前（默认）：** 最先执行。适合做“拦截/准备”（例如校验、二次确认、初始化变量等）。
- **所有流之后：** 内置逻辑完成后再执行。适合做“收尾/反馈”（例如提示消息、刷新其他区块、跳转页面等）。
- **指定流之前 / 指定流之后：** 更精细的插入点。选择后需要再选具体的“内置流程”。
- **指定流步骤之前 / 指定流步骤之后：** 最精细的插入点。选择后需要同时选择“内置流程”和“内置流程步骤”。

> 提示：如果你不确定该选哪个内置流程/步骤，优先使用前两项（“之前 / 之后”）即可。

## 步骤详解

### 自定义变量（Custom variable）

用来自定义一个变量，然后在上下文中使用。

#### 作用域

自定义的变量有作用域，比如在区块的事件流中定义的变量只能用在这个区块中。如果想在当前页面中所有的区块中都能用，则需要在页面中的事件流进行配置。

#### 表单变量（Form variable）

使用某个表单区块的值作为变量来使用。具体配置如下：

![20251031093516](https://static-docs.nocobase.com/20251031093516.png)

- Variable title：变量标题
- Variable identifier：变量标识
- Form UID：表单 UID

#### 其它变量

后续会陆续支持其它变量，敬请期待。

### 设置数据范围（Set data scope）

设置目标区块的数据范围。具体配置如下：

![20251031093609](https://static-docs.nocobase.com/20251031093609.png)

- Target block UID：目标区块 UID
- Condition：筛选条件

### 刷新目标区块（Refresh target blocks）

刷新目标区块，允许配置多个区块。具体配置如下：

![20251031093657](https://static-docs.nocobase.com/20251031093657.png)

- Target block UID：目标区块 UID

### 导航到 URL（Navigate to URL）

跳转到某个 URL。具体配置如下：

![20251031093742](https://static-docs.nocobase.com/20251031093742.png)

- URL：目标 URL，支持使用变量
- Search parameters：URL 中的查询参数
- Open in new window：如果勾选，会在跳转时打开一个新的浏览器页面

### 显示消息（Show message）

全局展示操作反馈信息。

#### 何时使用

- 可提供成功、警告和错误等反馈信息。
- 顶部居中显示并自动消失，是一种不打断用户操作的轻量级提示方式。

#### 具体配置

![20251031093825](https://static-docs.nocobase.com/20251031093825.png)

- Message type：提示类型
- Message content：提示内容
- Duration：持续多长时间，单位秒

### 显示通知（Show notification）

全局展示通知提醒信息。

#### 何时使用

在系统四个角显示通知提醒信息。经常用于以下情况：

- 较为复杂的通知内容。
- 带有交互的通知，给出用户下一步的行动点。
- 系统主动推送。

#### 具体配置

![20251031093934](https://static-docs.nocobase.com/20251031093934.png)

- Notification type：通知类型
- Notification title：通知标题
- Notification description：通知描述
- Placement：位置，可选项有：左上、右上、左下、右下

### 执行 JavaScript（Execute JavaScript）

![20251031094046](https://static-docs.nocobase.com/20251031094046.png)

执行 JavaScript 代码。

## 示例

### 表单：调用第三方 API 回填字段

场景：在表单中触发事件流，请求第三方 API，拿到数据后自动回填到表单字段。

配置步骤：

1. 在表单区块中打开事件流配置，新增一条事件流；
2. 触发事件选择“渲染前”；
3. 执行时机选择“所有流之后”；
4. 添加步骤“执行 JavaScript（Execute JavaScript）”，粘贴并按需修改下面代码：

```js
const res = await ctx.api.request({
  method: 'get',
  url: 'https://jsonplaceholder.typicode.com/users/2',
  skipNotify: true,
  // Note: ctx.api will include the current NocoBase authentication/custom headers by default
  // Here we override it with an "empty Authorization" to avoid sending the token to a third party
  headers: {
    Authorization: 'Bearer ',
  },
});

const username = res?.data?.username;

// replace it with actual field name
ctx.form.setFieldsValue({ username });
```
