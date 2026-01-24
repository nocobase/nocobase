---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



pkg: "@nocobase/plugin-block-iframe"
---

# Iframe-block

## Introduktion

Iframe-blocket låter dig bädda in externa webbsidor eller innehåll på den aktuella sidan. Du kan enkelt integrera externa applikationer på sidan genom att konfigurera en URL eller direkt infoga HTML-kod. När du använder HTML kan du flexibelt anpassa innehållet för att möta specifika visningsbehov. Detta gör det idealiskt för scenarier som kräver anpassad presentation, då det möjliggör laddning av externa resurser utan omdirigering, vilket förbättrar användarupplevelsen och sidans interaktivitet.

## Installation

Det är en inbyggd plugin, ingen installation krävs.

## Lägga till block

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Konfigurera URL:en eller HTML för att direkt bädda in den externa applikationen.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Mallmotor

### Strängmall

Standardmallmotorn.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

För mer information, se dokumentationen för Handlebars mallmotor.

## Skicka variabler

### HTML-stöd för variabeltolkning

#### Stöd för att välja variabler från variabelväljaren i det aktuella blockets kontext

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Stöd för att injicera variabler i applikationen och använda dem via kod

Du kan också injicera anpassade variabler i applikationen via kod och använda dem i HTML. Till exempel, skapa en dynamisk kalenderapplikation med Vue 3 och Element Plus:

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

Exempel: En enkel kalenderkomponent skapad med React och Ant Design (antd), som använder dayjs för att hantera datum.

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

### URL stöder variabler

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

För mer information om variabler, se variabeldokumentationen.

## Skapa Iframes med JS-block (NocoBase 2.0)

I NocoBase 2.0 kan du använda JS-block för att dynamiskt skapa iframes och därmed få mer kontroll. Denna metod ger större flexibilitet för att anpassa iframe-beteende och -stil.

### Grundläggande exempel

Skapa ett JS-block och använd följande kod för att skapa en iframe:

```javascript
// Skapa en iframe som fyller den aktuella blockbehållaren
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Ersätt befintliga underordnade element så att iframen blir det enda innehållet
ctx.element.replaceChildren(iframe);
```

### Viktiga punkter

- **ctx.element**: DOM-elementet för den aktuella JS-blockbehållaren.
- **sandbox-attributet**: Styr säkerhetsrestriktioner för iframe-innehållet.
  - `allow-scripts`: Tillåter iframen att exekvera skript.
  - `allow-same-origin`: Tillåter iframen att komma åt sin egen ursprungskälla.
- **replaceChildren()**: Ersätter alla underordnade element i behållaren med iframen.

### Avancerat exempel med laddningsstatus

Du kan förbättra iframe-skapandet med laddningsstatus och felhantering:

```javascript
// Visa laddningsmeddelande
ctx.message.loading('Laddar externt innehåll...');

try {
  // Skapa iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Lägg till händelselyssnare för laddning
  iframe.addEventListener('load', () => {
    ctx.message.success('Innehåll laddat framgångsrikt');
  });

  // Lägg till händelselyssnare för fel
  iframe.addEventListener('error', () => {
    ctx.message.error('Misslyckades med att ladda innehåll');
  });

  // Infoga iframe i behållaren
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Fel vid skapande av iframe: ' + error.message);
}
```

### Säkerhetsöverväganden

När du använder iframes, överväg följande bästa säkerhetspraxis:

1.  **Använd HTTPS**: Ladda alltid iframe-innehåll via HTTPS när det är möjligt.
2.  **Begränsa Sandbox-behörigheter**: Aktivera endast nödvändiga sandbox-behörigheter.
3.  **Content Security Policy**: Konfigurera lämpliga CSP-huvuden.
4.  **Same-Origin Policy**: Var medveten om begränsningar för korsdomäner.
5.  **Betrodda källor**: Ladda endast innehåll från betrodda domäner.