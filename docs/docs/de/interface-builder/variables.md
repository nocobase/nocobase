:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Variablen

## Einführung

Variablen sind Marker, die einen Wert im aktuellen Kontext identifizieren. Sie können in verschiedenen Szenarien eingesetzt werden, zum Beispiel beim Konfigurieren von Datenbereichen für Blöcke, Standardwerten für Felder, Verknüpfungsregeln und Workflows.

![20251030114458](https://static-docs.nocobase.com/20251030114458.png)

## Derzeit unterstützte Variablen

### Aktueller Benutzer

Stellt die Daten des aktuell angemeldeten Benutzers dar.

![20240416154950](https://static-docs.nocobase.com/20240416154950.png)

### Aktuelle Rolle

Stellt den Rollenbezeichner (Rollenname) des aktuell angemeldeten Benutzers dar.

![20240416155100](https://static-docs.nocobase.com/20240416155100.png)

### Aktuelles Formular

Die Werte des aktuellen Formulars, die nur in Formularblöcken verwendet werden. Anwendungsfälle sind:

- Verknüpfungsregeln für das aktuelle Formular
- Standardwerte für Formularfelder (nur beim Hinzufügen neuer Daten wirksam)
- Datenbereichseinstellungen für Beziehungsfelder
- Konfiguration der Feldwertzuweisung für Sendeaktionen

#### Verknüpfungsregeln für das aktuelle Formular

![20251027114920](https://static-docs.nocobase.com/20251027114920.png)

#### Standardwerte für Formularfelder (nur bei neuen Formularen)

![20251027115016](https://static-docs.nocobase.com/20251027115016.png)

<!-- ![20240416171129_rec_](https://static-docs.nocobase.com/20240416171129_rec_.gif) -->

#### Datenbereichseinstellungen für Beziehungsfelder

Wird verwendet, um die Optionen eines nachgelagerten Feldes dynamisch basierend auf einem übergeordneten Feld zu filtern und so eine genaue Dateneingabe zu gewährleisten.

**Beispiel:**

1. Der Benutzer wählt einen Wert für das Feld **Owner** aus.
2. Das System filtert die Optionen für das Feld **Account** automatisch basierend auf dem **userName** des ausgewählten Owners.

![20251030151928](https://static-docs.nocobase.com/20251030151928.png)

<!-- ![20240416171743_rec_](https://static-docs.nocobase.com/20240416171743_rec_.gif) -->

<!-- #### Konfiguration der Feldwertzuweisung für Sendeaktionen

![20240416171215_rec_](https://static-docs.nocobase.com/20240416171215_rec_.gif) -->

<!-- ### Aktuelles Objekt

Wird derzeit nur für die Feldkonfiguration in Unterformularen und Untertabellen innerhalb eines Formularblocks verwendet und stellt den Wert jedes Elements dar:

- Standardwert für Unterfelder
- Datenbereich für Unterbeziehungsfelder

#### Standardwert für Unterfelder

![20240416172933_rec_](https://static-docs.nocobase.com/20240416172933_rec_.gif)

#### Datenbereich für Unterbeziehungsfelder

![20240416173043_rec_](https://static-docs.nocobase.com/20240416173043_rec_.gif) -->

<!-- ### Übergeordnetes Objekt

Ähnlich wie „Aktuelles Objekt“ stellt es das übergeordnete Objekt des aktuellen Objekts dar. Wird in NocoBase v1.3.34-beta und höher unterstützt. -->

### Aktueller Datensatz

Ein Datensatz bezieht sich auf eine Zeile in einer Sammlung, wobei jede Zeile einen einzelnen Datensatz darstellt. Die Variable „Aktueller Datensatz“ ist in den **Verknüpfungsregeln für Zeilenaktionen** von Anzeige-Blöcken verfügbar.

Beispiel: Deaktivieren Sie die Schaltfläche zum Löschen für „bezahlte“ Belege.

![20251027120217](https://static-docs.nocobase.com/20251027120217.png)

### Aktueller Popup-Datensatz

Popup-Aktionen spielen eine sehr wichtige Rolle bei der NocoBase-Oberflächenkonfiguration.

- Popup für Zeilenaktionen: Jedes Popup verfügt über eine Variable „Aktueller Popup-Datensatz“, die den aktuellen Zeilendatensatz darstellt.
- Popup für Beziehungsfelder: Jedes Popup verfügt über eine Variable „Aktueller Popup-Datensatz“, die den aktuell angeklickten Beziehungsdatensatz darstellt.

Blöcke innerhalb eines Popups können die Variable „Aktueller Popup-Datensatz“ verwenden. Verwandte Anwendungsfälle sind:

- Konfigurieren des Datenbereichs eines Blocks
- Konfigurieren des Datenbereichs eines Beziehungsfeldes
- Konfigurieren von Standardwerten für Felder (in einem Formular zum Hinzufügen neuer Daten)
- Konfigurieren von Verknüpfungsregeln für Aktionen

<!-- #### Konfigurieren des Datenbereichs eines Blocks

![20251027151107](https://static-docs.nocobase.com/20251027151107.png)

#### Konfigurieren des Datenbereichs eines Beziehungsfeldes

![20240416224641_rec_](https://static-docs.nocobase.com/20240416224641_rec_.gif)

#### Konfigurieren von Standardwerten für Felder (in einem Formular zum Hinzufügen neuer Daten)

![20240416223846_rec_](https://static-docs.nocobase.com/20240416223846_rec_.gif)

#### Konfigurieren von Verknüpfungsregeln für Aktionen

![20240416223101_rec_](https://static-docs.nocobase.com/20240416223101_rec_.gif)

<!--
#### Konfiguration der Feldwertzuweisung für Formular-Sendeaktionen

![20240416224014_rec_](https://static-docs.nocobase.com/20240416224014_rec_.gif) -->

<!-- ### Ausgewählte Tabellendatensätze

Wird derzeit nur für den Standardwert von Formularfeldern in der Aktion „Datensatz hinzufügen“ eines Tabellenblocks verwendet

#### Standardwert von Formularfeldern für die Aktion „Datensatz hinzufügen“ -->

<!-- ### Übergeordneter Datensatz (veraltet)

Wird nur in Beziehungsblöcken verwendet und stellt den Quelldatensatz der Beziehungsdaten dar.

:::warning
„Übergeordneter Datensatz“ ist veraltet. Es wird empfohlen, stattdessen den gleichwertigen „Aktuellen Popup-Datensatz“ zu verwenden.
:::

<!-- ### Datumsvariablen

Datumsvariablen sind dynamisch parsierbare Datumplatzhalter, die im System verwendet werden können, um Datenbereiche für Blöcke, Datenbereiche für Beziehungsfelder, Datumsbedingungen in Aktionsverknüpfungsregeln und Standardwerte für Datumsfelder festzulegen. Die Parsierungsmethode von Datumsvariablen variiert je nach Anwendungsfall: In Zuweisungsszenarien (wie dem Festlegen von Standardwerten) werden sie in bestimmte Zeitpunkte geparst; in Filterszenarien (wie Datumsbereichsbedingungen) werden sie in Zeitperiodenbereiche geparst, um eine flexiblere Filterung zu unterstützen.

#### Filterszenarien

Verwandte Anwendungsfälle sind:

- Festlegen von Datumsfeldbedingungen für Block-Datenbereiche
- Festlegen von Datumsfeldbedingungen für Beziehungsfeld-Datenbereiche
- Festlegen von Datumsfeldbedingungen für Aktionsverknüpfungsregeln

![20250522211606](https://static-docs.nocobase.com/20250522211606.png)

Verwandte Variablen sind:

- Aktuelle Zeit
- Gestern
- Heute
- Morgen
- Letzte Woche
- Diese Woche
- Nächste Woche
- Letzter Monat
- Dieser Monat
- Nächster Monat
- Letztes Quartal
- Dieses Quartal
- Nächstes Quartal
- Letztes Jahr
- Dieses Jahr
- Nächstes Jahr
- Letzte 7 Tage
- Nächste 7 Tage
- Letzte 30 Tage
- Nächste 30 Tage
- Letzte 90 Tage
- Nächste 90 Tage

#### Zuweisungsszenarien

In Zuweisungsszenarien wird dieselbe Datumsvariable automatisch in verschiedene Formate geparst, basierend auf dem Typ des Zielfeldes. Wenn Sie beispielsweise „Heute“ verwenden, um verschiedenen Arten von Datumsfeldern einen Wert zuzuweisen:

- Für Zeitstempel-Felder (Timestamp) und Datums-/Uhrzeitfelder mit Zeitzone (DateTime with timezone) wird die Variable in einen vollständigen UTC-Zeitstring geparst, z. B. 2024-04-20T16:00:00.000Z, der Zeitzoneninformationen enthält und für die Synchronisierung über Zeitzonen hinweg geeignet ist.

- Für Datums-/Uhrzeitfelder ohne Zeitzone (DateTime without timezone) wird die Variable in einen lokalen Zeitformatstring geparst, z. B. 2025-04-21 00:00:00, ohne Zeitzoneninformationen, was für die lokale Geschäftslogikverarbeitung besser geeignet ist.

- Für reine Datumsfelder (DateOnly) wird die Variable in einen reinen Datumsstring geparst, z. B. 2025-04-21, der nur Jahr, Monat und Tag ohne Zeitangabe enthält.

Das System parst die Variable intelligent basierend auf dem Feldtyp, um das korrekte Format während der Zuweisung sicherzustellen und Datenfehler oder Ausnahmen durch Typkonflikte zu vermeiden.

![20250522212802](https://static-docs.nocobase.com/20250522212802.png)

Verwandte Anwendungsfälle sind:

- Festlegen von Standardwerten für Datumsfelder in Formularblöcken
- Festlegen des Wertattributs für Datumsfelder in Verknüpfungsregeln
- Zuweisen von Werten zu Datumsfeldern in Sende-Schaltflächen

Verwandte Variablen sind:

- Jetzt
- Gestern
- Heute
- Morgen -->

### URL-Abfrageparameter

Diese Variable stellt die Abfrageparameter in der URL der aktuellen Seite dar. Sie ist nur verfügbar, wenn ein Abfrage-String in der Seiten-URL vorhanden ist. Die Verwendung in Verbindung mit der [Link-Aktion](/interface-builder/actions/types/link) ist bequemer.

![20251027173017](https://static-docs.nocobase.com/20251027173017.png)

![20251027173121](https://static-docs.nocobase.com/20251027173121.png)

### API-Token

Der Wert dieser Variable ist ein String, der als Zugangsdaten für den Zugriff auf die NocoBase API dient. Er kann zur Überprüfung der Benutzeridentität verwendet werden.

### Aktueller Gerätetyp

Beispiel: Zeigen Sie die Aktion „Vorlagen drucken“ auf Nicht-Desktop-Geräten nicht an.

![20251029215303](https://static-docs.nocobase.com/20251029215303.png)