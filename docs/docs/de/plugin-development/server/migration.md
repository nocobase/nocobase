:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Migration

Während der Entwicklung und Aktualisierung von NocoBase-Plugins können sich die Datenbankstrukturen oder Konfigurationen der Plugins inkompatibel ändern. Um reibungslose Upgrades zu gewährleisten, bietet NocoBase einen **Migration**-Mechanismus an. Dieser ermöglicht es Ihnen, diese Änderungen durch das Schreiben von Migrationsdateien zu verwalten. Dieser Leitfaden führt Sie systematisch durch die Verwendung und den Entwicklungsprozess von Migrationen.

## Konzept der Migration

Eine Migration ist ein Skript, das bei Plugin-Upgrades automatisch ausgeführt wird, um folgende Probleme zu lösen:

- Anpassungen der Datenstruktur (z. B. Hinzufügen von Feldern, Ändern von Feldtypen)
- Datenmigration (z. B. Massenaktualisierungen von Feldwerten)
- Aktualisierungen der Plugin-Konfiguration oder internen Logik

Der Ausführungszeitpunkt von Migrationen gliedert sich in drei Typen:

| Typ        | Auslösezeitpunkt                                                               | Ausführungsszenario |
| ---------- | ------------------------------------------------------------------------------ | ------------------- |
| `beforeLoad` | Vor dem Laden aller Plugin-Konfigurationen                                     |                     |
| `afterSync`  | Nachdem die Sammlungskonfigurationen mit der Datenbank synchronisiert wurden (die Sammlungsstruktur wurde bereits geändert) |                     |
| `afterLoad`  | Nachdem alle Plugin-Konfigurationen geladen wurden                             |                     |

## Migrationsdateien erstellen

Migrationsdateien sollten im Plugin-Verzeichnis unter `src/server/migrations/*.ts` abgelegt werden. NocoBase bietet den Befehl `create-migration`, um Migrationsdateien schnell zu generieren.

```bash
yarn nocobase create-migration [options] <name>
```

Optionale Parameter

| Parameter      | Beschreibung                                                              |
| -------------- | ------------------------------------------------------------------------- |
| `--pkg <pkg>`  | Geben Sie den Namen des Plugin-Pakets an                                  |
| `--on [on]`    | Geben Sie den Ausführungszeitpunkt an, Optionen: `beforeLoad`, `afterSync`, `afterLoad` |

Beispiel

```bash
$ yarn nocobase create-migration update-ui --pkg=@nocobase/plugin-client
```

Der Pfad der generierten Migrationsdatei lautet wie folgt:

```
/nocobase/packages/plugins/@nocobase/plugin-client/src/server/migrations/20240107173313-update-ui.ts
```

Initialer Dateiinhalt:

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterLoad'; // 'beforeLoad' | 'afterSync' | 'afterLoad'
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // Schreiben Sie hier die Upgrade-Logik
  }
}
```

> ⚠️ `appVersion` wird verwendet, um die Version zu identifizieren, auf die sich das Upgrade bezieht. Umgebungen mit einer Version, die kleiner als die angegebene Version ist, führen diese Migration aus.

## Migrationen schreiben

In Migrationsdateien können Sie über `this` auf die folgenden gängigen Eigenschaften und APIs zugreifen, um Datenbanken, Plugins und Anwendungsinstanzen bequem zu steuern:

Gängige Eigenschaften

- **`this.app`**  
  Die aktuelle NocoBase-Anwendungsinstanz. Kann für den Zugriff auf globale Dienste, Plugins oder Konfigurationen verwendet werden.  
  ```ts
  const config = this.app.config.get('database');
  ```

- **`this.db`**  
  Die Datenbankdienstinstanz, die Schnittstellen für die Arbeit mit Modellen (Sammlungen) bereitstellt.  
  ```ts
  const users = await this.db.getRepository('users').findAll();
  ```

- **`this.plugin`**  
  Die aktuelle Plugin-Instanz. Kann für den Zugriff auf benutzerdefinierte Methoden des Plugins verwendet werden.  
  ```ts
  const settings = this.plugin.customMethod();
  ```

- **`this.sequelize`**  
  Die Sequelize-Instanz. Sie kann rohe SQL- oder Transaktionsoperationen direkt ausführen.  
  ```ts
  await this.sequelize.transaction(async (transaction) => {
    await this.sequelize.query('UPDATE users SET active = 1', { transaction });
  });
  ```

- **`this.queryInterface`**  
  Sequelize's QueryInterface. Sie wird häufig verwendet, um Tabellenstrukturen zu ändern, z. B. Felder hinzuzufügen oder Tabellen zu löschen.  
  ```ts
  await this.queryInterface.addColumn('users', 'age', {
    type: this.sequelize.Sequelize.INTEGER,
    allowNull: true,
  });
  ```

Beispiel für das Schreiben einer Migration

```ts
import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync';
  appVersion = '<0.19.0-alpha.3';

  async up() {
    // queryInterface verwenden, um ein Feld hinzuzufügen
    await this.queryInterface.addColumn('users', 'nickname', {
      type: this.sequelize.Sequelize.STRING,
      allowNull: true,
    });

    // db verwenden, um auf Datenmodelle zuzugreifen
    const users = await this.db.getRepository('users').findAll();
    for (const user of users) {
      user.nickname = user.username;
      await user.save();
    }

    // Benutzerdefinierte Methode des Plugins ausführen
    await this.plugin.customMethod();
  }
}
```

Zusätzlich zu den oben aufgeführten gängigen Eigenschaften bietet Migration auch umfangreiche APIs. Eine detaillierte Dokumentation finden Sie unter [Migration API](/api/server/migration).

## Migrationen auslösen

Die Ausführung von Migrationen wird durch den Befehl `nocobase upgrade` ausgelöst:

```bash
$ yarn nocobase upgrade
```

Beim Upgrade bestimmt das System die Ausführungsreihenfolge basierend auf dem Migrationstyp und der `appVersion`.

## Migrationen testen

Bei der Plugin-Entwicklung wird empfohlen, einen **Mock Server** zu verwenden, um zu testen, ob die Migration korrekt ausgeführt wird, und so eine Beschädigung realer Daten zu vermeiden.

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('Migration Test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['my-plugin'], // Plugin-Name
      version: '0.18.0-alpha.5', // Version vor dem Upgrade
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  test('run upgrade migration', async () => {
    await app.runCommand('upgrade');
    // Schreiben Sie die Verifizierungslogik, z. B. ob das Feld existiert, ob die Datenmigration erfolgreich war
  });
});
```

> Tipp: Mit einem Mock Server können Sie Upgrade-Szenarien schnell simulieren und die Ausführungsreihenfolge von Migrationen sowie Datenänderungen überprüfen.

## Empfehlungen für die Entwicklungspraxis

1.  **Migrationen aufteilen**  
    Versuchen Sie, pro Upgrade eine Migrationsdatei zu generieren, um die Atomarität zu wahren und die Fehlerbehebung zu vereinfachen.
2.  **Ausführungszeitpunkt festlegen**  
    Wählen Sie `beforeLoad`, `afterSync` oder `afterLoad` basierend auf den zu bearbeitenden Objekten, um Abhängigkeiten von nicht geladenen Modulen zu vermeiden.
3.  **Versionskontrolle beachten**  
    Verwenden Sie `appVersion`, um die für die Migration geltende Version klar zu definieren und eine wiederholte Ausführung zu verhindern.
4.  **Testabdeckung**  
    Überprüfen Sie die Migration auf einem Mock Server, bevor Sie das Upgrade in einer realen Umgebung ausführen.