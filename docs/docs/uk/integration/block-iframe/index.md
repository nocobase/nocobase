---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip Повідомлення про переклад ШІ
Ця документація була автоматично перекладена штучним інтелектом.
:::



# Блок Iframe

## Вступ

Блок Iframe дозволяє вбудовувати зовнішні веб-сторінки або контент у поточну сторінку. Ви можете легко інтегрувати зовнішні застосунки на сторінку, налаштувавши URL або безпосередньо вставивши HTML-код. Використовуючи HTML, ви можете гнучко налаштовувати вміст відповідно до ваших потреб відображення, що робить цей підхід ідеальним для сценаріїв, які вимагають індивідуального представлення. Це дозволяє завантажувати зовнішні ресурси без перенаправлення, покращуючи взаємодію з користувачем та інтерактивність сторінки.

## Встановлення

Це вбудований плагін, встановлення не потрібне.

## Додавання блоків

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Налаштуйте URL або HTML, щоб безпосередньо вбудувати зовнішній застосунок.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Рушій шаблонів

### Рядковий шаблон

Рушій шаблонів за замовчуванням.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Для отримання додаткової інформації зверніться до документації шаблонів Handlebars.

## Передача змінних

### Підтримка парсингу змінних в HTML

#### Підтримка вибору змінних з селектора змінних у поточному контексті блоку

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Підтримка впровадження та використання змінних у застосунку за допомогою коду

Ви також можете впроваджувати власні змінні в застосунок за допомогою коду та використовувати їх в HTML. Наприклад, створіть динамічний календарний застосунок, використовуючи Vue 3 та Element Plus:

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue3 CDN Example</title>
    <script src="https://cdn.bootcdn.net/ajax/libs/vue/3.5.9/vue.global.prod.js"></script>
    <script src="https://unpkg.com/element-plus"></script>
    <script src="https://unpkg.com/element-plus/dist/locale/zh-cn"></script>
    <link
      rel="stylesheet"
      href="https://unpkg.com/element-plus/dist/index.css"
    />
  </head>
  <body>
    <div id="app">
      <el-container>
        <el-main>
          <el-calendar v-model="month">
            <div class="header-container">
              <div class="action-group">
                <span class="month-display">{{ month }}</span>
                <el-button-group>
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(-1)"
                    >Last month</el-button
                  >
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(1)"
                    >Next month</el-button
                  >
                </el-button-group>
              </div>
            </div>
          </el-calendar>
        </el-main>
      </el-container>
    </div>
    <script>
      const { createApp, ref, provide } = Vue;
      const app = createApp({
        setup() {
          const month = ref(new Date().toISOString().slice(0, 7));
          const loading = ref(false);

          const changeMonth = (offset) => {
            const date = new Date(month.value + '-01');
            date.setMonth(date.getMonth() + offset);
            month.value = date.toISOString().slice(0, 7);
          };
          provide('month', month);
          provide('changeMonth', changeMonth);
          return { month, loading, changeMonth };
        },
      });
      app.use(ElementPlus);
      app.mount('#app');
    </script>
  </body>
</html>
```

![20250320163250](https://static-docs.nocobase.com/20250320163250.png)

Приклад: Простий компонент календаря, створений за допомогою React та Ant Design (antd), що використовує dayjs для обробки дат

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React CDN Example</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.css"
    />
    <script src="https://unpkg.com/dayjs/dayjs.min.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        const { useState } = React;
        const { Calendar, Button, Space, Typography } = window.antd;
        const { Title } = Typography;
        const CalendarComponent = () => {
          const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
          const [loading, setLoading] = useState(false);
          const changeMonth = (offset) => {
            const newMonth = dayjs(month)
              .add(offset, 'month')
              .format('YYYY-MM');
            setMonth(newMonth);
          };
          return React.createElement(
            'div',
            { style: { padding: 20 } },
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                },
              },
              React.createElement(Title, { level: 4 }, month),
              React.createElement(
                Space,
                null,
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(-1) },
                  'Last month',
                ),
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(1) },
                  'Next month',
                ),
              ),
            ),
            React.createElement(Calendar, {
              fullscreen: false,
              value: dayjs(month),
            }),
          );
        };
        ReactDOM.createRoot(document.getElementById('app')).render(
          React.createElement(CalendarComponent),
        );
      });
    </script>
  </body>
</html>
```

![20250320164537](https://static-docs.nocobase.com/20250320164537.png)

### URL підтримує змінні

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Для отримання додаткової інформації про змінні зверніться до документації зі змінних.

## Створення Iframe за допомогою JS блоків (NocoBase 2.0)

У NocoBase 2.0 ви можете використовувати JS блоки для динамічного створення iframe, отримуючи більше контролю. Цей підхід забезпечує кращу гнучкість для налаштування поведінки та стилів iframe.

### Базовий приклад

Створіть JS блок і використайте наступний код для створення iframe:

```javascript
// Створюємо iframe, який заповнює контейнер поточного блоку
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Замінюємо наявні дочірні елементи, щоб iframe став єдиним вмістом
ctx.element.replaceChildren(iframe);
```

### Ключові моменти

- **ctx.element**: DOM-елемент контейнера поточного JS блоку
- **атрибут sandbox**: Контролює обмеження безпеки для вмісту iframe
  - `allow-scripts`: Дозволяє iframe виконувати скрипти
  - `allow-same-origin`: Дозволяє iframe отримувати доступ до власного джерела
- **replaceChildren()**: Замінює всі дочірні елементи контейнера на iframe

### Розширений приклад зі станом завантаження

Ви можете покращити створення iframe за допомогою станів завантаження та обробки помилок:

```javascript
// Показуємо повідомлення про завантаження
ctx.message.loading('Завантаження зовнішнього вмісту...');

try {
  // Створюємо iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Додаємо слухач подій завантаження
  iframe.addEventListener('load', () => {
    ctx.message.success('Вміст успішно завантажено');
  });

  // Додаємо слухач подій помилок
  iframe.addEventListener('error', () => {
    ctx.message.error('Не вдалося завантажити вміст');
  });

  // Вставляємо iframe в контейнер
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Помилка при створенні iframe: ' + error.message);
}
```

### Міркування безпеки

При використанні iframe враховуйте наступні найкращі практики безпеки:

1. **Використовуйте HTTPS**: Завжди завантажуйте вміст iframe через HTTPS, коли це можливо
2. **Обмежте дозволи Sandbox**: Вмикайте лише необхідні дозволи sandbox
3. **Політика безпеки вмісту (CSP)**: Налаштуйте відповідні заголовки CSP
4. **Політика одного джерела**: Зверніть увагу на міждоменні обмеження
5. **Надійні джерела**: Завантажуйте вміст лише з надійних доменів