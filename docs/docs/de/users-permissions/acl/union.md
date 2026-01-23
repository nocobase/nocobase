---
pkg: '@nocobase/plugin-acl'
---
:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::


# Rollenvereinigung

Die Rollenvereinigung ist ein Berechtigungsverwaltungsmodus. Je nach Systemeinstellungen können Systementwickler wählen, ob sie `Unabhängige Rollen`, `Rollenvereinigung erlauben` oder `Nur Rollenvereinigung` verwenden möchten, um unterschiedliche Berechtigungsanforderungen zu erfüllen.

![20250312184651](https://static-docs.nocobase.com/20250312184651.png)

## Unabhängige Rollen

Standardmäßig verwendet das System unabhängige Rollen. Benutzer müssen die ihnen zugewiesenen Rollen einzeln wechseln.

![20250312184729](https://static-docs.nocobase.com/20250312184729.png)
![20250312184826](https://static-docs.nocobase.com/20250312184826.png)

## Rollenvereinigung erlauben

Systementwickler können die Option `Rollenvereinigung erlauben` aktivieren. Dies ermöglicht es Benutzern, die Berechtigungen aller zugewiesenen Rollen gleichzeitig zu nutzen, während sie weiterhin die Möglichkeit haben, Rollen einzeln zu wechseln.

![20250312185006](https://static-docs.nocobase.com/20250312185006.png)

## Nur Rollenvereinigung

Benutzer werden gezwungen, ausschließlich die Rollenvereinigung zu nutzen und können Rollen nicht einzeln wechseln.

![20250312185105](https://static-docs.nocobase.com/20250312185105.png)

## Regeln für die Rollenvereinigung

Die Rollenvereinigung gewährt die maximalen Berechtigungen aller Rollen. Im Folgenden wird erläutert, wie Berechtigungskonflikte gelöst werden, wenn Rollen unterschiedliche Einstellungen für dieselbe Berechtigung haben.

### Zusammenführung von Aktionsberechtigungen

Beispiel: Rolle 1 (role1) ist so konfiguriert, dass sie die `Konfiguration der Benutzeroberfläche` erlaubt, und Rolle 2 (role2) erlaubt das `Installieren, Aktivieren und Deaktivieren von Plugins`.

![20250312190133](https://static-docs.nocobase.com/20250312190133.png)

![20250312190352](https://static-docs.nocobase.com/20250312190352.png)

Meldet sich der Benutzer mit einer Rolle an, die **alle Berechtigungen** umfasst, besitzt er gleichzeitig beide Berechtigungen.

![20250312190621](https://static-docs.nocobase.com/20250312190621.png)

### Zusammenführung des Datenbereichs

#### Datenzeilen

Szenario 1: Mehrere Rollen legen Bedingungen für dasselbe Feld fest.

Rolle A, Filter: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rolle B, Filter: Age > 25

| UserID | Name | Age |
| ------ | ---- | --- |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

**Nach der Zusammenführung:**

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |
| 3      | Sam  | 32  |

Szenario 2: Verschiedene Rollen legen Bedingungen für unterschiedliche Felder fest.

Rolle A, Filter: Age < 30

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rolle B, Filter: Name enthält „Ja“

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 3      | Jasmin | 27  |

**Nach der Zusammenführung:**

| UserID | Name   | Age |
| ------ | ------ | --- |
| 1      | Jack   | 23  |
| 2      | Lily   | 29  |
| 3      | Jasmin | 27  |

#### Datenspalten

Rolle A, sichtbare Felder: Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rolle B, sichtbare Felder: Name, Sex

| UserID | Name | Sex   |
| ------ | ---- | ----- |
| 1      | Jack | Man   |
| 2      | Lily | Woman |

**Nach der Zusammenführung:**

| UserID | Name | Age | Sex   |
| ------ | ---- | --- | ----- |
| 1      | Jack | 23  | Man   |
| 2      | Lily | 29  | Woman |

#### Gemischte Zeilen und Spalten

Rolle A, Filter: Age < 30, sichtbare Felder: Name, Age

| UserID | Name | Age |
| ------ | ---- | --- |
| 1      | Jack | 23  |
| 2      | Lily | 29  |

Rolle B, Filter: Name enthält „Ja“, sichtbare Felder: Name, Sex

| UserID | Name  | Sex   |
| ------ | ----- | ----- |
| 3      | Jade  | Woman |
| 4      | James | Man   |

**Nach der Zusammenführung:**

| UserID | Name  | Age                                              | Sex                                                 |
| ------ | ----- | ------------------------------------------------ | --------------------------------------------------- |
| 1      | Jack  | 23                                               | <span style="background-color:#FFDDDD">Man</span>   |
| 2      | Lily  | 29                                               | <span style="background-color:#FFDDDD">Woman</span> |
| 3      | Jade  | <span style="background-color:#FFDDDD">27</span> | Woman                                               |
| 4      | James | <span style="background-color:#FFDDDD">31</span> | Man                                                 |

**Hinweis:** Die rot hinterlegten Zellen zeigen Daten an, die in den einzelnen Rollen nicht sichtbar wären, aber in der zusammengeführten Rolle sichtbar sind.

#### Zusammenfassung

Regeln für die Zusammenführung von Rollen im Datenbereich:

1.  **Zwischen Zeilen:** Wenn eine der Bedingungen erfüllt ist, besteht die Berechtigung für die Zeile.
2.  **Zwischen Spalten:** Felder werden kombiniert.
3.  **Zeilen und Spalten gleichzeitig:** Wenn sowohl Zeilen als auch Spalten konfiguriert sind, werden Zeilen und Spalten separat zusammengeführt, nicht als Kombinationen von (Zeile + Spalte).