:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/render).
:::

# ctx.render()

Rendert React-Elemente, HTML-Strings oder DOM-Knoten in einen angegebenen Container. Wenn `container` nicht angegeben wird, erfolgt das Rendering standardmäßig in `ctx.element`, wobei der Kontext der Anwendung (wie ConfigProvider und Themes) automatisch übernommen wird.

## Anwendungsszenarien

| Szenario | Beschreibung |
|------|------|
| **JSBlock** | Rendern von benutzerdefinierten Block-Inhalten (Diagramme, Listen, Karten usw.) |
| **JSField / JSItem / JSColumn** | Rendern benutzerdefinierter Darstellungen für bearbeitbare Felder oder Tabellenspalten |
| **Details-Block** | Anpassung des Anzeigeformats von Feldern in Detailseiten |

> Hinweis: `ctx.render()` benötigt einen Rendering-Container. Wenn `container` nicht übergeben wird und `ctx.element` nicht existiert (z. B. in rein logischen Szenarien ohne Benutzeroberfläche), wird ein Fehler ausgegeben.

## Typdefinition

```ts
render(
  vnode: React.ReactElement | Node | DocumentFragment | string,
  container?: Element | DocumentFragment
): ReactDOMClient.Root | null;
```

| Parameter | Typ | Beschreibung |
|------|------|------|
| `vnode` | `React.ReactElement` \| `Node` \| `DocumentFragment` \| `string` | Zu rendernder Inhalt |
| `container` | `Element` \| `DocumentFragment` (Optional) | Ziel-Container für das Rendering, Standard ist `ctx.element` |

**Rückgabewert**:

- Beim Rendern eines **React-Elements**: Gibt `ReactDOMClient.Root` zurück, um spätere Aktualisierungen über `root.render()` zu ermöglichen.
- Beim Rendern eines **HTML-Strings** oder **DOM-Knotens**: Gibt `null` zurück.

## Beschreibung der vnode-Typen

| Typ | Verhalten |
|------|------|
| `React.ReactElement` (JSX) | Wird mit `createRoot` von React gerendert, bietet volle React-Funktionalität und übernimmt automatisch den Anwendungskontext. |
| `string` | Setzt das `innerHTML` des Containers nach der Bereinigung mit DOMPurify; ein vorhandener React-Root wird zuerst unmounted. |
| `Node` (Element, Text usw.) | Wird nach dem Leeren des Containers per `appendChild` hinzugefügt; ein vorhandener React-Root wird zuerst unmounted. |
| `DocumentFragment` | Hängt Fragment-Kindknoten an den Container an; ein vorhandener React-Root wird zuerst unmounted. |

## Beispiele

### Rendern von React-Elementen (JSX)

```tsx
const { Button, Card } = ctx.libs.antd;

ctx.render(
  <Card title={ctx.t('Titel')}>
    <Button type="primary" onClick={() => ctx.message.success(ctx.t('Geklickt'))}>
      {ctx.t('Schaltfläche')}
    </Button>
  </Card>
);
```

### Rendern von HTML-Strings

```ts
ctx.render('<h1>Hallo Welt</h1>');

// Kombination mit ctx.t für die Internationalisierung
ctx.render('<div style="padding:16px">' + ctx.t('Inhalt') + '</div>');

// Bedingtes Rendering
ctx.render(hasData ? `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>` : '<span style="color:#999">' + ctx.t('Keine Daten') + '</span>');
```

### Rendern von DOM-Knoten

```ts
const div = document.createElement('div');
div.textContent = 'Hallo Welt';
ctx.render(div);

// Zuerst einen leeren Container rendern, dann an eine Drittanbieter-Bibliothek (z. B. ECharts) zur Initialisierung übergeben
const container = document.createElement('div');
container.style.width = '100%';
container.style.height = '400px';
ctx.render(container);
const chart = echarts.init(container);
chart.setOption({ ... });
```

### Angeben eines benutzerdefinierten Containers

```ts
// In ein bestimmtes DOM-Element rendern
const customEl = document.getElementById('mein-container');
ctx.render(<div>Inhalt</div>, customEl);
```

### Mehrfache Aufrufe ersetzen den Inhalt

```ts
// Der zweite Aufruf ersetzt den vorhandenen Inhalt im Container
ctx.render(<div>Erster Aufruf</div>);
ctx.render(<div>Zweiter Aufruf</div>);  // Es wird nur „Zweiter Aufruf“ angezeigt
```

## Hinweise

- **Mehrfache Aufrufe ersetzen den Inhalt**: Jeder Aufruf von `ctx.render()` ersetzt den vorhandenen Inhalt im Container, anstatt ihn zu ergänzen.
- **Sicherheit von HTML-Strings**: Übergebener HTML-Code wird mit DOMPurify bereinigt, um XSS-Risiken zu minimieren. Dennoch wird empfohlen, das Verketten von nicht vertrauenswürdigen Benutzereingaben zu vermeiden.
- **ctx.element nicht direkt manipulieren**: `ctx.element.innerHTML` ist veraltet; stattdessen sollte einheitlich `ctx.render()` verwendet werden.
- **Container übergeben, wenn kein Standard existiert**: In Szenarien, in denen `ctx.element` den Wert `undefined` hat (z. B. in Modulen, die über `ctx.importAsync` geladen wurden), muss explizit ein `container` angegeben werden.

## Verwandte Themen

- [ctx.element](./element.md) – Standard-Rendering-Container, der verwendet wird, wenn kein Container an `ctx.render()` übergeben wird.
- [ctx.libs](./libs.md) – Integrierte Bibliotheken wie React und Ant Design, die für das JSX-Rendering verwendet werden.
- [ctx.importAsync()](./import-async.md) – Wird in Verbindung mit `ctx.render()` verwendet, nachdem externe React- oder Komponentenbibliotheken bei Bedarf geladen wurden.