:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Context

In NocoBase wird für jede Anfrage ein `ctx`-Objekt generiert. Dieses Objekt ist eine Instanz des Context. Der Context kapselt Anfrage- und Antwortinformationen und bietet gleichzeitig NocoBase-spezifische Funktionen wie Datenbankzugriff, Cache-Operationen, Berechtigungsverwaltung, Internationalisierung und Protokollierung.

Die `Application` von NocoBase basiert auf Koa, daher ist `ctx` im Wesentlichen ein Koa Context. NocoBase erweitert diesen jedoch um umfangreiche APIs, die es Entwicklern ermöglichen, Geschäftslogik bequem in Middleware und Actions zu verarbeiten. Jede Anfrage verfügt über ein unabhängiges `ctx`, was die Datenisolation und Sicherheit zwischen den Anfragen gewährleistet.

## ctx.action

`ctx.action` bietet Zugriff auf die Action, die für die aktuelle Anfrage ausgeführt wird. Dazu gehören:

- ctx.action.params
- ctx.action.actionName
- ctx.action.resourceName

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.action.actionName); // Gibt den Namen der aktuellen Action aus
  ctx.body = `Action: ${ctx.action.actionName}`;
});
```

## ctx.i18n & ctx.t()

Unterstützung für Internationalisierung (i18n).

- `ctx.i18n` stellt Informationen zum Gebietsschema (Locale) bereit.
- `ctx.t()` wird verwendet, um Zeichenketten basierend auf der Sprache zu übersetzen.

```ts
resourceManager.use(async (ctx) => {
  const msg = ctx.t('Hello World'); // Gibt die Übersetzung basierend auf der Anfragesprache zurück
  ctx.body = msg;
});
```

## ctx.db

`ctx.db` stellt eine Schnittstelle für den Datenbankzugriff bereit, über die Sie Modelle direkt bearbeiten und Abfragen ausführen können.

```ts
resourceManager.use(async (ctx) => {
  const users = await ctx.db.getRepository('users').find();
  ctx.body = users;
});
```

## ctx.cache

`ctx.cache` bietet Cache-Operationen und unterstützt das Lesen und Schreiben in den Cache. Dies wird häufig verwendet, um den Datenzugriff zu beschleunigen oder temporäre Zustände zu speichern.

```ts
resourceManager.use(async (ctx) => {
  await ctx.cache.set('key', 'value', 60); // Cache für 60 Sekunden
  const val = await ctx.cache.get('key');
  ctx.body = val;
});
```

## ctx.app

`ctx.app` ist die NocoBase-Anwendungsinstanz und ermöglicht den Zugriff auf globale Konfigurationen, Plugins und Dienste.

```ts
resourceManager.use(async (ctx) => {
  console.log(ctx.app);
  ctx.body = 'Check console for app';
});
```

## ctx.auth.user

`ctx.auth.user` ruft die Informationen des aktuell authentifizierten Benutzers ab und eignet sich für die Verwendung in Berechtigungsprüfungen oder der Geschäftslogik.

```ts
resourceManager.use(async (ctx) => {
  if (!ctx.auth.user) {
    ctx.throw(401, 'Unauthorized');
  }
  ctx.body = `Hello ${ctx.auth.user.username}`;
});
```

## ctx.state.currentRoles

`ctx.state` wird verwendet, um Daten in der Middleware-Kette zu teilen.

```ts
resourceManager.use(async (ctx) => {
  ctx.body = `Current User: ${ctx.state.currentRoles.join(',')}`;
});
```

## ctx.logger

`ctx.logger` bietet Protokollierungsfunktionen und unterstützt die Ausgabe von Protokollen auf mehreren Ebenen.

```ts
resourceManager.use(async (ctx) => {
  ctx.logger.info('Processing request for:', ctx.path);
  ctx.body = 'Logged successfully';
});
```

## ctx.permission & ctx.can()

`ctx.permission` wird für die Berechtigungsverwaltung verwendet, und `ctx.can()` prüft, ob der aktuelle Benutzer die Berechtigung hat, eine bestimmte Operation auszuführen.

```ts
resourceManager.use(async (ctx) => {
  const canEdit = await ctx.can('edit', 'posts');
  if (!canEdit) {
    ctx.throw(403, 'Forbidden');
  }
  ctx.body = 'You have permission to edit posts';
});
```

## Zusammenfassung

- Jede Anfrage entspricht einem unabhängigen `ctx`-Objekt.
- `ctx` ist eine Erweiterung des Koa Context, die NocoBase-Funktionalitäten integriert.
- Zu den gängigen Eigenschaften gehören: `ctx.db`, `ctx.cache`, `ctx.auth`, `ctx.state`, `ctx.logger`, `ctx.can()`, `ctx.t()` usw.
- Die Verwendung von `ctx` in Middleware und Actions ermöglicht eine bequeme Handhabung von Anfragen, Antworten, Berechtigungen, Protokollen und der Datenbank.