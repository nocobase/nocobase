---
title: "Passwort"
description: "Das Passwortfeld dient zum Speichern passwortähnlicher Eingaben und zeigt diese bei der Eingabe im Interface maskiert an."
keywords: "Passwort,password,sensible Eingabe,NocoBase"
---

# Passwort

## Einführung

In NocoBase wird **Passwort (Password)** zur Eingabe passwortähnlicher Inhalte verwendet.

Passwortfelder eignen sich zum Speichern von Inhalten, deren Eingabe verborgen bleiben soll, beispielsweise Passwörtern externer Dienste oder temporären Zugangscodes. Der Schwerpunkt liegt auf der Art der Eingabe und Anzeige und stellt keine vollständige Lösung für die Schlüsselverwaltung dar.

Wenn hochsensible Schlüssel oder langfristig gültige Zugangsdaten gespeichert werden sollen, sollten bevorzugt spezielle Lösungen für Verschlüsselung, Schlüsselverwaltung oder Umgebungsvariablen geprüft werden.

## Geeignete Einsatzszenarien

Passwortfelder eignen sich für folgende Geschäftsszenarien:

- Temporäre Passwörter für externe Systeme
- Zugangscodes in Verbindungskonfigurationen
- Sensible Texte, die lediglich maskiert eingegeben werden müssen
- Temporäre Bestätigungscodes oder Zugangscodes in internen Prozessen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ einer Datentabelle auf „Add field“ und wählen Sie „Passwort“, um ein Passwortfeld zu erstellen.

![20240512175917](https://static-docs.nocobase.com/20240512175917.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Interface-Typ des Feldes. Für Passwörter entspricht er `password` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der im Interface angezeigte Name des Feldes, beispielsweise „Zugangspasswort“, „Verbindungszugangscode“ oder „Temporärer Zugangscode“. Es wird empfohlen, einen für die zuständigen Fachanwender unmittelbar verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Referenzen in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Passwortfelder verwenden normalerweise `password` oder `string`. |
| Default value | Der Standardwert. Wenn beim Anlegen eines Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert übernommen werden. |
| Validation rules | Validierungsregeln. Es können Länge, reguläre Ausdrücke oder eine Pflichtangabe konfiguriert werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person angegeben werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Anpassungen an der Konfiguration zu vermeiden.

:::

## Eigenschaften des Feldes

Das Passwortfeld weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `password`. |
| Standardmäßiger Field type | `password`. |
| Optionaler Field type | `password`, `string`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Passworteingabefeld verwendet. |
| Filterung | Die Verwendung als Filterbedingung wird normalerweise nicht empfohlen. |
| Sortierung | Die Verwendung zur Sortierung wird normalerweise nicht empfohlen. |
| Validierung | Unterstützt Validierungen wie Länge, reguläre Ausdrücke und Pflichtangaben. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Passwortfelds zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, seine Anzeige und Verwendung in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den im Interface angezeigten Namen des Feldes, nicht jedoch seinen Bezeichner. |
| Field name | Nein | Der Bezeichner des Feldes kann im Bearbeitungsformular nach der Erstellung normalerweise nicht geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann er angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf den Seiten. |
| Field type | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann er angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu angelegte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Der Wechsel von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Er beeinflusst die Speicherung des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Workflow-Variablen. Bei einer großen Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Passwortfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Passwortfelds werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Import und Export sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen referenziert wird.

:::

## Verwendung in der Seitenkonfiguration

Passwortfelder eignen sich zur Eingabe sensibler Texte in Konfigurationsformularen.
![20260709225244](https://static-docs.nocobase.com/20260709225244.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Zugangscodes über ein Passworteingabefeld eingeben. |
| Detailblock | Maskiert oder auf eingeschränkte Weise anzeigen. |
| Berechtigungen | Festlegen, wer das Passwortfeld anzeigen oder bearbeiten darf. |
| Workflow | Mit Vorsicht als Parameter für externe Anfragen verwenden. |

## Verwandte Links

- [Feld](../index.md) — Informationen zu Zweck, Klassifizierung und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Einzeiliger Text](./input.md) — Gewöhnliche kurze Texte speichern