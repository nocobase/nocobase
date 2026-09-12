# Приёмы работы с Markdown-блоками

Markdown-блок — один из самых востребованных и мощных блоков. Он используется и для лёгких текстовых подсказок, и для простого HTML-оформления, и даже для важной бизнес-логики. Многофункциональный и гибкий.

## I. Базовые возможности Markdown-блока

Благодаря гибкости, открытости и возможности менять контент в любой момент Markdown-блок часто применяют для системных объявлений. Куда бы Вы его ни поставили — в бизнес-модуль, на страницу, в форму, в другой блок или к полю — он работает как стикер: повесил подсказку и забыл.

Перед использованием Markdown-блока полезно вспомнить базовый синтаксис Markdown. См. [пример Vditor](https://docs.nocobase.com/api/field/markdown-vditor).

> Внимание: Markdown-блок на странице относительно лёгкий и не поддерживает рендеринг некоторых функций (например, математические формулы и mind map). Их можно реализовать через HTML, а в системе также есть компонент поля Vditor — рекомендуем попробовать.

### 1.1 Пример страницы

В системе на «Online Demo» можно посмотреть, как используется Markdown — на главной, странице заказов и в разделе «Больше примеров».

Например, предупреждения и подсказки на главной:
![20250227085425](https://static-docs.nocobase.com/20250227085425.png)

Логика расчётов в модуле заказов:
![20250227085536](https://static-docs.nocobase.com/20250227085536.png)

Подсказки и картинки в разделе примеров:
![20250227085730](https://static-docs.nocobase.com/20250227085730.png)

Переключитесь в режим редактирования — содержимое Markdown можно менять в любой момент и сразу видеть результат на странице.
![20250227085855](https://static-docs.nocobase.com/20250227085855.png)

### 1.2 Создание Markdown-блока

Markdown-блок можно гибко добавлять на страницы, во всплывающие окна и в формы.

#### Способы создания

- **Во всплывающем окне или на странице:**

  ![Markdown-блок во всплывающем окне/на странице](https://static-docs.nocobase.com/20250227091156.png)
- **В блоке формы:**

  ![Markdown-блок в форме](https://static-docs.nocobase.com/20250227091309.png)

#### Примеры использования

С помощью Markdown-синтаксиса `---` можно изобразить разделительную линию для группировки контента:

![Пример разделителя 1](https://static-docs.nocobase.com/20250227092156.png)
![Пример разделителя 2](https://static-docs.nocobase.com/20250227092236.png)

---

## II. Персонализированный контент

Ещё одна сильная сторона Markdown-блока — поддержка системных переменных, что позволяет генерировать индивидуальные заголовки и подсказки. У каждого пользователя в его форме появляется уникальный контент.

![Персонализация 1](https://static-docs.nocobase.com/20250227092400.png)
![Персонализация 2](https://static-docs.nocobase.com/20250227092430.png)

Дополнительно можно комбинировать переменные с данными формы для простой вёрстки. Пример:

**Пример выделенного заголовка:**

```markdown
# #{{$nRecord.id}} {{$nPopupRecord.task_name}}

---
```

![Эффект выделенного заголовка](https://static-docs.nocobase.com/20250227164055.png)

**Пример центрирования и разделения:**

![Эффект выровненного по центру поля](https://static-docs.nocobase.com/20250227164456.png)

## III. Богатый контент

По мере освоения синтаксиса и переменных в Markdown-блок можно вставлять и более богатый контент, например HTML!

### 3.1 Пример HTML

Если Вы не знакомы с HTML, попросите Deepseek помочь (учтите, что тег `script` не поддерживается; рекомендуется задавать стили локально внутри `div`).

Пример красивого объявления:

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

### 3.2 Пример анимации

Можно даже комбинировать с CSS, чтобы реализовать простые анимации — что-то вроде слайд-шоу с плавным появлением и исчезновением (попробуйте вставить этот код в Markdown):

```html
<div style="background-color: #f8e1e1; border: 2px solid #d14; border-radius: 10px; padding: 20px; text-align: center; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2); animation: fadeInOut 3s infinite;">
    <h2 style="color: #d14; font-family: 'Arial', sans-serif;">Special Announcement</h2>
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
