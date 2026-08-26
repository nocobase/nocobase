# Markdown 区块技巧

Markdown 区块是我们最常用且功能强大的区块之一。它从轻量级文本提示到简单的 HTML 样式，甚至可以承担重要的业务逻辑，功能多样而灵活。

## 一、Markdown 区块的基本功能

由于 Markdown 区块具有灵活、公开和随时可更改的特点，它常被用于展示系统公告。无论是业务模块、功能、区块还是字段，我们都可以像小便利贴一样，随时贴上我们想要的小提示。

在使用 Markdown 区块之前，建议先熟悉 Markdown 的排版和语法。可以参考 [Vditor 示例](https://docs.nocobase.com/api/field/markdown-vditor)。

> 注意：页面中的 Markdown 区块相对轻量，某些功能（如数学公式、脑图等）暂时不支持渲染。但我们可以使用 HTML 实现，系统中也提供了 Vditor 的字段组件，欢迎体验。

### 1.1 页面示例

我们可以在系统“在线Demo”的页面观察 Markdown 的使用，具体可以查看首页、订单页以及“更多示例”。

例如我们首页的警告、提示：
![20250227085425](https://static-docs.nocobase.com/20250227085425.png)

订单模块的计算逻辑：
![20250227085536](https://static-docs.nocobase.com/20250227085536.png)

更多示例里面的引导和图片：
![20250227085730](https://static-docs.nocobase.com/20250227085730.png)

通过切换编辑模式，我们可以随时更改 Markdown 内容，观察页面变化。
![20250227085855](https://static-docs.nocobase.com/20250227085855.png)

### 1.2 创建 Markdown 区块

在页面、弹窗和表单中，我们都可以灵活地创建 Markdown 区块。

#### 创建方式

- **弹窗/页面中创建：**

  ![弹窗/页面中的 Markdown 区块](https://static-docs.nocobase.com/20250227091156.png)
- **表单区块中创建：**

  ![表单中的 Markdown 区块](https://static-docs.nocobase.com/20250227091309.png)

#### 用法示例

通过 Markdown 语法输入 `---` 可模拟分组横线，实现简单的内容分隔效果，如下所示：

![分隔示例1](https://static-docs.nocobase.com/20250227092156.png)
![分隔示例2](https://static-docs.nocobase.com/20250227092236.png)

---

## 二、个性化内容展示

Markdown 区块的另一大优势在于支持系统变量填充，帮助生成个性化标题和提示信息，从而确保每位用户在各自的表单中看到独特的信息展示。

![个性化展示1](https://static-docs.nocobase.com/20250227092400.png)
![个性化展示2](https://static-docs.nocobase.com/20250227092430.png)

此外，还可以结合表单数据进行简单的内容排版，如下示例所示：

**突出标题示例：**

```markdown
# #{{$nRecord.id}} {{$nPopupRecord.task_name}}

---
```

![突出标题效果](https://static-docs.nocobase.com/20250227164055.png)

**居中分隔示例：**

![居中字段效果](https://static-docs.nocobase.com/20250227164456.png)

## 三、丰富内容的填充

在逐渐熟悉 Markdown 语法和变量的同时，我们还可以在 Markdown 区块中填充更丰富的内容，比如 HTML！

### 3.1 HTML 示例

如果你没有接触过HTML 语法，可以让 Deepseek 帮我们代写（注意不支持 `script` 标签，推荐所有样式写在局部的 `div` 中）。

以下是一个华丽的公告示例：

```html
<div style="font-family: 'Arial', sans-serif; background-color: #e9f5ff; margin: 20px; padding: 20px; border: 2px solid #007bff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #007bff; text-align: center; font-size: 2em; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);">Join Us for a Fun Getaway!</h1>
    <p style="font-size: 1.2em; line-height: 1.6; color: #333;">Hi Everyone,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We're excited to invite you to an awesome group outing filled with laughter, adventure, and great vibes!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Mark your calendars for <span style="color: red; font-weight: bold; font-size: 1.5em;">November 10, 2025</span>, and get ready to explore, relax, and enjoy some quality time together.</p>
    <p style="font-size: 1.2em; line-height: 1.6;">We'll share more details about the itinerary and meeting spot soon—stay tuned!</p>
    <p style="font-size: 1.2em; line-height: 1.6; font-style: italic;">Can't wait to see you there!</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Cheers,</p>
    <p style="font-size: 1.2em; line-height: 1.6;">Your Event Team</p>
</div>

```

![20250227092832](https://static-docs.nocobase.com/20250227092832.png)

![20250227093003](https://static-docs.nocobase.com/20250227093003.png)

### 3.2 动画效果示例

我们甚至可以结合 CSS 实现简单的动画效果，类似幻灯片的动态显示隐藏（试着将以下代码粘贴到 Markdown 里看看！）：

```html
<div style="background-color: #f8e1e1; border: 2px solid #d14; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); animation: fadeInOut 3s infinite;">
    <h2 style="color: #d14; font-family: 'Arial', sans-serif;">🎉 Special Announcement 🎉</h2>
    <p style="color: #333; font-size: 18px; font-family: 'Georgia', serif;">Thank you for your support and attention! We will hold a special event next Monday, stay tuned!</p>
    <button style="background-color: #d14; color: white; border: none; border-radius: 5px; padding: 10px 20px; cursor: pointer;">Click to Learn More</button>
</div>

<style>
@keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(-20px); }
    10%, 90% { opacity: 1; transform: translateY(0); }
}
</style>

```

![](https://static-docs.nocobase.com/202502270933fade-out.gif)
