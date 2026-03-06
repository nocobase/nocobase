:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/location).
:::

# ctx.location

Aktuelle Informationen zum Routen-Standort, äquivalent zum `location`-Objekt von React Router. Es wird normalerweise in Verbindung mit `ctx.router` und `ctx.route` verwendet, um den aktuellen Pfad, den Abfragestring (Query String), den Hash und den über die Route übergebenen Status (State) zu lesen.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **JSBlock / JSField** | Durchführung von bedingtem Rendering oder Logik-Verzweigungen basierend auf dem aktuellen Pfad, den Abfrageparametern oder dem Hash. |
| **Verknüpfungsregeln / Ereignisfluss** | Lesen von URL-Abfrageparametern für Verknüpfungsfilter oder Bestimmung der Quelle basierend auf `location.state`. |
| **Verarbeitung nach der Navigation** | Empfangen von Daten, die von der vorherigen Seite über `ctx.router.navigate` übergeben wurden, mithilfe von `ctx.location.state` auf der Zielseite. |

> Hinweis: `ctx.location` ist nur in RunJS-Umgebungen mit einem Routing-Kontext verfügbar (z. B. JSBlock innerhalb einer Seite, Ereignisfluss usw.); in reinen Backend- oder Nicht-Routing-Kontexten (wie Workflows) kann es null sein.

## Typdefinition

```ts
location: Location;
```

`Location` stammt aus `react-router-dom` und entspricht dem Rückgabewert von `useLocation()` in React Router.

## Gängige Felder

| Feld | Typ | Beschreibung |
|------|------|------|
| `pathname` | `string` | Der aktuelle Pfad, beginnend mit `/` (z. B. `/admin/users`). |
| `search` | `string` | Der Abfragestring, beginnend mit `?` (z. B. `?page=1&status=active`). |
| `hash` | `string` | Das Hash-Fragment, beginnend mit `#` (z. B. `#section-1`). |
| `state` | `any` | Beliebige Daten, die über `ctx.router.navigate(path, { state })` übergeben wurden und nicht in der URL erscheinen. |
| `key` | `string` | Eine eindeutige Kennung für diesen Standort; die Startseite ist `"default"`. |

## Beziehung zu ctx.router und ctx.urlSearchParams

| Verwendungszweck | Empfohlene Verwendung |
|------|----------|
| **Pfad, Hash, State lesen** | `ctx.location.pathname` / `ctx.location.hash` / `ctx.location.state` |
| **Abfrageparameter lesen (als Objekt)** | `ctx.urlSearchParams`, stellt das analysierte Objekt direkt bereit. |
| **Search-String analysieren** | `new URLSearchParams(ctx.location.search)` oder direkt `ctx.urlSearchParams` verwenden. |

`ctx.urlSearchParams` wird aus `ctx.location.search` analysiert. Wenn Sie nur Abfrageparameter benötigen, ist die Verwendung von `ctx.urlSearchParams` bequemer.

## Beispiele

### Verzweigung basierend auf dem Pfad

```ts
if (ctx.location.pathname.startsWith('/admin/users')) {
  ctx.message.info('Aktuell auf der Benutzerverwaltungsseite');
}
```

### Abfrageparameter analysieren

```ts
// Methode 1: Verwendung von ctx.urlSearchParams (Empfohlen)
const page = ctx.urlSearchParams.page || 1;
const status = ctx.urlSearchParams.status;

// Methode 2: Verwendung von URLSearchParams zum Analysieren von search
const params = new URLSearchParams(ctx.location.search);
const page = params.get('page') || '1';
const status = params.get('status');
```

### Empfangen von Status-Daten aus der Routen-Navigation

```ts
// Beim Navigieren von der vorherigen Seite: ctx.router.navigate('/users/123', { state: { from: 'dashboard' } })
const prevState = ctx.location.state;
if (prevState?.from === 'dashboard') {
  ctx.message.info('Vom Dashboard navigiert');
}
```

### Anker über Hash lokalisieren

```ts
const hash = ctx.location.hash; // z. B. "#edit"
if (hash === '#edit') {
  // Zum Bearbeitungsbereich scrollen oder entsprechende Logik ausführen
}
```

## Verwandte Themen

- [ctx.router](./router.md): Routen-Navigation; der `state` von `ctx.router.navigate` kann über `ctx.location.state` auf der Zielseite abgerufen werden.
- [ctx.route](./route.md): Informationen zur aktuellen Routen-Übereinstimmung (Parameter, Konfiguration usw.), oft in Verbindung mit `ctx.location` verwendet.