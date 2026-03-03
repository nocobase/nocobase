:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/router).
:::

# ctx.router

Eine auf React Router basierende Router-Instanz zur programmatischen Navigation innerhalb von RunJS. Sie wird üblicherweise in Kombination mit `ctx.route` und `ctx.location` verwendet.

## Anwendungsfälle

| Szenario | Beschreibung |
|------|------|
| **JSBlock / JSField** | Navigation zu Detailseiten, Listenansichten oder externen Links nach einem Klick auf eine Schaltfläche. |
| **Verknüpfungsregeln / Ereignisfluss** | Ausführen von `navigate` zu einer Liste oder Detailseite nach erfolgreichem Absenden oder Übergabe eines `state` an die Zielseite. |
| **JSAction / Ereignisbehandlung** | Ausführen der Routen-Navigation innerhalb der Logik von Formularübermittlungen oder Link-Klicks. |
| **Ansichtsnavigation** | Aktualisierung der URL via `navigate` beim Wechsel des internen Ansichts-Stacks. |

> Hinweis: `ctx.router` ist nur in RunJS-Umgebungen mit einem Routing-Kontext verfügbar (z. B. JSBlock innerhalb einer Seite, Flow-Seiten, Ereignisflüsse usw.); in reinen Backend-Kontexten oder Kontexten ohne Routing (z. B. Workflows) kann dieser Wert null sein.

## Typdefinition

```typescript
router: Router
```

`Router` stammt aus `@remix-run/router`. In RunJS werden Navigationsoperationen wie Springen, Zurückgehen und Aktualisieren über `ctx.router.navigate()` implementiert.

## Methoden

### ctx.router.navigate()

Navigiert zu einem Zielpfad oder führt eine Zurück-/Aktualisierungsaktion aus.

**Signatur:**

```typescript
navigate(to: string | number | null, options?: RouterNavigateOptions): Promise<void>
```

**Parameter:**

- `to`: Zielpfad (String), relative Position in der Historie (Number, z. B. `-1` für Zurück) oder `null` (zum Aktualisieren der aktuellen Seite).
- `options`: Optionale Konfiguration.
  - `replace?: boolean`: Ob der aktuelle Historieneintrag ersetzt werden soll (Standard ist `false`, was einen neuen Eintrag hinzufügt).
  - `state?: any`: State, der an die Zielroute übergeben wird. Diese Daten erscheinen nicht in der URL und können auf der Zielseite über `ctx.location.state` abgerufen werden. Dies eignet sich für sensible Informationen, temporäre Daten oder Informationen, die nicht in der URL stehen sollten.

## Beispiele

### Einfache Navigation

```ts
// Navigation zur Benutzerliste (neuer Historieneintrag, Zurückgehen möglich)
ctx.router.navigate('/admin/users');

// Navigation zu einer Detailseite
ctx.router.navigate(`/admin/users/${recordId}`);
```

### Historie ersetzen (Kein neuer Eintrag)

```ts
// Weiterleitung zur Startseite nach dem Login; der Benutzer kehrt beim Zurückgehen nicht zur Login-Seite zurück
ctx.router.navigate('/admin', { replace: true });

// Ersetzen der aktuellen Seite durch die Detailseite nach erfolgreicher Formularübermittlung
ctx.router.navigate(`/admin/users/${newId}`, { replace: true });
```

### State übergeben

```ts
// Daten bei der Navigation mitführen; die Zielseite ruft diese über ctx.location.state ab
ctx.router.navigate('/admin/users/123', { 
  state: { from: 'dashboard', tab: 'profile' } 
});
```

### Zurückgehen und Aktualisieren

```ts
// Eine Seite zurück
ctx.router.navigate(-1);

// Zwei Seiten zurück
ctx.router.navigate(-2);

// Aktuelle Seite aktualisieren
ctx.router.navigate(null);
```

## Beziehung zu ctx.route und ctx.location

| Zweck | Empfohlene Verwendung |
|------|----------|
| **Navigation/Springen** | `ctx.router.navigate(path)` |
| **Aktuellen Pfad lesen** | `ctx.route.pathname` oder `ctx.location.pathname` |
| **Bei der Navigation übergebenen State lesen** | `ctx.location.state` |
| **Routenparameter lesen** | `ctx.route.params` |

`ctx.router` ist für „Navigationsaktionen“ zuständig, während `ctx.route` und `ctx.location` für den „aktuellen Routenstatus“ verantwortlich sind.

## Hinweise

- `navigate(path)` fügt standardmäßig einen neuen Historieneintrag hinzu, sodass Benutzer über die Zurück-Schaltfläche des Browsers zurückkehren können.
- `replace: true` ersetzt den aktuellen Historieneintrag, ohne einen neuen hinzuzufügen. Dies eignet sich für Szenarien wie die Weiterleitung nach dem Login oder die Navigation nach einer erfolgreichen Übermittlung.
- **Zum Parameter `state`**:
  - Daten, die über `state` übergeben werden, erscheinen nicht in der URL, was sie für sensible oder temporäre Daten geeignet macht.
  - Der Zugriff erfolgt über `ctx.location.state` auf der Zielseite.
  - `state` wird in der Browser-Historie gespeichert und bleibt bei der Vorwärts-/Rückwärtsnavigation zugänglich.
  - Nach einer harten Aktualisierung der Seite geht der `state` verloren.

## Verwandte Themen

- [ctx.route](./route.md): Informationen zur aktuellen Routenübereinstimmung (pathname, params usw.).
- [ctx.location](./location.md): Aktueller URL-Standort (pathname, search, hash, state); der `state` wird hier nach der Navigation gelesen.