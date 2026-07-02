---
title: "Migration"
description: "NocoBase Migration API Referenz: Migration-Basisklasse, up/down-Methoden, on-Ausführungszeitpunkt, appVersion-Versionskontrolle, verfügbare Eigenschaften."
keywords: "Migration,Datenmigration,up,down,appVersion,on,beforeLoad,afterSync,afterLoad,NocoBase"
---

# Migration

Migration ist die Basisklasse für Datenmigrationen in NocoBase. Sie wird verwendet, um bei Plugin-Upgrades Datenbankstrukturänderungen und Datenmigrationen durchzuführen. Import aus `@nocobase/server`.

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<1.0.0';

  async up() {
    // Upgrade-Logik
  }
}
```

## Klasseneigenschaften

### on

```ts
on: 'beforeLoad' | 'afterSync' | 'afterLoad';
```

Steuert den Ausführungszeitpunkt der Migration im Upgrade-Ablauf. Standard ist `'afterLoad'`.

| Wert | Ausführungszeitpunkt | Anwendungsfall |
|----|----------|----------|
| `'beforeLoad'` | Vor dem Laden der Plugins | Low-Level-DDL-Operationen (z. B. Spalten oder Constraints hinzufügen). Die Repository API ist zu diesem Zeitpunkt nicht verfügbar |
| `'afterSync'` | Nach `db.sync()`, vor dem Plugin-Upgrade | Datenmigrationen, die die neue Tabellenstruktur benötigen, aber nicht von Plugin-Logik abhängen |
| `'afterLoad'` | Nachdem alle Plugins geladen wurden | **Standardwert**, für die meisten Migrationen geeignet. Die vollständige Repository API ist verfügbar |

### appVersion

```ts
appVersion: string;
```

Ein semver-Bereichsstring, der bestimmt, bei welchen Anwendungsversionen diese Migration ausgeführt wird. Das Framework prüft mit `semver.satisfies()`: Die Migration wird nur ausgeführt, wenn die aktuelle Anwendungsversion den Bereich erfüllt.

```ts
// Wird nur beim Upgrade von einer Version unter 1.0.0 ausgeführt
appVersion = '<1.0.0';

// Wird nur beim Upgrade von einer Version unter 0.21.0-alpha.13 ausgeführt
appVersion = '<0.21.0-alpha.13';

// Leer lassen, um bei jedem Upgrade auszuführen
appVersion = '';
```

## Instanzeigenschaften

### app

```ts
get app(): Application
```

Die NocoBase Application-Instanz. Über sie kann auf die verschiedenen Module der Anwendung zugegriffen werden:

```ts
async up() {
  // Anwendungsversion abrufen
  const version = this.app.version;

  // Logger abrufen
  this.app.log.info('Migration started');
}
```

### db

```ts
get db(): Database
```

Die NocoBase Database-Instanz, mit der Repositories abgerufen und Abfragen ausgeführt werden können:

```ts
async up() {
  const repo = this.db.getRepository('users');
  await repo.update({
    filter: { status: 'inactive' },
    values: { status: 'disabled' },
  });
}
```

### plugin

```ts
get plugin(): Plugin
```

Die aktuelle Plugin-Instanz. Nur in Plugin-Level-Migrationen verfügbar (in Core-Migrationen ist der Wert `undefined`).

```ts
async up() {
  const pluginName = this.plugin.name;
}
```

### sequelize

```ts
get sequelize(): Sequelize
```

Die Sequelize-Instanz, mit der direkt rohes SQL ausgeführt werden kann:

```ts
async up() {
  await this.sequelize.query(`UPDATE users SET status = 'active' WHERE status IS NULL`);
}
```

### queryInterface

```ts
get queryInterface(): QueryInterface
```

Das Sequelize QueryInterface, das für DDL-Operationen verwendet wird (Spalten hinzufügen/entfernen, Constraints hinzufügen, Spaltentypen ändern usw.):

```ts
async up() {
  const { DataTypes } = require('@nocobase/database');

  // Spalte hinzufügen
  await this.queryInterface.addColumn('users', 'nickname', {
    type: DataTypes.STRING,
  });

  // Unique-Constraint hinzufügen
  await this.queryInterface.addConstraint('users', {
    type: 'unique',
    fields: ['email'],
  });
}
```

### pm

```ts
get pm(): PluginManager
```

Der Plugin-Manager. Über `this.pm.repository` können Plugin-Metadaten abgefragt und geändert werden:

```ts
async up() {
  const plugins = await this.pm.repository.find();
  for (const plugin of plugins) {
    // Plugin-Einträge massenweise ändern
  }
}
```

## Instanzmethoden

### up()

```ts
async up(): Promise<void>
```

**Wird beim Upgrade ausgeführt.** Unterklassen müssen diese Methode überschreiben und die Migrationslogik implementieren.

### down()

```ts
async down(): Promise<void>
```

**Wird beim Rollback ausgeführt.** Die meisten Migrationen lassen diese Methode leer. Falls ein Rollback unterstützt werden soll, werden hier die Umkehroperationen implementiert.

## Vollständige Beispiele

### Daten mit der Repository API aktualisieren (afterLoad)

Das häufigste Szenario — nach dem Laden aller Plugins werden Daten mit der Repository API massenweise aktualisiert:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  appVersion = '<1.0.0';

  async up() {
    const repo = this.db.getRepository('roles');
    await repo.update({
      filter: {
        $or: [{ allowConfigure: true }, { name: 'root' }],
      },
      values: {
        snippets: ['ui.*', 'pm', 'pm.*'],
        allowConfigure: false,
      },
    });
  }

  async down() {}
}
```

### Tabellenstruktur mit QueryInterface ändern (beforeLoad)

Low-Level-DDL vor dem Laden der Plugins ausführen — zum Beispiel einer Tabelle neue Spalten und einen Unique-Constraint hinzufügen:

```ts
import { DataTypes } from '@nocobase/database';
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'beforeLoad';
  appVersion = '<0.14.0-alpha.2';

  async up() {
    const tableName = this.pm.collection.getTableNameWithSchema();
    const field = this.pm.collection.getField('packageName');

    // Zuerst prüfen, ob das Feld bereits existiert
    const exists = await field.existsInDb();
    if (exists) return;

    await this.queryInterface.addColumn(tableName, field.columnName(), {
      type: DataTypes.STRING,
    });

    await this.queryInterface.addConstraint(tableName, {
      type: 'unique',
      fields: [field.columnName()],
    });
  }
}
```

### Rohes SQL verwenden (afterSync)

Nach Abschluss der Tabellenstruktursynchronisierung wird mit rohem SQL eine Datenmigration durchgeführt:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<1.0.0-alpha.3';

  async up() {
    const items = await this.pm.repository.find();
    for (const item of items) {
      if (item.name.startsWith('@nocobase/plugin-')) {
        item.set('name', item.name.substring('@nocobase/plugin-'.length));
        await item.save();
      }
    }
  }
}
```

## Migration-Datei erstellen

Über den CLI-Befehl:

```bash
nb scaffold migration my-migration --pkg @my-project/plugin-hello
```

Der Befehl generiert eine Datei mit Zeitstempel im Verzeichnis `src/server/migrations/` des Plugins, mit folgender Vorlage:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad';
  appVersion = '<aktuelle Version>';

  async up() {
    // coding
  }
}
```

Befehlsparameter:

| Parameter | Beschreibung |
|------|------|
| `<name>` | Name der Migration, wird für den Dateinamen verwendet |
| `--pkg <pkg>` | Paketname, bestimmt den Speicherpfad der Datei |
| `--on <on>` | Ausführungszeitpunkt, Standard ist `'afterLoad'` |

## Verwandte Links

- [Migration-Upgrade-Skripte (Plugin-Entwicklung)](../../plugin-development/server/migration.md) — Anleitung zur Verwendung von Migrationen in der Plugin-Entwicklung
- [Collections-Datentabellen](../../plugin-development/server/collections.md) — defineCollection und Tabellenstruktursynchronisierung
- [Database-Datenbankoperationen](../../plugin-development/server/database.md) — Repository API und Datenbankoperationen
- [Plugin](../../plugin-development/server/plugin.md) — Die Beziehung zwischen install() und Migration im Plugin-Lebenszyklus
