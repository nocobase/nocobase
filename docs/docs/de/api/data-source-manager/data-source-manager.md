:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# DataSourceManager

`DataSourceManager` ist die Verwaltungs-Klasse für mehrere `dataSource`-Instanzen.

## API

### add()
Fügt eine `dataSource`-Instanz hinzu.

#### Signatur

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Fügt der `dataSource`-Instanz globale Middleware hinzu.

### middleware()

Ruft die Middleware der aktuellen `DataSourceManager`-Instanz ab, die zur Beantwortung von HTTP-Anfragen verwendet werden kann.

### afterAddDataSource()

Eine Hook-Funktion, die nach dem Hinzufügen einer neuen `dataSource` aufgerufen wird.

#### Signatur

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Registriert einen Datenquellen-Typ und dessen Klasse.

#### Signatur

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Ruft die Datenquellen-Klasse ab.

#### Signatur

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Erstellt eine Datenquellen-Instanz basierend auf dem registrierten Datenquellen-Typ und den Instanz-Optionen.

#### Signatur

- `buildDataSourceByType(type: string, options: any): DataSource`