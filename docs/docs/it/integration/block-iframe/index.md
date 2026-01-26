---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::



# Blocco Iframe

## Introduzione

Il blocco Iframe Le permette di incorporare pagine web o contenuti esterni nella pagina corrente. Può integrare facilmente applicazioni esterne configurando un URL o inserendo direttamente codice HTML. L'uso dell'HTML Le offre la flessibilità di personalizzare i contenuti per soddisfare specifiche esigenze di visualizzazione, rendendolo ideale per scenari personalizzati. Questo approccio consente di caricare risorse esterne senza reindirizzamenti, migliorando l'esperienza utente e l'interattività della pagina.

## Installazione

È un **plugin** integrato, non richiede installazione.

## Aggiungere blocchi

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Configuri l'URL o l'HTML per incorporare direttamente l'applicazione esterna.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Motore di template

### Template a stringa

Il motore di template predefinito.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Per maggiori informazioni, consulti la documentazione del **motore di template** Handlebars.

## Passaggio di variabili

### Supporto HTML per l'analisi delle variabili

#### Supporto per la selezione di variabili dal selettore di variabili nel contesto del blocco corrente

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Iniettare e utilizzare variabili nell'applicazione tramite codice

Può anche iniettare variabili personalizzate nell'applicazione tramite codice e usarle nell'HTML. Ad esempio, per creare un'applicazione calendario dinamica usando Vue 3 ed Element Plus:

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

Esempio: Un semplice componente calendario creato con React e Ant Design (antd), che utilizza dayjs per gestire le date.

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

### L'URL supporta le variabili

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Per maggiori informazioni sulle variabili, consulti la documentazione sulle variabili.

## Creare Iframe con i blocchi JS (NocoBase 2.0)

In NocoBase 2.0, può utilizzare i **blocchi JS** per creare iframe dinamicamente e avere un maggiore controllo. Questo approccio offre una maggiore flessibilità per personalizzare il comportamento e lo stile degli iframe.

### Esempio di base

Crei un **blocco JS** e utilizzi il seguente codice per creare un iframe:

```javascript
// Crea un iframe che riempie il contenitore del blocco corrente
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Sostituisce gli elementi figli esistenti in modo che l'iframe sia l'unico contenuto
ctx.element.replaceChildren(iframe);
```

### Punti chiave

- **`ctx.element`**: L'elemento DOM del contenitore del **blocco JS** corrente.
- **`sandbox attribute`**: Controlla le restrizioni di sicurezza per il contenuto dell'iframe.
  - `allow-scripts`: Consente all'iframe di eseguire script.
  - `allow-same-origin`: Consente all'iframe di accedere alla propria origine.
- **`replaceChildren()`**: Sostituisce tutti gli elementi figli del contenitore con l'iframe.

### Esempio avanzato con stato di caricamento

Può migliorare la creazione di iframe con stati di caricamento e gestione degli errori:

```javascript
// Mostra il messaggio di caricamento
ctx.message.loading('Caricamento del contenuto esterno...');

try {
  // Crea l'iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Aggiunge un listener per l'evento di caricamento
  iframe.addEventListener('load', () => {
    ctx.message.success('Contenuto caricato con successo');
  });

  // Aggiunge un listener per l'evento di errore
  iframe.addEventListener('error', () => {
    ctx.message.error('Caricamento del contenuto fallito');
  });

  // Inserisce l'iframe nel contenitore
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Errore durante la creazione dell\'iframe: ' + error.message);
}
```

### Considerazioni sulla sicurezza

Quando utilizza gli iframe, tenga in considerazione le seguenti best practice di sicurezza:

1.  **Utilizzare HTTPS**: Carichi sempre il contenuto dell'iframe tramite HTTPS, quando possibile.
2.  **Limitare i permessi Sandbox**: Abiliti solo i permessi sandbox necessari.
3.  **Content Security Policy**: Configuri le intestazioni CSP appropriate.
4.  **Same-Origin Policy**: Presti attenzione alle restrizioni cross-origin.
5.  **Fonti attendibili**: Carichi contenuti solo da domini attendibili.