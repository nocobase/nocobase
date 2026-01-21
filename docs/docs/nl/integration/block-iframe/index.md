---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# Iframe-blok

## Introductie

Het Iframe-blok stelt u in staat om externe webpagina's of inhoud in de huidige pagina in te sluiten. U kunt externe applicaties naadloos integreren door een URL te configureren of direct HTML-code in te voegen. Met HTML kunt u de inhoud flexibel aanpassen aan specifieke weergavebehoeften, wat het ideaal maakt voor gepersonaliseerde scenario's. Deze aanpak maakt het mogelijk om externe bronnen te laden zonder omleiding, wat de gebruikerservaring en de interactiviteit van de pagina verbetert.

## Installatie

Dit is een ingebouwde plugin, installatie is niet nodig.

## Blokken toevoegen

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Configureer de URL of HTML om de externe applicatie direct in te sluiten.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Template-engine

### String-template

De standaard template-engine.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Voor meer informatie, raadpleeg de Handlebars template-documentatie.

## Variabelen doorgeven

### HTML-ondersteuning voor variabele-parsing

#### Ondersteuning voor het selecteren van variabelen uit de variabele-selector in de context van het huidige blok

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Ondersteuning voor het injecteren en gebruiken van variabelen in de applicatie via code

U kunt ook aangepaste variabelen via code in de applicatie injecteren en deze in HTML gebruiken. Bijvoorbeeld, het creëren van een dynamische kalenderapplicatie met Vue 3 en Element Plus:

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
                    >Last month</el-button>
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(1)"
                    >Next month</el-button>
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

Voorbeeld: Een eenvoudige kalendercomponent gemaakt met React en Ant Design (antd), waarbij dayjs wordt gebruikt voor datumbewerking:

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

### URL ondersteunt variabelen

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Voor meer informatie over variabelen, raadpleeg de documentatie over variabelen.

## Iframes maken met JS-blokken (NocoBase 2.0)

In NocoBase 2.0 kunt u JS-blokken gebruiken om dynamisch iframes te creëren, wat u meer controle geeft. Deze aanpak biedt meer flexibiliteit voor het aanpassen van het gedrag en de stijl van iframes.

### Basisvoorbeeld

Maak een JS-blok en gebruik de volgende code om een iframe te creëren:

```javascript
// Maak een iframe dat de container van het huidige blok vult
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Vervang bestaande kindelementen, zodat het iframe de enige inhoud is
ctx.element.replaceChildren(iframe);
```

### Belangrijkste punten

- **ctx.element**: Het DOM-element van de container van het huidige JS-blok
- **sandbox-attribuut**: Regelt veiligheidsbeperkingen voor de inhoud van het iframe
  - `allow-scripts`: Staat het iframe toe om scripts uit te voeren
  - `allow-same-origin`: Staat het iframe toe om zijn eigen oorsprong te benaderen
- **replaceChildren()**: Vervangt alle kindelementen van de container door het iframe

### Geavanceerd voorbeeld met laadstatus

U kunt het creëren van iframes verbeteren met laadstatussen en foutafhandeling:

```javascript
// Toon laadbericht
ctx.message.loading('Externe inhoud wordt geladen...');

try {
  // Maak iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Voeg een 'load' event listener toe
  iframe.addEventListener('load', () => {
    ctx.message.success('Inhoud succesvol geladen');
  });

  // Voeg een 'error' event listener toe
  iframe.addEventListener('error', () => {
    ctx.message.error('Laden van inhoud mislukt');
  });

  // Voeg iframe in de container in
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Fout bij het maken van iframe: ' + error.message);
}
```

### Beveiligingsoverwegingen

Houd bij het gebruik van iframes rekening met de volgende best practices voor beveiliging:

1. **Gebruik HTTPS**: Laad iframe-inhoud altijd via HTTPS, indien mogelijk
2. **Beperk Sandbox-rechten**: Schakel alleen de noodzakelijke sandbox-rechten in
3. **Content Security Policy**: Configureer de juiste CSP-headers
4. **Same-Origin Policy**: Wees u bewust van cross-origin beperkingen
5. **Vertrouwde bronnen**: Laad alleen inhoud van vertrouwde domeinen