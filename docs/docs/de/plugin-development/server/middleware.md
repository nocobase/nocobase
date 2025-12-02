:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Middleware

Die Middleware des NocoBase Servers ist im Wesentlichen **Koa Middleware**. Sie können das `ctx`-Objekt wie in Koa manipulieren, um Anfragen und Antworten zu verarbeiten. Da NocoBase jedoch Logik auf verschiedenen Geschäftsebenen verwalten muss, wäre es sehr schwierig, alle Middleware-Komponenten zusammen zu warten und zu verwalten.

Aus diesem Grund teilt NocoBase die Middleware in **vier Ebenen** auf:

1.  **Datenquellen-Middleware**: `app.dataSourceManager.use()`  
    Wirkt sich nur auf Anfragen einer **bestimmten Datenquelle** aus und wird häufig für die Datenbankverbindung, Feldvalidierung oder Transaktionsverarbeitung dieser Datenquelle verwendet.

2.  **Ressourcen-Middleware**: `app.resourceManager.use()`  
    Gilt nur für definierte Ressourcen (Resource) und eignet sich zur Verarbeitung von Logik auf Ressourcenebene, wie Datenberechtigungen, Formatierung usw.

3.  **Berechtigungs-Middleware**: `app.acl.use()`  
    Wird vor der Berechtigungsprüfung ausgeführt und dient zur Überprüfung von Benutzerberechtigungen oder Rollen.

4.  **Anwendungs-Middleware**: `app.use()`  
    Wird bei jeder Anfrage ausgeführt und eignet sich für Protokollierung, allgemeine Fehlerbehandlung, Antwortverarbeitung usw.

## Middleware-Registrierung

Middleware wird normalerweise in der `load`-Methode eines Plugins registriert, zum Beispiel:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Anwendungs-Middleware
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Datenquellen-Middleware
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Berechtigungs-Middleware
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Ressourcen-Middleware
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Ausführungsreihenfolge

Die Ausführungsreihenfolge der Middleware ist wie folgt:

1.  Zuerst wird die Berechtigungs-Middleware ausgeführt, die mit `acl.use()` hinzugefügt wurde.
2.  Danach wird die Ressourcen-Middleware ausgeführt, die mit `resourceManager.use()` hinzugefügt wurde.
3.  Anschließend wird die Datenquellen-Middleware ausgeführt, die mit `dataSourceManager.use()` hinzugefügt wurde.
4.  Zuletzt wird die Anwendungs-Middleware ausgeführt, die mit `app.use()` hinzugefügt wurde.

## `before` / `after` / `tag` Einfügemechanismus

Um die Reihenfolge der Middleware flexibler zu steuern, bietet NocoBase die Parameter `before`, `after` und `tag`:

-   **tag**: Weist der Middleware ein Tag zu, das von nachfolgender Middleware referenziert werden kann.
-   **before**: Fügt die Middleware vor der Middleware mit dem angegebenen Tag ein.
-   **after**: Fügt die Middleware nach der Middleware mit dem angegebenen Tag ein.

Beispiel:

```ts
// Reguläre Middleware
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 wird vor m1 platziert
app.use(m4, { before: 'restApi' });

// m5 wird zwischen m2 und m3 eingefügt
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Wenn keine Position angegeben wird, ist die Standard-Ausführungsreihenfolge für neu hinzugefügte Middleware:  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## Beispiel für das Zwiebelschalenmodell

Die Ausführungsreihenfolge der Middleware folgt dem **Zwiebelschalenmodell** von Koa, was bedeutet, dass sie zuerst in den Middleware-Stack eintritt und zuletzt wieder austritt.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourceManager.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Beim Zugriff auf verschiedene Schnittstellen, Beispiele für die Ausgabereihenfolge:

-   **Reguläre Anfrage**: `/api/hello`  
    Ausgabe: `[1,2]` (Ressource nicht definiert, `resourceManager`- und `acl`-Middleware werden nicht ausgeführt)  

-   **Ressourcenanfrage**: `/api/test:list`  
    Ausgabe: `[5,3,7,1,2,8,4,6]`  
    Die Middleware wird gemäß der Ebenenreihenfolge und dem Zwiebelschalenmodell ausgeführt.

## Zusammenfassung

-   NocoBase Middleware ist eine Erweiterung der Koa Middleware.
-   Vier Ebenen: Anwendung -> Datenquelle -> Ressource -> Berechtigung
-   Sie können `before` / `after` / `tag` verwenden, um die Ausführungsreihenfolge flexibel zu steuern.
-   Folgt dem Koa-Zwiebelschalenmodell und gewährleistet, dass Middleware zusammensetzbar und verschachtelbar ist.
-   Datenquellen-Middleware wirkt sich nur auf Anfragen für bestimmte Datenquellen aus und Ressourcen-Middleware nur auf Anfragen für definierte Ressourcen.