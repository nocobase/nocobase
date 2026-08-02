---
title: "Chinesische Verwaltungsregion"
description: "Das Feld „Chinesische Verwaltungsregion“ dient zum Speichern von Informationen zu chinesischen Verwaltungsgebieten wie Provinzen, Städten und Bezirken/Landkreisen. Es unterstützt eine dreistufige kaskadierende Auswahl und die hierarchische Darstellung."
keywords: "Chinesische Verwaltungsregion, Provinz-Stadt-Bezirk, Feld für Verwaltungsgebiete, dreistufige Auswahl,NocoBase"
---

# Chinesische Verwaltungsregion

<PluginInfo name="field-china-region"></PluginInfo>

## Einführung

In NocoBase dient **Chinesische Verwaltungsregion (China region)** zum Speichern von Informationen zu chinesischen Verwaltungsgebieten wie Provinzen, Städten und Bezirken/Landkreisen.

Das Feld „Chinesische Verwaltungsregion“ basiert auf der integrierten `chinaRegions`-Datentabelle für Verwaltungsgebiete. Auf der Seite werden die Daten über einen kaskadierenden Auswahlbereich eingegeben. Benutzer können nacheinander eine Provinz, eine Stadt und einen Bezirk auswählen. Bei der Anzeige werden die Ebenen zu einem vollständigen Pfad zusammengefügt.

Wenn auch detaillierte Adressangaben wie Straße und Hausnummer gespeichert werden sollen, kann das Feld zusammen mit einem Feld für [einzeiligen Text](../basic/input.md) oder [mehrzeiligen Text](../basic/textarea.md) verwendet werden.

## Geeignete Einsatzszenarien

„Chinesische Verwaltungsregion“ eignet sich für folgende geschäftliche Szenarien:

- Standort von Kunden, Kontakten, Filialen und Projekten
- Grundlegende Adressinformationen wie Haushaltsregistrierungsort, Herkunftsort und Liefergebiet
- Servicegebiete, Vertriebsgebiete und Gebiete der Projektdurchführung
- Daten, die nach Provinz, Stadt und Bezirk gefiltert oder ausgewertet werden müssen

## Konfiguration erstellen

Klicken Sie auf der Seite „Configure fields“ der Datentabelle auf „Add field“ und wählen Sie „Chinesische Verwaltungsregion“, um ein entsprechendes Feld zu erstellen.

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

| Konfiguration | Beschreibung |
| --- | --- |
| Field interface | Oberflächentyp des Feldes. Für „Chinesische Verwaltungsregion“ entspricht er `chinaRegion` und bestimmt, wie die Eingabe und Anzeige auf der Seite erfolgt. |
| Field display name | Name, unter dem das Feld in der Benutzeroberfläche angezeigt wird, z. B. „Standort“, „Servicegebiet“ oder „Liefergebiet“. Es wird empfohlen, einen für die zuständigen Mitarbeiter unmittelbar verständlichen Namen zu verwenden. |
| Field name | Bezeichner des Feldes für interne Referenzen in API, Beziehungsfeldern, Berechtigungen, Workflows usw. Er wird nach der Erstellung in der Regel nicht mehr geändert, darf nur Buchstaben, Zahlen und Unterstriche enthalten und muss mit einem Buchstaben beginnen. |
| Field type | Datentyp des Feldes auf Datenebene. „Chinesische Verwaltungsregion“ wird normalerweise als verknüpfter Datensatz oder als strukturierter Wert gespeichert. Maßgeblich ist die konkrete Feldkonfiguration. |
| Auswahlstufe | Steuert, bis zu welcher tiefsten Ebene eine Auswahl möglich ist. Derzeit werden „Provinz“, „Stadt“ und „Bezirk“ unterstützt. Standardmäßig ist „Bezirk“ ausgewählt. |
| Auswahl bis zur letzten Ebene erforderlich | Wenn diese Option aktiviert ist, muss der Benutzer bis zur konfigurierten tiefsten Ebene auswählen, bevor er den Eintrag absenden kann. Ist sie deaktiviert, kann die Auswahl auch auf einer mittleren Ebene abgeschlossen werden. |
| Validation rules | Validierungsregeln. In der Regel werden hier die Pflichtangabe und die Auswahlstufe konfiguriert. |
| Description | Beschreibung des Feldes. Hier können die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person dokumentiert werden. |

:::warning Hinweis

Der Feldname wird von Seitenblöcken, Berechtigungen, Workflows und APIs referenziert. Prüfen Sie die Benennung vor der Erstellung sorgfältig, um spätere Konfigurationsanpassungen zu vermeiden.

:::

## Feldeigenschaften

Das Feld „Chinesische Verwaltungsregion“ weist standardmäßig folgende Eigenschaften auf:

| Eigenschaft | Beschreibung |
| --- | --- |
| Standardmäßiges Field interface | `chinaRegion`. |
| Datenquelle | Integrierte `chinaRegions`-Datentabelle für Verwaltungsgebiete. |
| Seitenkomponente | Im Bearbeitungsmodus wird ein kaskadierender Auswahlbereich verwendet. |
| Auswahlstufen | Derzeit werden die drei Ebenen Provinz, Stadt und Bezirk unterstützt. |
| Darstellungsweise | Im Lesemodus wird der Wert hierarchisch als `省 / 市 / 区` angezeigt. |
| Filterung | Eine Filterung nach gespeicherten Gebietsangaben wird unterstützt. Der genaue Funktionsumfang hängt von der Feldkonfiguration und dem Seitenblock ab. |
| Mehrfachauswahl | Mehrfachauswahl wird nicht unterstützt. |

## Feldkonfiguration bearbeiten

Klicken Sie nach der Erstellung rechts neben dem Feld auf „Edit“, um die Konfiguration des Feldes „Chinesische Verwaltungsregion“ zu bearbeiten. Die Bearbeitung dient hauptsächlich dazu, die Darstellung und Verwendung des Feldes in NocoBase anzupassen, beispielsweise den Anzeigenamen, die Beschreibung, die Validierungsregeln, die Auswahlstufe oder die Pflicht zur Auswahl bis zur letzten Ebene zu ändern.

Wenn das Feld aus einer bereits mit der Hauptdatenbank synchronisierten Tabelle stammt, wird bei der Bearbeitung in der Regel eine Feldzuordnung vorgenommen – das Datenbankfeld wird dem Field type und dem Field interface von NocoBase zugeordnet.

| Konfiguration | Bearbeitbar | Beschreibung |
| --- | --- | --- |
| Field display name | Ja | Ändert den in der Benutzeroberfläche angezeigten Namen des Feldes, nicht jedoch den Feldbezeichner. |
| Field name | Nein | Der Feldbezeichner kann nach der Erstellung normalerweise nicht im Bearbeitungsformular geändert werden. |
| Field interface | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann diese Einstellung angepasst werden. Änderungen wirken sich auf Eingabe, Anzeige und Validierung auf der Seite aus. |
| Field type | Bedingt | Bei der Zuordnung von Feldern aus der Hauptdatenbank oder synchronisierten Feldern kann diese Einstellung angepasst werden. Vor der Änderung muss geprüft werden, ob die vorhandenen Daten mit dem neuen Typ verwendet werden können. |
| Auswahlstufe | Ja | Passt an, ob die Auswahl bis zur Provinz, Stadt oder zum Bezirk möglich ist. |
| Auswahl bis zur letzten Ebene erforderlich | Ja | Steuert, ob beim Absenden bis zur konfigurierten tiefsten Ebene ausgewählt werden muss. |
| Validation rules | Ja | Passt Validierungsregeln wie die Pflichtangabe an. |
| Description | Ja | Ergänzt die Bedeutung des Feldes, Eingabeanforderungen, Datenquelle oder zuständige Person. |

:::warning Hinweis

Das Feld „Chinesische Verwaltungsregion“ hängt von der durch das Plugin bereitgestellten `chinaRegions`-Datentabelle ab. Stellen Sie vor der Verwendung sicher, dass das Feld-Plugin „Chinesische Verwaltungsgebiete“ aktiviert ist.

:::

## Feld löschen

Klicken Sie rechts neben dem Feld auf „Delete“, um das Feld „Chinesische Verwaltungsregion“ zu löschen. In der Hauptdatenbank können Sie auch mehrere Felder auswählen und gesammelt löschen.

Beim Löschen eines neu in der Hauptdatenbank erstellten Feldes „Chinesische Verwaltungsregion“ werden normalerweise auch die entsprechende physische Spalte in der Datenbank und die darin vorhandenen Daten gelöscht. Beim Löschen eines aus der Datenbank synchronisierten oder aus einer externen Datenquelle zugeordneten Feldes hängt der Umfang der Auswirkungen von der jeweiligen Datenquelle und dem Ursprung des Feldes ab.

:::danger Warnung

Das Löschen eines Feldes kann Seitenblöcke, Formulare, Filter, Berechtigungen, Workflows, APIs, Importe und Exporte sowie vorhandene Daten beeinträchtigen. Prüfen Sie vor dem Löschen, ob das Feld noch von Geschäftskonfigurationen verwendet wird.

:::

## Verwendung in der Seitenkonfiguration

Das Feld „Chinesische Verwaltungsregion“ eignet sich für Adress-, Gebiets- und Auswertungsszenarien.

| Szenario | Verwendung |
| --- | --- |
| Formularblock | Auswahl von Provinz, Stadt und Bezirk/Landkreis über einen kaskadierenden Auswahlbereich. |
| Detailblock | Anzeige des Pfads des Verwaltungsgebiets. |
| Tabellenblock | Anzeige des Gebiets, zu dem der Datensatz gehört. |
| Filterblock | Filtern von Datensätzen nach Gebiet. |
| Diagrammblock | Auswertung von Geschäftsdaten nach Provinz, Stadt und Bezirk. |

### Bearbeitungsmodus

Im Bearbeitungsmodus wird das Feld „Chinesische Verwaltungsregion“ als kaskadierender Auswahlbereich angezeigt.

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

### Lesemodus

Im Lesemodus wird das Feld „Chinesische Verwaltungsregion“ als Textpfad angezeigt, zum Beispiel:

```text
北京市 / 市辖区 / 东城区
```

## Verwandte Links

- [Felder](../index.md) — Erfahren Sie mehr über Zweck, Kategorien und Zuordnungslogik von Feldern
- [Normale Tabellen](../../../data-source-main/general-collection.md) — Felder in normalen Tabellen erstellen und verwalten
- [Einzeiliger Text](../basic/input.md) — Detaillierte Adressangaben speichern
- [Mehrzeiliger Text](../basic/textarea.md) — Längere Adressbeschreibungen speichern