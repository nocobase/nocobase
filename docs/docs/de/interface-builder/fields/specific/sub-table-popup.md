:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/interface-builder/fields/specific/sub-table-popup).
:::

# Untertabelle (Bearbeiten im Pop-up)

## Einführung

Die Untertabelle (Bearbeiten im Pop-up) wird verwendet, um Daten mit Mehrfachverknüpfungen (wie One-to-Many oder Many-to-Many) innerhalb eines Formulars zu verwalten. Die Tabelle zeigt nur die aktuell verknüpften Datensätze an. Das Hinzufügen oder Bearbeiten von Datensätzen erfolgt in einem Pop-up, und die Daten werden gemeinsam mit dem Hauptformular in die Datenbank übertragen.

## Verwendung

![20260212152204](https://static-docs.nocobase.com/20260212152204.png)

**Anwendungsbereiche:**

- Verknüpfungsfelder: O2M / M2M / MBM
- Typische Anwendungen: Bestelldetails, Unterelementlisten, verknüpfte Tags/Mitglieder usw.

## Feldkonfiguration

### Auswahl vorhandener Daten zulassen (Standard: Aktiviert)

Ermöglicht die Auswahl von Verknüpfungen aus bestehenden Datensätzen.

![20260212152312](https://static-docs.nocobase.com/20260212152312.png)

![20260212152343](https://static-docs.nocobase.com/20260212152343.gif)

### Feldkomponente

[Feldkomponente](/interface-builder/fields/association-field): Wechseln Sie zu anderen Komponenten für Verknüpfungsfelder, wie z. B. Dropdown-Auswahl, Sammlungsauswahl usw.

### Aufheben der Verknüpfung vorhandener Daten zulassen (Standard: Aktiviert)

> Steuert, ob die Verknüpfung bestehender Daten im Bearbeitungsformular aufgehoben werden darf. Neu hinzugefügte Daten können immer entfernt werden.

![20260212165752](https://static-docs.nocobase.com/20260212165752.gif)

### Hinzufügen zulassen (Standard: Aktiviert)

Steuert, ob die Schaltfläche „Hinzufügen“ angezeigt wird. Wenn der Benutzer keine `create`-Berechtigungen für die Ziel-Sammlung hat, wird die Schaltfläche deaktiviert und ein Hinweis auf fehlende Berechtigungen angezeigt.

### Schnelle Bearbeitung zulassen (Standard: Deaktiviert)

Wenn diese Option aktiviert ist, erscheint beim Bewegen des Mauszeigers über eine Zelle ein Bearbeitungssymbol, mit dem der Zelleninhalt schnell geändert werden kann.

Sie können die schnelle Bearbeitung für alle Felder über die Einstellungen der Verknüpfungsfeld-Komponente aktivieren.

![20260212165102](https://static-docs.nocobase.com/20260212165102.png)

Sie kann auch für einzelne Spaltenfelder aktiviert werden.

![20260212165025](https://static-docs.nocobase.com/20260212165025.png)

![20260212165201](https://static-docs.nocobase.com/20260212165201.gif)

### Seitengröße (Standard: 10)

Legt die Anzahl der Datensätze fest, die pro Seite in der Untertabelle angezeigt werden.

## Verhaltenshinweise

- Bei der Auswahl vorhandener Datensätze wird eine Duplikatsprüfung basierend auf dem Primärschlüssel durchgeführt, um doppelte Verknüpfungen desselben Datensatzes zu vermeiden.
- Neu hinzugefügte Datensätze werden direkt in die Untertabelle übernommen, und die Ansicht springt automatisch auf die Seite, die den neuen Datensatz enthält.
- Die Inline-Bearbeitung ändert nur die Daten der aktuellen Zeile.
- Das Entfernen eines Datensatzes hebt nur die Verknüpfung innerhalb des aktuellen Formulars auf; die Quelldaten in der Datenbank werden nicht gelöscht.
- Die Daten werden erst beim Absenden des Hauptformulars gesammelt in der Datenbank gespeichert.