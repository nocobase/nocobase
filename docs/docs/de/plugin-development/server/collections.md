:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Sammlungen (Collections)

Bei der Entwicklung von NocoBase-Plugins ist die **Sammlung (Collection)** eines der zentralen Konzepte. Sie können die Struktur von Datentabellen in Ihren Plugins hinzufügen oder ändern, indem Sie Sammlungen definieren oder erweitern. Im Gegensatz zu Datentabellen, die über die Oberfläche der Datenquellenverwaltung erstellt werden, handelt es sich bei **im Code definierten Sammlungen in der Regel um Metadatentabellen auf Systemebene**, die nicht in der Liste der Datenquellenverwaltung erscheinen.

## Datentabellen definieren

Gemäß der konventionellen Verzeichnisstruktur sollten Sammlungsdateien im Verzeichnis `./src/server/collections` abgelegt werden. Verwenden Sie `defineCollection()`, um neue Tabellen zu erstellen, und `extendCollection()`, um bestehende Tabellen zu erweitern.

```ts
import { defineCollection } from '@nocobase/database';

export default defineCollection({
  name: 'articles',
  title: 'Beispielartikel',
  fields: [
    { type: 'string', name: 'title', interface: 'input', uiSchema: { title: 'Titel', required: true } },
    { type: 'text', name: 'content', interface: 'textarea', uiSchema: { title: 'Inhalt' } },
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
      interface: 'recordPicker',
      uiSchema: { title: 'Autor' },
    },
  ],
});
```

Im obigen Beispiel:

- `name`: Der Tabellenname (eine Tabelle mit demselben Namen wird automatisch in der Datenbank generiert).
- `title`: Der Anzeigename der Tabelle in der Benutzeroberfläche.
- `fields`: Eine Sammlung von Feldern, wobei jedes Feld Attribute wie `type`, `name` usw. enthält.

Wenn Sie Felder hinzufügen oder Konfigurationen für Sammlungen anderer Plugins ändern müssen, können Sie `extendCollection()` verwenden:

```ts
import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'articles',
  fields: [
    {
      type: 'boolean',
      name: 'isPublished',
      defaultValue: false,
    },
  ],
});
```

Nach der Aktivierung des Plugins fügt das System das Feld `isPublished` automatisch der bestehenden `articles`-Tabelle hinzu.

:::tip
Die konventionelle Verzeichnisstruktur wird geladen, bevor die `load()`-Methoden aller Plugins ausgeführt werden. Dadurch werden Abhängigkeitsprobleme vermieden, die durch nicht geladene Datentabellen entstehen könnten.
:::

## Datenbankstruktur synchronisieren

Wenn ein Plugin zum ersten Mal aktiviert wird, synchronisiert das System automatisch die Sammlungs-Konfigurationen mit der Datenbankstruktur. Ist das Plugin bereits installiert und in Betrieb, müssen Sie nach dem Hinzufügen oder Ändern von Sammlungen den Upgrade-Befehl manuell ausführen:

```bash
yarn nocobase upgrade
```

Sollten während der Synchronisierung Ausnahmen oder inkonsistente Daten auftreten, können Sie die Tabellenstruktur durch eine Neuinstallation der Anwendung wiederherstellen:

```bash
yarn nocobase install -f
```

## Ressourcen automatisch generieren

Nachdem Sie eine Sammlung definiert haben, generiert das System automatisch eine entsprechende Ressource. Auf dieser Ressource können Sie dann direkt CRUD-Operationen (Erstellen, Lesen, Aktualisieren, Löschen) über die API ausführen. Weitere Informationen finden Sie unter [Ressourcenverwaltung](./resource-manager.md).