:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# DataSourceManager – Datenquellen-Verwaltung

NocoBase bietet den `DataSourceManager` zur Verwaltung mehrerer Datenquellen. Jede `Datenquelle` verfügt über eigene `Database`-, `ResourceManager`- und `ACL`-Instanzen, was Entwicklern eine flexible Verwaltung und Erweiterung mehrerer Datenquellen ermöglicht.

## Grundlegende Konzepte

Jede `DataSource`-Instanz enthält Folgendes:

- **`dataSource.collectionManager`**: Dient zur Verwaltung von Sammlungen und Feldern.
- **`dataSource.resourceManager`**: Verarbeitet ressourcenbezogene Operationen (z. B. Erstellen, Lesen, Aktualisieren, Löschen – CRUD).
- **`dataSource.acl`**: Zugriffssteuerung (ACL) für Ressourcenoperationen.

Für einen bequemen Zugriff stehen Ihnen Aliasnamen für die Mitglieder der Haupt-Datenquelle zur Verfügung:

- `app.db` ist äquivalent zu `dataSourceManager.get('main').collectionManager.db`
- `app.acl` ist äquivalent zu `dataSourceManager.get('main').acl`
- `app.resourceManager` ist äquivalent zu `dataSourceManager.get('main').resourceManager`

## Häufig verwendete Methoden

### dataSourceManager.get(dataSourceKey)

Diese Methode gibt die angegebene `DataSource`-Instanz zurück.

```ts
const dataSource = dataSourceManager.get('main');
```

### dataSourceManager.use()

Registrieren Sie Middleware für alle Datenquellen. Dies beeinflusst Operationen auf allen Datenquellen.

```ts
dataSourceManager.use((ctx, next) => {
  console.log('This middleware applies to all data sources.');
  await next();
});
```

### dataSourceManager.beforeAddDataSource()

Wird vor dem Laden einer Datenquelle ausgeführt. Häufig für die Registrierung statischer Klassen verwendet, z. B. für Modellklassen und Feldtypen:

```ts
dataSourceManager.beforeAddDataSource((dataSource: DataSource) => {
  const collectionManager = dataSource.collectionManager;
  if (collectionManager instanceof SequelizeCollectionManager) {
    collectionManager.registerFieldTypes({
      belongsToArray: BelongsToArrayField, // Benutzerdefinierter Feldtyp
    });
  }
});
```

### dataSourceManager.afterAddDataSource()

Wird nach dem Laden einer Datenquelle ausgeführt. Häufig für die Registrierung von Operationen, das Festlegen der Zugriffssteuerung usw. verwendet.

```ts
dataSourceManager.afterAddDataSource((dataSource) => {
  dataSource.resourceManager.registerActionHandler('downloadXlsxTemplate', downloadXlsxTemplate);
  dataSource.resourceManager.registerActionHandler('importXlsx', importXlsx);
  dataSource.acl.allow('*', 'downloadXlsxTemplate', 'loggedIn'); // Zugriffsrechte festlegen
});
```

## Datenquellen-Erweiterung

Eine vollständige Beschreibung der Datenquellen-Erweiterung finden Sie im Kapitel [Datenquellen-Erweiterung](#).