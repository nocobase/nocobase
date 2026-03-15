:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/route).
:::

# ctx.route

Die aktuellen Informationen zur Routenübereinstimmung entsprechen dem `route`-Konzept in React Router. Sie werden verwendet, um die aktuell übereinstimmende Routenkonfiguration, Parameter usw. abzurufen. In der Regel wird dies zusammen mit `ctx.router` und `ctx.location` verwendet.

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **JSBlock / JSField** | Bedingtes Rendering oder Anzeige der aktuellen Seitenkennung basierend auf `route.pathname` oder `route.params`. |
| **Verknüpfungsregeln / Ereignis-Flows** | Lesen von Routenparametern (z. B. `params.name`) für Logikverzweigungen oder zur Weitergabe an untergeordnete Komponenten. |
| **Ansichtsnavigation** | Interner Vergleich von `ctx.route.pathname` mit dem Zielpfad, um zu entscheiden, ob `ctx.router.navigate` ausgelöst werden soll. |

> Hinweis: `ctx.route` ist nur in RunJS-Umgebungen verfügbar, die einen Routenkontext enthalten (z. B. JS-Blöcke innerhalb einer Seite, Flow-Seiten usw.). In reinen Backend-Umgebungen oder Kontexten ohne Routing (wie Workflows) kann dieser Wert leer sein.

## Typdefinition

```ts
type RouteOptions = {
  name?: string;   // Eindeutige Routenkennung
  path?: string;   // Routenvorlage (z. B. /admin/:name)
  params?: Record<string, any>;  // Routenparameter (z. B. { name: 'users' })
  pathname?: string;  // Vollständiger Pfad der aktuellen Route (z. B. /admin/users)
};
```

## Häufig genutzte Felder

| Feld | Typ | Beschreibung |
|------|------|------|
| `pathname` | `string` | Der vollständige Pfad der aktuellen Route, konsistent mit `ctx.location.pathname`. |
| `params` | `Record<string, any>` | Aus der Routenvorlage extrahierte dynamische Parameter, wie `{ name: 'users' }`. |
| `path` | `string` | Die Routenvorlage, wie `/admin/:name`. |
| `name` | `string` | Eindeutige Routenkennung, häufig verwendet in Szenarien mit mehreren Tabs oder Ansichten. |

## Beziehung zu ctx.router und ctx.location

| Zweck | Empfohlene Verwendung |
|------|----------|
| **Aktuellen Pfad lesen** | `ctx.route.pathname` oder `ctx.location.pathname`; beide sind bei einer Übereinstimmung identisch. |
| **Routenparameter lesen** | `ctx.route.params`, z. B. steht `params.name` für die UID der aktuellen Seite. |
| **Navigation** | `ctx.router.navigate(path)` |
| **Abfrageparameter und State lesen** | `ctx.location.search`, `ctx.location.state` |

`ctx.route` konzentriert sich auf die „übereinstimmende Routenkonfiguration“, während `ctx.location` den Fokus auf die „aktuelle URL-Position“ legt. Zusammen beschreiben sie den aktuellen Routing-Status vollständig.

## Beispiele

### Pathname lesen

```ts
// Aktuellen Pfad anzeigen
ctx.message.info('Aktuelle Seite: ' + ctx.route.pathname);
```

### Verzweigung basierend auf params

```ts
// params.name ist normalerweise die UID der aktuellen Seite (z. B. Kennung einer Flow-Seite)
if (ctx.route.params?.name === 'users') {
  // Spezifische Logik auf der Benutzerverwaltungsseite ausführen
}
```

### Anzeige auf einer Flow-Seite

```tsx
<div>
  <h1>Aktuelle Seite - {ctx.route.pathname}</h1>
  <p>Routenkennung: {ctx.route.params?.name}</p>
</div>
```

## Verwandte Themen

- [ctx.router](./router.md): Routennavigation. Wenn `ctx.router.navigate()` den Pfad ändert, wird `ctx.route` entsprechend aktualisiert.
- [ctx.location](./location.md): Aktuelle URL-Position (pathname, search, hash, state), wird in Verbindung mit `ctx.route` verwendet.