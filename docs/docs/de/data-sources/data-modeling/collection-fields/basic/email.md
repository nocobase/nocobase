---
title: "E-Mail"
description: "Das E-Mail-Feld dient zum Speichern von E-Mail-Adressen und bietet eine Validierung des E-Mail-Formats."
keywords: "E-Mail,email,Kontaktinformationen,NocoBase"
---

# E-Mail

## Einführung

In NocoBase dient **E-Mail (Email)** zum Speichern von E-Mail-Adressen.

Das E-Mail-Feld eignet sich für die E-Mail-Adressen von Kunden, Mitarbeitern, Lieferanten und andere Kontaktinformationen. Im Vergleich zu einem gewöhnlichen einzeiligen Textfeld bietet es eine eindeutigere E-Mail-Semantik und eine Validierung des E-Mail-Formats.

Wenn der Inhalt keine E-Mail-Adresse, sondern eine allgemeine Kontaktinformation ist, eignet sich [einzeiliger Text](./input.md) besser.

## Geeignete Einsatzszenarien

Das E-Mail-Feld eignet sich für folgende Geschäftsszenarien:

- E-Mail-Adressen von Kunden und Kontakten
- E-Mail-Adressen von Mitarbeitern und Login-Kontaktadressen
- E-Mail-Adressen von Lieferanten und Service-Adressen
- Adressen für den Benachrichtigungsempfang

## Erstellung und Konfiguration

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „E-Mail“, um ein E-Mail-Feld zu erstellen.

![20240512175609](https://static-docs.nocobase.com/20240512175609.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Der Oberflächentyp des Feldes. Für E-Mail entspricht er `email` und legt fest, wie das Feld auf der Seite eingegeben und angezeigt wird. |
| Field display name | Der in der Oberfläche angezeigte Name des Feldes, z. B. „Kunden-E-Mail“, „Kontakt-E-Mail“ oder „Empfänger-E-Mail“. Es wird empfohlen, einen für die Fachanwender direkt verständlichen Namen zu verwenden. |
| Field name | Der Bezeichner des Feldes für interne Verweise, z. B. in APIs, Beziehungsfeldern, Berechtigungen und Workflows. Nach der Erstellung wird er normalerweise nicht mehr geändert. Er darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Der Typ des Feldes auf Datenebene. Für E-Mail ist standardmäßig `string` festgelegt. |
| Default value | Der Standardwert. Wenn beim Anlegen eines Datensatzes kein Wert eingegeben wird, kann automatisch der Standardwert verwendet werden. |
| Validation rules | Validierungsregeln. Normalerweise sollte die Validierung des E-Mail-Formats aktiviert werden; außerdem kann das Feld als Pflichtfeld konfiguriert werden. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder die verantwortliche Person angegeben werden. |

:::warning Hinweis

Der Feldname wird nach der Erstellung von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um späteren Anpassungsaufwand zu vermeiden.

:::

## Feldeigenschaften

Das E-Mail-Feld verhält sich standardmäßig wie folgt:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `email`. |
| Standardmäßiger Field type | `string`. |
| Optionaler Field type | `string`. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein Eingabefeld verwendet und das E-Mail-Format validiert. |
| Filterung | Unterstützt textbasierte Filter, z. B. enthält, ist gleich, ist leer und ist nicht leer. |
| Sortierung | Unterstützt die Sortierung in Tabellenblöcken. |
| Validierung | Unterstützt unter anderem die Validierung des E-Mail-Formats und die Pflichtfeldvalidierung. |

## Feldeinstellungen bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des E-Mail-Feldes zu bearbeiten. Die Bearbeitung eines Feldes dient hauptsächlich dazu, seine Anzeige und Verwendung in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, den Standardwert, die Validierungsregeln oder feldspezifische Einstellungen zu ändern.

Wenn das Feld aus einer bereits synchronisierten Tabelle der Hauptdatenbank stammt, handelt es sich bei der Bearbeitung normalerweise um eine Feldzuordnung: Das Datenbankfeld wird einem Field type und einem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den in der Oberfläche angezeigten Namen des Feldes, ohne den Feldbezeichner zu ändern. |
| Field name | Nein | Der Feldbezeichner kann im Bearbeitungsformular nach der Erstellung normalerweise nicht geändert werden. |
| Field interface | Bedingt unterstützt | Bei Feldern der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Dies beeinflusst die Eingabe, Anzeige und Validierung auf der Seite. |
| Field type | Bedingt unterstützt | Bei Feldern der Hauptdatenbank oder synchronisierten Feldern kann die Zuordnung angepasst werden. Vor der Anpassung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Default value | Ja | Passt den Standardwert für neu angelegte Datensätze an. |
| Validation rules | Ja | Passt die Validierungsregeln des Feldes an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder die verantwortliche Person. |

:::warning Hinweis

Der Wechsel des Field type oder Field interface ist nicht mit einer einfachen Änderung des Anzeigenamens gleichzusetzen. Er beeinflusst die Speicherweise des Feldes, die Eingabekomponente, Validierungsregeln, Filterbedingungen und die Verwendung von Variablen in Workflows. Bei einer größeren Menge vorhandener Daten sollte zunächst geprüft werden, ob das Datenformat kompatibel ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das E-Mail-Feld zu löschen. In der Hauptdatenbank können Sie außerdem mehrere Felder auswählen und gemeinsam löschen.

Beim Löschen eines in der Hauptdatenbank neu erstellten E-Mail-Feldes werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus einer Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und der Herkunft des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinflussen. Prüfen Sie vor dem Löschen, ob das Feld noch von geschäftlichen Konfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Das E-Mail-Feld eignet sich für Formulare, Detailansichten und Benachrichtigungsprozesse.
![20260709224700](https://static-docs.nocobase.com/20260709224700.png)

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Eingabe einer E-Mail-Adresse. |
| Detailblock | Anzeige einer E-Mail-Adresse. |
| Filterblock | Filtern von Datensätzen nach E-Mail-Adresse. |
| Workflows und Benachrichtigungen | Als Quelle für die Empfänger von E-Mail-Benachrichtigungen. |

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über die Funktionen, Kategorien und Zuordnungslogik von Feldern
- [Standardtabelle](../../../data-source-main/general-collection.md) — Felder in einer Standardtabelle erstellen und verwalten
- [Einzeiliger Text](./input.md) — Gewöhnliche kurze Texte speichern
- [Handynummer](./phone.md) — Telefonnummern speichern