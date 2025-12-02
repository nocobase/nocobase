:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# RelationRepository

`RelationRepository` ist ein `Repository`-Objekt für Beziehungstypen. Es ermöglicht die Bearbeitung von verknüpften Daten, ohne die Verknüpfung selbst laden zu müssen. Aufbauend auf dem `RelationRepository` gibt es für jeden Beziehungstyp eine entsprechende abgeleitete Implementierung:

- [`HasOneRepository`](#has-one-repository)
- `HasManyRepository`
- `BelongsToRepository`
- `BelongsToManyRepository`

## Konstruktor

**Signatur**

- `constructor(sourceCollection: Collection, association: string, sourceKeyValue: string | number)`

**Parameter**

| Parametername      | Typ                | Standardwert | Beschreibung                                                      |
| :----------------- | :----------------- | :----------- | :---------------------------------------------------------------- |
| `sourceCollection` | `Collection`       | -            | Die `Sammlung`, die der referenzierenden Beziehung in der Verknüpfung entspricht. |
| `association`      | `string`           | -            | Name der Verknüpfung                                              |
| `sourceKeyValue`   | `string \| number` | -            | Der entsprechende Schlüsselwert in der referenzierenden Beziehung. |

## Eigenschaften der Basisklasse

### `db: Database`

Datenbankobjekt

### `sourceCollection`

Die `Sammlung`, die der referenzierenden Beziehung in der Verknüpfung entspricht.

### `targetCollection`

Die `Sammlung`, die der referenzierten Beziehung in der Verknüpfung entspricht.

### `association`

Das `association`-Objekt in Sequelize, das der aktuellen Verknüpfung entspricht.

### `associationField`

Das Feld in der `Sammlung`, das der aktuellen Verknüpfung entspricht.

### `sourceKeyValue`

Der entsprechende Schlüsselwert in der referenzierenden Beziehung.