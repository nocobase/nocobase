---
title: "Chinesische Verwaltungsregionen"
description: "Feld für chinesische Verwaltungsregionen, unterstützt die kaskadierte Auswahl von Provinz, Stadt und Bezirk – geeignet für Adressen, Herkunftsangaben und ähnliche Szenarien."
keywords: "Chinesische Verwaltungsregionen,Provinz Stadt Bezirk,Verwaltungsregionsfeld,Kaskadenauswahl,NocoBase"
---

# Chinesische Verwaltungsregionen

<PluginInfo name="field-china-region"></PluginInfo>

## Einführung

Das Feld für chinesische Verwaltungsregionen wird verwendet, um Informationen zu chinesischen Verwaltungsregionen wie Provinz, Stadt und Bezirk in Datentabellen zu speichern. Das Feld basiert auf der eingebauten Datentabelle `chinaRegions` mit Verwaltungsregionsdaten und stellt einen kaskadierten Auswahldialog bereit, in dem Benutzer im Formular hierarchisch Provinz, Stadt und Bezirk auswählen können.

Anwendungsszenarien:

- Standortangabe von Kunden, Kontakten, Filialen, Projekten usw.
- Grundlegende Adressinformationen wie Wohnsitz, Geburtsort oder Lieferregion
- Daten, die nach Provinz, Stadt und Bezirk gefiltert oder ausgewertet werden müssen

Der Feldwert wird als Beziehungseintrag gespeichert und ist standardmäßig mit der Datentabelle `chinaRegions` verknüpft, wobei die Anzeige nach der Hierarchie der Verwaltungsregionen sortiert wird. Zum Beispiel wird nach Auswahl von „Peking / Stadtbezirke / Bezirk Dongcheng" der vollständige Pfad in der Anzeige zusammengesetzt.

## Feldkonfiguration

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

Beim Anlegen des Feldes wählen Sie als Feldtyp „Chinesische Verwaltungsregionen" und können die folgenden Optionen konfigurieren:

| Konfigurationsoption | Beschreibung |
| --- | --- |
| Auswahlebene | Steuert die tiefste auswählbare Ebene. Aktuell werden „Provinz", „Stadt" und „Bezirk" unterstützt, Standard ist „Bezirk". „Straße" und „Dorf" sind in der Oberfläche deaktiviert. |
| Auswahl bis zur letzten Ebene erforderlich | Wenn aktiviert, müssen Benutzer bis zur konfigurierten tiefsten Ebene auswählen, um abzusenden; ist die Option deaktiviert, kann die Auswahl auch auf einer Zwischenebene abgeschlossen werden. |

## Verwendung in der Oberfläche

Im Formular wird das Feld für chinesische Verwaltungsregionen als kaskadierter Auswahldialog angezeigt:

1. Beim Öffnen des Dropdowns werden die Daten der Provinzebene geladen.
2. Beim Aufklappen einer Provinz werden die zugehörigen Städte bei Bedarf nachgeladen.
3. Beim weiteren Aufklappen einer Stadt werden die Bezirke bei Bedarf nachgeladen.
4. Nach dem Speichern wird das Feld in Detailansichten, Tabellen und ähnlichen Anzeigen hierarchisch als `Provinz/Stadt/Bezirk` dargestellt.

Das Feld unterstützt gängige Formularkonfigurationen wie Feldtitel, Beschreibung, Pflichtfeld, Standardwert und Lesemodus. Im Lesemodus wird das Feld als Textpfad angezeigt, zum Beispiel:

```text
Peking / Stadtbezirke / Bezirk Dongcheng
```

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

## Hinweise

- Das Feld für chinesische Verwaltungsregionen unterstützt aktuell nur die Auswahl eines einzelnen Pfades, keine Mehrfachauswahl.
- Aktuell sind die Datenebenen Provinz, Stadt und Bezirk eingebaut und aktiviert; Optionen auf Straßen- und Dorfebene sind derzeit nicht auswählbar.
- Beim Import müssen die Namen mit den eingebauten Verwaltungsregionsdaten übereinstimmen und nach Hierarchie mit `/` getrennt werden.
- Das Feld benötigt die vom Plugin bereitgestellte Datentabelle `chinaRegions`. Stellen Sie sicher, dass das Plugin „Chinesische Verwaltungsregionen" aktiviert ist.
