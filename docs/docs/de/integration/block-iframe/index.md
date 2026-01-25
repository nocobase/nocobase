---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::



# Iframe-Block

## Einführung

Der Iframe-Block ermöglicht es Ihnen, externe Webseiten oder Inhalte in die aktuelle Seite einzubetten. Sie können externe Anwendungen nahtlos integrieren, indem Sie eine URL konfigurieren oder direkt HTML-Code einfügen. Bei der Verwendung von HTML-Seiten können Sie Inhalte flexibel an spezifische Anzeigeanforderungen anpassen. Diese Methode eignet sich besonders gut für Szenarien, die eine individuelle Darstellung erfordern, da externe Ressourcen ohne Weiterleitung geladen werden können, was die Benutzererfahrung und die Interaktivität der Seite verbessert.

## Installation

Es handelt sich um ein integriertes Plugin, das keine Installation erfordert.

## Blöcke hinzufügen

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Konfigurieren Sie die URL oder den HTML-Code, um die externe Anwendung direkt einzubetten.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Template-Engine

### String-Template

Die Standard-Template-Engine.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Weitere Informationen finden Sie in der Dokumentation zur Handlebars-Template-Engine.

## Variablen übergeben

### HTML-Unterstützung für Variablen-Parsing

#### Unterstützung für die Auswahl von Variablen aus dem Variablen-Selektor im Kontext des aktuellen Blocks

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Unterstützung für das Injizieren und Verwenden von Variablen in der Anwendung per Code

Sie können auch benutzerdefinierte Variablen per Code in die Anwendung injizieren und diese im HTML verwenden. Zum Beispiel, um eine dynamische Kalenderanwendung mit Vue 3 und Element Plus zu erstellen:

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

Beispiel: Eine einfache Kalenderkomponente, erstellt mit React und Ant Design (antd), die dayjs zur Datumsverarbeitung verwendet:

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

### URL unterstützt Variablen

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Weitere Informationen zu Variablen finden Sie in der Variablen-Dokumentation.

## Iframes mit JS-Blöcken erstellen (NocoBase 2.0)

In NocoBase 2.0 können Sie JS-Blöcke verwenden, um Iframes dynamisch und mit mehr Kontrolle zu erstellen. Dieser Ansatz bietet eine größere Flexibilität bei der Anpassung des Verhaltens und der Gestaltung von Iframes.

### Grundlegendes Beispiel

Erstellen Sie einen JS-Block und verwenden Sie den folgenden Code, um einen Iframe zu erstellen:

```javascript
// Erstellt einen Iframe, der den aktuellen Block-Container ausfüllt
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Ersetzt vorhandene Kindelemente, sodass der Iframe der einzige Inhalt ist
ctx.element.replaceChildren(iframe);
```

### Wichtige Punkte

- **`ctx.element`**: Das DOM-Element des aktuellen JS-Block-Containers.
- **`sandbox`-Attribut**: Steuert die Sicherheitsbeschränkungen für den Iframe-Inhalt.
  - `allow-scripts`: Erlaubt dem Iframe, Skripte auszuführen.
  - `allow-same-origin`: Erlaubt dem Iframe, auf seinen eigenen Ursprung zuzugreifen.
- **`replaceChildren()`**: Ersetzt alle Kindelemente des Containers durch den Iframe.

### Erweitertes Beispiel mit Ladezustand

Sie können die Iframe-Erstellung durch Ladezustände und Fehlerbehandlung erweitern:

```javascript
// Zeigt eine Ladeanzeige an
ctx.message.loading('Externe Inhalte werden geladen...');

try {
  // Erstellt den Iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Fügt einen Lade-Event-Listener hinzu
  iframe.addEventListener('load', () => {
    ctx.message.success('Inhalt erfolgreich geladen');
  });

  // Fügt einen Fehler-Event-Listener hinzu
  iframe.addEventListener('error', () => {
    ctx.message.error('Fehler beim Laden des Inhalts');
  });

  // Fügt den Iframe in den Container ein
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Fehler beim Erstellen des Iframes: ' + error.message);
}
```

### Sicherheitsaspekte

Beachten Sie bei der Verwendung von Iframes die folgenden Best Practices für die Sicherheit:

1. **HTTPS verwenden**: Laden Sie Iframe-Inhalte nach Möglichkeit immer über HTTPS.
2. **Sandbox-Berechtigungen einschränken**: Aktivieren Sie nur die notwendigen Sandbox-Berechtigungen.
3. **Content Security Policy**: Konfigurieren Sie entsprechende CSP-Header.
4. **Same-Origin Policy**: Beachten Sie Cross-Origin-Beschränkungen.
5. **Vertrauenswürdige Quellen**: Laden Sie Inhalte nur von vertrauenswürdigen Domains.