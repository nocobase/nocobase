---
pkg: "@nocobase/plugin-block-iframe"
---






# Блок Iframe

## Введение

Блок IFrame позволяет встраивать внешние веб-страницы или контент в текущую страницу. Пользователи могут бесшовно интегрировать внешние приложения, настроив URL или напрямую вставив HTML-код. С HTML пользователи могут гибко настраивать контент под конкретные требования отображения, что делает подход удобным для кастомных сценариев. Такой метод позволяет загружать внешние ресурсы без перенаправления, улучшая пользовательский опыт и интерактивность страницы.

## Установка

Это встроенный плагин, установка не требуется.

## Добавление блоков

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Настройте URL или Html, чтобы напрямую встроить внешнее приложение.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Движок шаблонов

### Строковый шаблон

Шаблонный движок по умолчанию.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Подробнее см. в документации шаблонов Handlebars.

## Передача переменных

### Поддержка HTML для парсинга переменных

#### Поддержка выбора переменных из селектора переменных в контексте текущего блока

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Поддержка внедрения переменных в приложение и использования их через код

Вы также можете внедрять пользовательские переменные в приложение через код и использовать их в HTML. Например, создание динамического календаря с использованием Vue 3 и Element Plus:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue3 CDN Example</title>
    <script src="https://unpkg.com/vue@3.5.9/dist/vue.global.prod.js"></script>
    <script src="https://unpkg.com/element-plus"></script>
    <script src="https://unpkg.com/element-plus/dist/locale/en.min.js"></script>
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

Пример: простой компонент календаря на React и Ant Design (antd), с использованием dayjs для работы с датами

```html
<!doctype html>
<html lang="en">
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

### URL поддерживает переменные

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Подробнее о переменных см. документацию Переменных.

## Создание iframe через JS-блоки (NocoBase 2.0)

В NocoBase 2.0 вы можете использовать JS-блоки, чтобы динамически создавать iframes с большим контролем. Такой подход обеспечивает лучшую гибкость для настройки поведения и стилей iframe.

### Базовый пример

Создайте JS-блок и используйте следующий код, чтобы создать iframe:

```javascript
// Создать iframe, который заполняет текущий контейнер блока
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Заменить существующие дочерние элементы, чтобы iframe был единственным содержимым
ctx.element.replaceChildren(iframe);
```

### Ключевые моменты

- **ctx.element**: DOM-элемент контейнера текущего JS-блока
- **sandbox attribute**: управляет ограничениями безопасности для содержимого iframe
  - `allow-scripts`: разрешает выполнение скриптов внутри iframe
  - `allow-same-origin`: позволяет iframe обращаться к собственному origin
- **replaceChildren()**: заменяет всех дочерних элементов контейнера на iframe

### Продвинутый пример со статусом загрузки

Вы можете дополнить создание iframe статусами загрузки и обработкой ошибок:

```javascript
// Показать сообщение о загрузке
ctx.message.loading('Loading external content...');

try {
  // Создать iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Добавить обработчик события загрузки
  iframe.addEventListener('load', () => {
    ctx.message.success('Content loaded successfully');
  });

  // Добавить обработчик события ошибки
  iframe.addEventListener('error', () => {
    ctx.message.error('Failed to load content');
  });

  // Вставить iframe в контейнер
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Error creating iframe: ' + error.message);
}
```

### Соображения безопасности

При использовании iframes учитывайте следующие рекомендации безопасности:

1. **Используйте HTTPS**: по возможности всегда загружайте содержимое iframe по HTTPS
2. **Ограничивайте права sandbox**: включайте только необходимые разрешения sandbox
3. **Политика безопасности контента (CSP)**: настраивайте корректные заголовки CSP
4. **Политика одинакового источника (Same-Origin Policy)**: учитывайте ограничения междоменного доступа
5. **Доверенные источники**: загружайте контент только с доверенных доменов