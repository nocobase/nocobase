:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

## Konfigurationsanleitung

### Aktivierung der Vorlagen-Druckfunktion
Der Vorlagendruck unterstützt derzeit Detail-Blöcke und Tabellen-Blöcke. Im Folgenden werden die Konfigurationsmöglichkeiten für diese beiden Blocktypen separat erläutert.

#### Detail-Blöcke

1.  **Detail-Block öffnen**:
    *   Navigieren Sie in der Anwendung zu dem Detail-Block, in dem Sie die Vorlagen-Druckfunktion nutzen möchten.

2.  **Konfigurationsmenü aufrufen**:
    *   Klicken Sie oben in der Benutzeroberfläche auf das Menü „Konfiguration“.

3.  **„Vorlagendruck“ auswählen**:
    *   Klicken Sie im Dropdown-Menü auf die Option „Vorlagendruck“, um die Plugin-Funktion zu aktivieren.

![Vorlagendruck aktivieren](https://static-docs.nocobase.com/20241212150539-2024-12-12-15-05-43.png)

### Vorlagen konfigurieren

1.  **Vorlagen-Konfigurationsseite aufrufen**:
    *   Wählen Sie im Konfigurationsmenü der Schaltfläche „Vorlagendruck“ die Option „Vorlagenkonfiguration“.

![Option „Vorlagenkonfiguration“](https://static-docs.nocobase.com/20241212151858-2024-12-12-15-19-01.png)

2.  **Neue Vorlage hinzufügen**:
    *   Klicken Sie auf die Schaltfläche „Vorlage hinzufügen“, um die Seite zum Hinzufügen von Vorlagen aufzurufen.

![Schaltfläche „Vorlage hinzufügen“](https://static-docs.nocobase.com/20241212151243-2024-12-12-15-12-46.png)

3.  **Vorlageninformationen eingeben**:
    *   Geben Sie im Vorlagenformular den Vorlagennamen ein und wählen Sie den Vorlagentyp (Word, Excel, PowerPoint) aus.
    *   Laden Sie die entsprechende Vorlagendatei hoch (Formate `.docx`, `.xlsx`, `.pptx` werden unterstützt).

![Vorlagennamen und -datei konfigurieren](https://static-docs.nocobase.com/20241212151518-2024-12-12-15-15-21.png)

4.  **Vorlage bearbeiten und speichern**:
    *   Navigieren Sie zur Seite „Feldliste“, kopieren Sie die Felder und fügen Sie diese in die Vorlage ein.
      ![Feldliste](https://static-docs.nocobase.com/20250107141010.png)
      ![20241212152743-2024-12-12-15-27-45](https://static-docs.nocobase.com/20241212152743-2024-12-12-15-27-45.png)
    *   Nachdem Sie die Details ausgefüllt haben, klicken Sie auf die Schaltfläche „Speichern“, um die Vorlage hinzuzufügen.

5.  **Vorlagenverwaltung**:
    *   Klicken Sie auf die Schaltfläche „Verwenden“ rechts neben der Vorlagenliste, um die Vorlage zu aktivieren.
    *   Klicken Sie auf die Schaltfläche „Bearbeiten“, um den Vorlagennamen zu ändern oder die Vorlagendatei zu ersetzen.
    *   Klicken Sie auf die Schaltfläche „Herunterladen“, um die konfigurierte Vorlagendatei herunterzuladen.
    *   Klicken Sie auf die Schaltfläche „Löschen“, um nicht mehr benötigte Vorlagen zu entfernen. Das System fordert Sie zur Bestätigung auf, um ein versehentliches Löschen zu vermeiden.
      ![Vorlagenverwaltung](https://static-docs.nocobase.com/20250107140436.png)

#### Tabellen-Blöcke

Die Verwendung von Tabellen-Blöcken ist im Wesentlichen dieselbe wie die von Detail-Blöcken, mit folgenden Unterschieden:

1.  **Unterstützung für den Druck mehrerer Datensätze**: Sie müssen zuerst die zu druckenden Datensätze auswählen. Es können maximal 100 Datensätze gleichzeitig gedruckt werden.
    
![20250416215633-2025-04-16-21-56-35](https://static-docs.nocobase.com/20250416215633-2025-04-16-21-56-35.png)

2.  **Getrennte Vorlagenverwaltung**: Vorlagen für Tabellen-Blöcke und Detail-Blöcke sind nicht austauschbar – da die Datenstrukturen unterschiedlich sind (ein Objekt und ein Array).