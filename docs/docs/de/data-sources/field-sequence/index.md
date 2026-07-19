---
title: "Sequenz"
description: "Das Sequenzfeld dient zur Generierung fortlaufender oder regelbasiert erzeugter Geschäftskennungen."
keywords: "Sequenz,sequence,Kennung,automatische Nummerierung,NocoBase"
---

# Sequenz

## Einführung

In NocoBase wird **Sequenz (Sequence)** zur Generierung von Geschäftskennungen verwendet.

Sequenzfelder eignen sich für Bestellnummern, Vertragsnummern, Ticketnummern, Antragsnummern und andere Kennungen, die lesbaren Regeln folgen sollen. Im Gegensatz zu Primärschlüsseln dienen sie eher der geschäftlichen Darstellung und der manuellen Identifikation.

Wenn Sie lediglich eine intern eindeutige Kennung benötigen, verwenden Sie eine Snowflake-ID, UUID oder Nano-ID.

## Geeignete Einsatzszenarien

Sequenzen eignen sich für folgende geschäftliche Szenarien:

- Bestellnummern und Vertragsnummern
- Ticketnummern und Antragsnummern
- Anlagen- und Gerätenummern
- Kennungen mit Präfix, Datum oder fortlaufender Nummerierung

## Konfiguration erstellen

Öffnen Sie auf der Seite „Configure fields“ einer Datentabelle den Dialog „Add field“ und wählen Sie „Sequenz“, um ein Sequenzfeld zu erstellen.

![20240512173752](https://static-docs.nocobase.com/20240512173752.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Für Sequenzen entspricht er `sequence` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Bestellnummer“, „Vertragsnummer“ oder „Ticketnummer“. Es empfiehlt sich, einen für die zuständigen Mitarbeitenden unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Verweise in APIs, Beziehungsfeldern, Berechtigungen, Workflows usw. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. Der Speichertyp eines Sequenzfeldes hängt von der Sequenzregel ab und ist häufig `string`. |
| Default value | Standardwert. Beim Anlegen eines neuen Datensatzes kann dieser automatisch eingetragen werden, wenn der Benutzer keinen Wert eingibt. |
| Validation rules | Wird normalerweise vom System gemäß den Regeln generiert und muss nicht manuell geprüft werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Anpassungsaufwand zu vermeiden.

:::

## Feldeigenschaften

Das Sequenzfeld weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `sequence`. |
| Standardmäßiges Field type | `string`. |
| Verfügbare Field types | `string` und `integer`, abhängig von der tatsächlichen Sequenzkonfiguration. |
| Seitenkomponente | Wird normalerweise automatisch generiert und nach der Konfiguration der Nummerierungsregeln verwendet. |
| Filterung | Unterstützt die exakte Suche nach Kennungen sowie die Textfilterung. |
| Sortierung | Ob sich das Feld zur Sortierung eignet, hängt von den Nummerierungsregeln ab. |
| Validierung | Hängt von den Sequenzregeln ab; die Werte bleiben normalerweise eindeutig. |

## Konfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Sequenzfeldes zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise durch Änderung des Anzeigenamens, der Beschreibung, des Standardwerts, der Validierungsregeln oder feldspezifischer Einstellungen.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, wird bei der Bearbeitung normalerweise eine Feldzuordnung vorgenommen – das Datenbankfeld wird einem Field type und einem Field interface in NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den in der Benutzeroberfläche angezeigten Namen des Feldes, nicht jedoch dessen Bezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei Feldern der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Dies beeinflusst die Art der Eingabe, Darstellung und Validierung auf den Seiten. |
| Field type | Bedingt | Bei Feldern der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Vor der Änderung muss geprüft werden, ob vorhandene Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Ändert den Standardwert für neu angelegte Datensätze. |
| Validation rules | Ja | Ändert die Validierungsregeln des Feldes. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Das Wechseln von Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Dadurch können sich die Speichermethode, das Eingabekomponenten, die Validierungsregeln, die Filterbedingungen und die Verwendung von Workflow-Variablen ändern. Prüfen Sie bei größeren Datenmengen zunächst, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Sequenzfeld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten Sequenzfeldes werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Sequenzfelder eignen sich für Geschäftskennungen und Szenarien, in denen eine manuelle Suche erforderlich ist.
![20260710151731](https://static-docs.nocobase.com/20260710151731.png)

| Szenario | Verwendung |
| --- | --- |
| Datensatz erstellen | Automatische Generierung einer Geschäftskennung. |
| Tabellenblock | Anzeigen, Suchen und Filtern von Kennungen. |
| Detailblock | Lesbare Kennung des Datensatzes. |
| Workflows und Benachrichtigungen | Bezugnahme auf die Geschäftskennung in Genehmigungen und Benachrichtigungen. |

## Verwandte Links

- [Felder](../index.md) — Informationen zu Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabelle](../data-source-main/general-collection.md) — Felder in einer normalen Tabelle erstellen und verwalten
- [Einzeiliger Text](../data-modeling/collection-fields/basic/input.md) — Geschäftliche Kennungen manuell pflegen
- [Snowflake-ID](../data-modeling/collection-fields/advanced/snowflake-id.md) — Interne Primärschlüssel-IDs verwenden