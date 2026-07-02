# Migration

## App

## Datenbank

## Plugin

## Sequelize

## Query-Interface

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