:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/render).
:::

# ctx.render()

Esegue il rendering di elementi React, stringhe HTML o nodi DOM in un contenitore specificato. Se non viene fornito un `container`, il rendering avviene per impostazione predefinita in `ctx.element` e eredita automaticamente il contesto dell'applicazione, come ConfigProvider e i temi.

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSBlock** | Rendering di contenuti personalizzati per i blocchi (grafici, elenchi, schede, ecc.) |
| **JSField / JSItem / JSColumn** | Rendering di visualizzazioni personalizzate per campi modificabili o colonne di tabelle |
| **Blocco dettagli** | Personalizzazione del formato di visualizzazione dei campi nelle pagine dei dettagli |

> Nota: `ctx.render()` richiede un contenitore di rendering. Se non viene passato un `container` e `ctx.element` non esiste (ad esempio, in scenari di pura logica senza interfaccia utente), verrà generato un errore.

## Definizione del tipo

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parametro | Tipo | Descrizione |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Contenuto da renderizzare |
| `container` | `Element` \| `DocumentFragment` (opzionale) | Contenitore di destinazione del rendering, predefinito `ctx.element` |

**Valore di ritorno**:

- Quando si renderizza un **elemento React**: restituisce `ReactDOMClient.Root`, facilitando la chiamata a `root.render()` per aggiornamenti successivi.
- Quando si renderizza una **stringa HTML** o un **nodo DOM**: restituisce `null`.

## Descrizione del tipo vnode

| Tipo | Comportamento |
|------|------|
| `React.ReactElement` (JSX) | Renderizzato utilizzando `createRoot` di React, fornendo funzionalità React complete e ereditando automaticamente il contesto dell'applicazione. |
| `string` | Imposta l'`innerHTML` del contenitore dopo la sanificazione con DOMPurify; qualsiasi radice React esistente verrà prima smontata. |
| `Node` (Element, Text, ecc.) | Aggiunge tramite `appendChild` dopo aver svuotato il contenitore; qualsiasi radice React esistente verrà prima smontata. |
| `DocumentFragment` | Aggiunge i nodi figli del frammento al contenitore; qualsiasi radice React esistente verrà prima smontata. |

## Esempi

### Rendering di elementi React (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Titolo')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Cliccato'))}>
      {ctx.t('Pulsante')}
    </Button>
  </Card>
);
```

### Rendering di stringhe HTML

```ts
ctx.render('<h1>Hello World</h1>');

// Combinazione con ctx.t per l'internazionalizzazione
ctx.render('<div style="padding:16px">' + ctx.t('Contenuto') + '</div>');

// Rendering condizionale
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('Nessun dato') + '</span>');
```

### Rendering di nodi DOM

```ts
const div = document.createElement('div');
div.textContent = 'Hello World';
ctx.render(div);

// Renderizza prima un contenitore vuoto, quindi lo affida a una libreria di terze parti (ad esempio, ECharts) per l'inizializzazione
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Specifica di un contenitore personalizzato

```ts
// Rendering in uno specifico elemento DOM
const customEl = document.getElementById('my-container');
ctx.render(<div>Contenuto</div>, customEl);
```

### Le chiamate multiple sostituiranno il contenuto

```ts
// La seconda chiamata sostituirà il contenuto esistente nel contenitore
ctx.render(<div>Primo</div>);
ctx.render(<div>Secondo</div>);  // Verrà visualizzato solo "Secondo"
```

## Note

- **Le chiamate multiple sostituiscono il contenuto**: ogni chiamata a `ctx.render()` sostituisce il contenuto esistente nel contenitore invece di aggiungerlo.
- **Sicurezza delle stringhe HTML**: l'HTML passato viene sanificato tramite DOMPurify per ridurre i rischi XSS, ma si raccomanda comunque di evitare la concatenazione di input utente non attendibili.
- **Non manipolare direttamente ctx.element**: `ctx.element.innerHTML` è deprecato; si dovrebbe invece utilizzare `ctx.render()` in modo coerente.
- **Passare il contenitore quando non ne esiste uno predefinito**: in scenari in cui `ctx.element` è `undefined` (ad esempio, all'interno di moduli caricati tramite `ctx.importAsync`), è necessario fornire esplicitamente un `container`.

## Correlati

- [ctx.element](./element.md) - Contenitore di rendering predefinito, utilizzato quando non viene passato alcun contenitore a `ctx.render()`.
- [ctx.libs](./libs.md) - Librerie integrate come React e Ant Design, utilizzate per il rendering JSX.
- [ctx.importAsync()](./import-async.md) - Utilizzato in combinazione con `ctx.render()` dopo aver caricato librerie React/componenti esterne su richiesta.