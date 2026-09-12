---
title: "Collections – Definition von Datentabellen"
description: "Collections in NocoBase-Plugins definieren: defineCollection, extendCollection, fields, Verzeichniskonvention src/server/collections."
keywords: "Collections,defineCollection,extendCollection,Datentabellen,Collection-Definition,NocoBase"
---

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

## Feldtypen im Überblick

In den `fields` von `defineCollection` bestimmt `type` den Spaltentyp des Feldes in der Datenbank. Nachfolgend finden Sie alle integrierten Feldtypen:

### Text

| type | Datenbanktyp | Beschreibung | Spezifische Parameter |
|------|-----------|------|----------|
| `string` | VARCHAR(255) | Kurzer Text | `length?: number` (benutzerdefinierte Länge), `trim?: boolean` |
| `text` | TEXT | Langer Text | `length?: 'tiny' \| 'medium' \| 'long'` (nur MySQL) |

### Zahlen

| type | Datenbanktyp | Beschreibung | Spezifische Parameter |
|------|-----------|------|----------|
| `integer` | INTEGER | Ganzzahl | — |
| `bigInt` | BIGINT | Große Ganzzahl | — |
| `float` | FLOAT | Gleitkommazahl | — |
| `double` | DOUBLE | Gleitkommazahl mit doppelter Genauigkeit | — |
| `decimal` | DECIMAL(p,s) | Festkommazahl | `precision: number`, `scale: number` |

### Boolesche Werte

| type | Datenbanktyp | Beschreibung |
|------|-----------|------|
| `boolean` | BOOLEAN | Boolescher Wert |

### Datum und Uhrzeit

| type | Datenbanktyp | Beschreibung | Spezifische Parameter |
|------|-----------|------|----------|
| `date` | DATE(3) | Datum und Uhrzeit (mit Millisekunden) | `defaultToCurrentTime?`, `onUpdateToCurrentTime?` |
| `dateOnly` | DATEONLY | Nur Datum, ohne Uhrzeit | — |
| `time` | TIME | Nur Uhrzeit | — |
| `unixTimestamp` | BIGINT | Unix-Zeitstempel | `accuracy?: 'second' \| 'millisecond'` |

:::tip
`date` ist der am häufigsten verwendete Datumstyp. Wenn Sie zwischen verschiedenen Arten der Zeitzonenbehandlung unterscheiden müssen, stehen zusätzlich `datetimeTz` (mit Zeitzone) und `datetimeNoTz` (ohne Zeitzone) zur Verfügung.
:::

### Strukturierte Daten

| type | Datenbanktyp | Beschreibung | Spezifische Parameter |
|------|-----------|------|----------|
| `json` | JSON / JSONB | JSON-Daten | `jsonb?: boolean` (verwendet unter PostgreSQL JSONB) |
| `jsonb` | JSONB / JSON | Bevorzugt JSONB | — |
| `array` | ARRAY / JSON | Array | Unter PostgreSQL steht der native ARRAY-Typ zur Verfügung |

### ID-Generierung

| type | Datenbanktyp | Beschreibung | Spezifische Parameter |
|------|-----------|------|----------|
| `uid` | VARCHAR(255) | Automatisch generierte kurze ID | `prefix?: string` |
| `uuid` | UUID | UUID v4 | `autoFill?: boolean` (Standard: true) |
| `nanoid` | VARCHAR(255) | NanoID | `size?: number` (Standard: 12), `customAlphabet?: string` |
| `snowflakeId` | BIGINT | Snowflake-ID | `autoFill?: boolean` (Standard: true) |

### Spezielle Typen

| type | Datenbanktyp | Beschreibung |
|------|-----------|------|
| `password` | VARCHAR(255) | Speicherung als automatisch gesalzener Hash |
| `virtual` | Keine reale Spalte | Virtuelles Feld, für das in der Datenbank keine Spalte angelegt wird |
| `context` | Konfigurierbar | Wird automatisch aus dem Anfragekontext befüllt (zum Beispiel `currentUser.id`) |

### Beziehungstypen

Beziehungsfelder legen keine Datenbankspalten an, sondern stellen Beziehungen zwischen Tabellen auf ORM-Ebene her:

| type | Beschreibung | Wichtige Parameter |
|------|------|----------|
| `belongsTo` | Viele-zu-eins | `target` (Zieltabelle), `foreignKey` (Fremdschlüsselfeld) |
| `hasOne` | Eins-zu-eins | `target`, `foreignKey` |
| `hasMany` | Eins-zu-viele | `target`, `foreignKey` |
| `belongsToMany` | Viele-zu-viele | `target`, `through` (Zwischentabelle), `foreignKey`, `otherKey` |

Anwendungsbeispiel für Beziehungsfelder:

```ts
export default defineCollection({
  name: 'articles',
  fields: [
    { type: 'string', name: 'title' },
    // Viele-zu-eins: Ein Artikel gehört zu einem Autor
    {
      type: 'belongsTo',
      name: 'author',
      target: 'users',
      foreignKey: 'authorId',
    },
    // Eins-zu-viele: Ein Artikel hat mehrere Kommentare
    {
      type: 'hasMany',
      name: 'comments',
      target: 'comments',
      foreignKey: 'articleId',
    },
    // Viele-zu-viele: Ein Artikel hat mehrere Tags
    {
      type: 'belongsToMany',
      name: 'tags',
      target: 'tags',
      through: 'articlesTags',  // Name der Zwischentabelle
    },
  ],
});
```

### Gemeinsame Parameter

Alle Spaltenfelder unterstützen die folgenden Parameter:

| Parameter | Typ | Beschreibung |
|------|------|------|
| `name` | `string` | Feldname (erforderlich) |
| `defaultValue` | `any` | Standardwert |
| `allowNull` | `boolean` | Ob null zulässig ist |
| `unique` | `boolean` | Ob der Wert eindeutig sein muss |
| `primaryKey` | `boolean` | Ob es sich um den Primärschlüssel handelt |
| `autoIncrement` | `boolean` | Ob der Wert automatisch hochgezählt wird |
| `index` | `boolean` | Ob ein Index angelegt wird |
| `comment` | `string` | Feldkommentar |

## Datenbankstruktur synchronisieren

Wenn ein Plugin zum ersten Mal aktiviert wird, synchronisiert das System automatisch die Sammlungs-Konfigurationen mit der Datenbankstruktur. Ist das Plugin bereits installiert und in Betrieb, müssen Sie nach dem Hinzufügen oder Ändern von Sammlungen den Upgrade-Befehl manuell ausführen:

```bash
yarn nocobase upgrade
```

## Eine Sammlung in der Datentabellenliste der Oberfläche anzeigen

Über `defineCollection` definierte Tabellen sind serverseitige interne Tabellen und **erscheinen standardmäßig nicht** in der Liste der Datenquellenverwaltung und ebenso wenig in der Datentabellenauswahl beim Hinzufügen eines Blocks.

**Empfohlenes Vorgehen**: Legen Sie die entsprechende Datentabelle in der NocoBase-Oberfläche unter „[Datenquellenverwaltung](../../data-sources/data-source-main/index.md)“ an. Sobald Sie Felder und Interface-Typen konfiguriert haben, erscheint die Tabelle automatisch in der Datentabellenauswahl des Blocks.

![Beim Hinzufügen eines Blocks auswählbar](https://static-docs.nocobase.com/20260409143839.png)

Falls die Registrierung tatsächlich im Plugin-Code erfolgen muss (etwa für Demonstrationsszenarien in Beispiel-Plugins), können Sie sie im clientseitigen Plugin manuell über `addCollection` vornehmen. Beachten Sie, dass die Registrierung zwingend über das `eventBus`-Muster erfolgen muss und nicht direkt in `load()` aufgerufen werden darf – `ensureLoaded()` leert nach `load()` alle Sammlungen und setzt sie neu. Ein vollständiges Beispiel finden Sie unter [Ein Frontend-Backend-Datenmanagement-Plugin erstellen](../client/examples/fullstack-plugin.md).

## Ressourcen automatisch generieren

Nachdem Sie eine Sammlung definiert haben, generiert das System automatisch eine entsprechende Ressource. Auf dieser Ressource können Sie dann direkt CRUD-Operationen (Erstellen, Lesen, Aktualisieren, Löschen) über die API ausführen. Weitere Informationen finden Sie unter [Ressourcenverwaltung](./resource-manager.md).

## Verwandte Links

- [Database](./database.md) — CRUD, Repository, Transaktionen und Datenbankereignisse
- [DataSourceManager](./data-source-manager.md) — Mehrere Datenquellen und deren Sammlungen verwalten
- [Migration](./migration.md) — Datenmigrationsskripte für Plugin-Upgrades
- [Plugin](./plugin.md) — Lebenszyklus der Plugin-Klasse, Membermethoden und das `app`-Objekt
- [ResourceManager](./resource-manager.md) — Benutzerdefinierte REST-APIs und Action-Handler
- [Ein Frontend-Backend-Datenmanagement-Plugin erstellen](../client/examples/fullstack-plugin.md) — Vollständiges Beispiel mit defineCollection + addCollection
- [Projektverzeichnisstruktur](../project-structure.md) — Erläuterung der Verzeichniskonvention `src/server/collections`
