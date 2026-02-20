---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Iframe-Block

## Einführung

Der Iframe-Block ermöglicht es Ihnen, externe Webseiten oder Inhalte in die aktuelle Seite einzubetten. Sie können externe Anwendungen einfach in die Seite integrieren, indem Sie eine URL konfigurieren oder direkt HTML-Code einfügen. Wenn Sie HTML-Seiten verwenden, können Sie die Inhalte flexibel anpassen, um spezifische Darstellungsanforderungen zu erfüllen. Diese Methode eignet sich besonders für Szenarien, die eine individuelle Darstellung erfordern, da externe Ressourcen ohne Umleitung geladen werden können, was die Benutzererfahrung und die Interaktivität der Seite verbessert.

![20251026205102](https://static-docs.nocobase.com/20251026205102.png)

## Vorlagen-Syntax

Im HTML-Modus unterstützt der Blockinhalt die Verwendung der Syntax der **[Liquid Vorlagen-Engine](https://shopify.github.io/liquid/basics/introduction/)**.

![20251026205331](https://static-docs.nocobase.com/20251026205331.png)

## Variablen-Unterstützung

### Variablen-Unterstützung in HTML

- Sie können Variablen aus dem aktuellen Block-Kontext über den Variablen-Selektor auswählen.
  ![20251026205441](https://static-docs.nocobase.com/20251026205441.png)

- Sie können Variablen per Code in die Anwendung injizieren und verwenden.

Sie können auch benutzerdefinierte Variablen per Code in die Anwendung injizieren und diese im HTML verwenden. Zum Beispiel können Sie eine dynamische Kalenderanwendung mit Vue 3 und Element Plus erstellen:

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

Beispiel: Eine einfache Kalenderkomponente, erstellt mit React und Ant Design (antd), die dayjs zur Datumsverarbeitung verwendet.

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

### Variablen-Unterstützung in URLs

![20251026212608](https://static-docs.nocobase.com/20251026212608.png)

Weitere Informationen zu Variablen finden Sie unter [Variablen](/interface-builder/variables).