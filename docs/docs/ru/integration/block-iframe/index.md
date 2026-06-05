---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip Уведомление о переводе ИИ
Эта документация была автоматически переведена ИИ.
:::



# Блок Iframe

## Введение

Блок Iframe позволяет встраивать внешние веб-страницы или контент на текущую страницу. Вы можете легко интегрировать внешние приложения, настроив URL или напрямую вставив HTML-код. При использовании HTML-страниц вы получаете гибкость в настройке контента для удовлетворения конкретных потребностей отображения, что делает этот подход идеальным для сценариев с индивидуальным представлением. Такой способ позволяет загружать внешние ресурсы без перенаправления, улучшая пользовательский опыт и интерактивность страницы.

## Установка

Это встроенный плагин, установка не требуется.

## Добавление блоков

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Настройте URL или HTML, чтобы напрямую встроить внешнее приложение.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Шаблонный движок

### Строковый шаблон

Шаблонный движок по умолчанию.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Дополнительную информацию смотрите в документации по шаблонам Handlebars.

## Передача переменных

### Поддержка парсинга переменных в HTML

#### Поддержка выбора переменных из селектора переменных в контексте текущего блока

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Поддержка внедрения и использования переменных в приложении с помощью кода

Вы также можете внедрять пользовательские переменные в приложение с помощью кода и использовать их в HTML. Например, создайте динамическое календарное приложение, используя Vue 3 и Element Plus:

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

Пример: Простой компонент календаря, созданный с помощью React и Ant Design (antd), использующий dayjs для работы с датами.

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

### URL поддерживает переменные

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Дополнительную информацию о переменных смотрите в документации по переменным.

## Создание Iframe с помощью JS-блоков (NocoBase 2.0)

В NocoBase 2.0 вы можете использовать JS-блоки для динамического создания iframe, получая при этом больше контроля. Этот подход обеспечивает большую гибкость для настройки поведения и стилей iframe.

### Базовый пример

Создайте JS-блок и используйте следующий код для создания iframe:

```javascript
// 创建一个填充当前区块容器的 iframe
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// 替换现有子元素,使 iframe 成为唯一内容
ctx.element.replaceChildren(iframe);
```

### Ключевые моменты

- **`ctx.element`**: DOM-элемент контейнера текущего JS-блока
- **атрибут `sandbox`**: Управляет ограничениями безопасности для содержимого iframe
  - `allow-scripts`: Разрешает iframe выполнять скрипты
  - `allow-same-origin`: Разрешает iframe доступ к собственному источнику
- **`replaceChildren()`**: Заменяет все дочерние элементы контейнера на iframe

### Расширенный пример с состоянием загрузки

Вы можете улучшить создание iframe, добавив состояния загрузки и обработку ошибок:

```javascript
// 显示加载提示
ctx.message.loading('正在加载外部内容...');

try {
  // 创建 iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // 添加加载事件监听器
  iframe.addEventListener('load', () => {
    ctx.message.success('内容加载成功');
  });

  // 添加错误事件监听器
  iframe.addEventListener('error', () => {
    ctx.message.error('加载内容失败');
  });

  // 将 iframe 插入容器
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('创建 iframe 出错: ' + error.message);
}
```

### Вопросы безопасности

При использовании iframe учитывайте следующие рекомендации по обеспечению безопасности:

1.  **Используйте HTTPS**: По возможности всегда загружайте содержимое iframe по HTTPS.
2.  **Ограничьте разрешения `sandbox`**: Включайте только необходимые разрешения `sandbox`.
3.  **Политика безопасности контента (CSP)**: Настройте соответствующие заголовки CSP.
4.  **Политика одного источника**: Учитывайте ограничения междоменных запросов.
5.  **Надежные источники**: Загружайте контент только из доверенных доменов.