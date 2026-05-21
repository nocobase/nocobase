# Lokalisierungsverwaltung

## Einführung

Das Lokalisierungsverwaltungs-Plugin wird verwendet, um die Lokalisierungsressourcen von NocoBase zu verwalten und zu implementieren. Es kann Systemmenüs, Sammlungen, Felder sowie alle Plugins übersetzen, um sie an die Sprache und Kultur bestimmter Regionen anzupassen.

Wenn Sie Standardübersetzungen für das System und offizielle Plugins zu NocoBase beitragen möchten, lesen Sie [Übersetzungsbeitrag](/get-started/translations).

## Installation

Dieses Plugin ist ein integriertes Plugin und erfordert keine zusätzliche Installation.

## Verwendungshinweise

### Plugin aktivieren

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Lokalisierungsverwaltungsseite aufrufen

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Übersetzungsbegriffe synchronisieren

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Derzeit wird die Synchronisierung folgender Inhalte unterstützt:

- Lokale Sprachpakete des Systems und der Plugins
- Titel von Sammlungen, Feldtitel und Beschriftungen von Feldoptionen
- Menütitel

Nach Abschluss der Synchronisierung listet das System alle übersetzbaren Begriffe der aktuellen Sprache auf.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Hinweis}
Verschiedene Module können identische Originalbegriffe enthalten, die separat übersetzt werden müssen.
:::

Wenn Übersetzungen von system- oder pluginintegrierten Einträgen manuell geändert oder durch KI-Übersetzung überschrieben wurden, aktivieren Sie bei der Synchronisierung `Übersetzungen systemintegrierter Einträge zurücksetzen`. Nach der Synchronisierung überschreibt das System vorhandene integrierte Eintragsübersetzungen der aktuellen Sprache mit den Übersetzungen aus dem integrierten Sprachpaket, um die Standardübersetzung wiederherzustellen.

### Automatische Erstellung von Begriffen

Bei der Seitenbearbeitung werden benutzerdefinierte Texte in den einzelnen Blöcken automatisch als entsprechende Begriffe erstellt und gleichzeitig Übersetzungsinhalte für die aktuelle Sprache generiert.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Hinweis}
Wenn Texte im Code definiert werden, muss der ns (Namespace) manuell angegeben werden, wie zum Beispiel: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Übersetzungsinhalte bearbeiten

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

Die Übersetzungsspalte unterstützt Schnellbearbeitung. Sie können direkt auf eine Übersetzungszelle in der Tabelle klicken, sie ändern, mit Enter oder beim Verlassen des Eingabefelds speichern und mit `Esc` die Änderung abbrechen. Wenn Sie Originaltext, Modul oder längere Übersetzungen ansehen möchten, können Sie weiterhin die Bearbeiten-Schaltfläche in den Zeilenaktionen verwenden, um den Drawer-Editor zu öffnen.

### KI-Übersetzung verwenden

Die Lokalisierungsverwaltung unterstützt die Übersetzung von Einträgen über die AI-Mitarbeiterin Lina. Nachdem AI-Mitarbeiter aktiviert und ein Modelldienst konfiguriert wurde, können Sie auf der Lokalisierungsverwaltungsseite KI-Übersetzung verwenden, um Übersetzungen für die aktuelle Sprache stapelweise zu erzeugen.

![](https://static-docs.nocobase.com/202605121152196.png)

Unterstützte Übersetzungsbereiche:

- **Vollständige Übersetzung**: übersetzt alle Einträge der aktuellen Sprache und überschreibt vorhandene Übersetzungen.
- **Inkrementelle Übersetzung**: übersetzt nur Einträge, die in der aktuellen Sprache noch keine Übersetzung haben. Bei integrierten Einträgen gilt auch eine bereits im System- oder Plugin-Sprachpaket der Zielsprache vorhandene Übersetzung als vorhanden.
- **Ausgewählte Einträge übersetzen**: wählen Sie Einträge in der Tabelle aus und übersetzen Sie nur diese Inhalte.

![](https://static-docs.nocobase.com/202605191341968.png)

Beim Erstellen einer vollständigen oder inkrementellen Übersetzungsaufgabe können Sie im Bestätigungsdialog den Übersetzungsumfang wählen:

- **Alle**: verarbeitet alle Einträge, die den aktuellen Aufgabenbedingungen entsprechen.
- **Integrierte Einträge**: System- und Plugin-Einträge.
- **Benutzerdefinierte Einträge**: Routennamen, Sammlungs- und Feldnamen sowie UI-Inhalte.

Der Bestätigungsdialog unterstützt außerdem die Konfiguration von Referenzübersetzungssprachen. Vollständige und inkrementelle Übersetzung konfigurieren Standardsprache und Fallback-Sprache für integrierte und benutzerdefinierte Einträge separat. Die Übersetzung ausgewählter Einträge zeigt nur eine allgemeine Referenzsprachen-Konfiguration.

Die KI-Übersetzung erstellt eine Hintergrundaufgabe. Während der Ausführung können Sie den Fortschritt verfolgen. Nach Abschluss werden die Übersetzungen in die entsprechende Sprache geschrieben und sollten weiterhin anhand des tatsächlichen Kontexts geprüft und korrigiert werden.

Die vollständige Anleitung finden Sie unter [AI-Mitarbeiterin - Lina](/ai-employees/built-in/lina).

:::warning{title=Hinweis}
KI-generierte Übersetzungen können Bedeutungsabweichungen, uneinheitliche Terminologie oder unzureichendes Kontextverständnis enthalten. Prüfen Sie vor der Veröffentlichung wichtige Seiten, Fachbegriffe und benutzerseitige Texte manuell.
:::

### Übersetzungen veröffentlichen

Nach Abschluss der Übersetzung müssen Sie auf die Schaltfläche „Veröffentlichen“ klicken, damit die Änderungen wirksam werden.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Andere Sprachen übersetzen

Aktivieren Sie in den „Systemeinstellungen“ weitere Sprachen, zum Beispiel Vereinfachtes Chinesisch.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Wechseln Sie in diese Sprachumgebung.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Synchronisieren Sie die Begriffe.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Übersetzen und veröffentlichen Sie.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>
