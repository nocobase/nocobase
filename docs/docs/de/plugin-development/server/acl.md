:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# ACL-Berechtigungssteuerung

ACL (Access Control List) wird zur Steuerung von Berechtigungen für Ressourcenoperationen verwendet. Sie können Rollen Berechtigungen zuweisen oder Berechtigungen direkt festlegen, indem Sie Rollenbeschränkungen umgehen. Das ACL-System bietet einen flexiblen Mechanismus zur Berechtigungsverwaltung, der verschiedene Methoden wie Berechtigungs-Snippets, Middleware und Bedingungsprüfungen unterstützt.

:::tip Hinweis

ACL-Objekte gehören zur Datenquelle (`dataSource.acl`). Die ACL der Haupt-Datenquelle kann über `app.acl` schnell aufgerufen werden. Die Verwendung von ACLs für andere Datenquellen finden Sie im Kapitel [Datenquellen-Verwaltung](./data-source-manager.md).

:::

## Berechtigungs-Snippets registrieren

Berechtigungs-Snippets können häufig verwendete Berechtigungskombinationen als wiederverwendbare Berechtigungseinheiten registrieren. Nachdem eine Rolle an ein Snippet gebunden wurde, erhält sie die entsprechende Gruppe von Berechtigungen. Dies reduziert doppelte Konfigurationen und verbessert die Effizienz der Berechtigungsverwaltung.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // Das Präfix ui.* zeigt Berechtigungen an, die in der Benutzeroberfläche konfiguriert werden können.
  actions: ['customRequests:*'], // Entsprechende Ressourcenoperationen, unterstützt Wildcards.
});
```

## Berechtigungen, die Rollenbeschränkungen umgehen (allow)

`acl.allow()` wird verwendet, um bestimmten Operationen zu erlauben, Rollenbeschränkungen zu umgehen. Dies ist nützlich für öffentliche APIs, Szenarien, die eine dynamische Berechtigungsprüfung erfordern, oder Fälle, in denen die Berechtigungsprüfung auf dem Anfragekontext basieren muss.

```ts
// Öffentlicher Zugriff, keine Anmeldung erforderlich.
acl.allow('app', 'getLang', 'public');

// Nur für angemeldete Benutzer zugänglich.
acl.allow('app', 'getInfo', 'loggedIn');

// Basierend auf einer benutzerdefinierten Bedingung.
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Beschreibung des `condition`-Parameters:**

- `'public'`: Jeder Benutzer (einschließlich nicht angemeldeter Benutzer) kann zugreifen, ohne jegliche Authentifizierung.
- `'loggedIn'`: Nur angemeldete Benutzer können zugreifen, erfordert eine gültige Benutzeridentität.
- `(ctx) => Promise<boolean>` oder `(ctx) => boolean`: Eine benutzerdefinierte Funktion, die dynamisch basierend auf dem Anfragekontext entscheidet, ob der Zugriff erlaubt ist. Dies ermöglicht die Implementierung komplexer Berechtigungslogiken.

## Berechtigungs-Middleware registrieren (use)

`acl.use()` wird verwendet, um benutzerdefinierte Berechtigungs-Middleware zu registrieren, die es ermöglicht, benutzerdefinierte Logik in den Berechtigungsprüfungsprozess einzufügen. Dies wird normalerweise zusammen mit `ctx.permission` verwendet, um benutzerdefinierte Berechtigungsregeln zu definieren. Es eignet sich für Szenarien, die eine unkonventionelle Berechtigungssteuerung erfordern, wie z. B. öffentliche Formulare, die eine benutzerdefinierte Passwortüberprüfung benötigen, oder dynamische Berechtigungsprüfungen basierend auf Anfrageparametern.

**Typische Anwendungsfälle:**

- Szenarien mit öffentlichen Formularen: Kein Benutzer, keine Rolle, aber Berechtigungen müssen durch ein benutzerdefiniertes Passwort eingeschränkt werden.
- Berechtigungssteuerung basierend auf Anfrageparametern, IP-Adressen und anderen Bedingungen.
- Benutzerdefinierte Berechtigungsregeln, die den Standard-Berechtigungsprüfungsprozess überspringen oder ändern.

**Berechtigungen über `ctx.permission` steuern:**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Beispiel: Öffentliches Formular erfordert Passwortüberprüfung, um die Berechtigungsprüfung zu überspringen.
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Überprüfung erfolgreich, Berechtigungsprüfung überspringen.
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Berechtigungsprüfung ausführen (ACL-Prozess fortsetzen).
  await next();
});
```

**Beschreibung der `ctx.permission`-Eigenschaft:**

- `skip: true`: Überspringt nachfolgende ACL-Berechtigungsprüfungen und erlaubt den Zugriff direkt.
- Kann in der Middleware dynamisch basierend auf benutzerdefinierter Logik gesetzt werden, um eine flexible Berechtigungssteuerung zu ermöglichen.

## Feste Datenbeschränkungen für spezifische Operationen hinzufügen (addFixedParams)

`addFixedParams` kann fest definierte Datenbereichs-(Filter-)Beschränkungen für Operationen bestimmter Ressourcen hinzufügen. Diese Beschränkungen umgehen Rollenbeschränkungen und werden direkt angewendet, typischerweise zum Schutz kritischer Systemdaten.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// Selbst wenn ein Benutzer die Berechtigung zum Löschen von Rollen hat, kann er Systemrollen wie root, admin, member nicht löschen.
```

> **Tipp:** `addFixedParams` kann verwendet werden, um zu verhindern, dass sensible Daten versehentlich gelöscht oder geändert werden, z. B. systeminterne Rollen, Administratorkonten usw. Diese Beschränkungen wirken zusätzlich zu den Rollenberechtigungen und stellen sicher, dass geschützte Daten auch mit entsprechenden Berechtigungen nicht manipuliert werden können.

## Berechtigungen prüfen (can)

`acl.can()` wird verwendet, um zu prüfen, ob eine Rolle die Berechtigung hat, eine bestimmte Operation auszuführen. Es gibt ein Berechtigungsergebnisobjekt oder `null` zurück. Dies wird häufig in der Geschäftslogik verwendet, um Berechtigungen dynamisch zu überprüfen, z. B. um in Middleware oder Operation-Handlern basierend auf der Rolle zu entscheiden, ob bestimmte Operationen ausgeführt werden dürfen.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Es kann eine einzelne Rolle oder ein Array von Rollen übergeben werden.
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Rolle ${result.role} kann die Operation ${result.action} ausführen.`);
  // result.params enthält die festen Parameter, die über addFixedParams gesetzt wurden.
  console.log('Feste Parameter:', result.params);
} else {
  console.log('Keine Berechtigung, diese Operation auszuführen.');
}
```

> **Tipp:** Wenn mehrere Rollen übergeben werden, wird jede Rolle nacheinander geprüft und das Ergebnis der ersten Rolle mit Berechtigung zurückgegeben.

**Typdefinitionen:**

```ts
interface CanArgs {
  role?: string;      // Einzelne Rolle
  roles?: string[];   // Mehrere Rollen (werden nacheinander geprüft, gibt die erste Rolle mit Berechtigung zurück)
  resource: string;   // Ressourcenname
  action: string;    // Operationsname
}

interface CanResult {
  role: string;       // Rolle mit Berechtigung
  resource: string;   // Ressourcenname
  action: string;    // Operationsname
  params?: any;       // Informationen zu festen Parametern (falls über addFixedParams gesetzt)
}
```

## Konfigurierbare Operationen registrieren (setAvailableAction)

Wenn Sie möchten, dass benutzerdefinierte Operationen in der Benutzeroberfläche konfiguriert werden können (z. B. auf der Rollenverwaltungsseite angezeigt werden), müssen Sie diese mit `setAvailableAction` registrieren. Registrierte Operationen erscheinen in der Berechtigungskonfigurationsoberfläche, wo Administratoren die Operationsberechtigungen für verschiedene Rollen konfigurieren können.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Anzeigename in der Benutzeroberfläche, unterstützt Internationalisierung.
  type: 'new-data',               // Operationstyp
  onNewRecord: true,              // Ob beim Erstellen neuer Datensätze wirksam.
});
```

**Parameterbeschreibung:**

- **displayName**: Der in der Berechtigungskonfigurationsoberfläche angezeigte Name, unterstützt Internationalisierung (im Format `{{t("key")}}`).
- **type**: Der Operationstyp, der die Klassifizierung dieser Operation in der Berechtigungskonfiguration bestimmt.
  - `'new-data'`: Operationen, die neue Daten erstellen (z. B. Import, Hinzufügen usw.).
  - `'existing-data'`: Operationen, die bestehende Daten ändern (z. B. Aktualisieren, Löschen usw.).
- **onNewRecord**: Ob die Operation beim Erstellen neuer Datensätze wirksam wird, nur für den Typ `'new-data'` gültig.

Nach der Registrierung erscheint diese Operation in der Berechtigungskonfigurationsoberfläche, wo Administratoren die Berechtigungen für diese Operation auf der Rollenverwaltungsseite konfigurieren können.