:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/system-management/localization/index).
:::

# Lokalisierungsverwaltung

## Einführung

Das Lokalisierungsverwaltungs-Plugin wird verwendet, um die Lokalisierungsressourcen von NocoBase zu verwalten und zu implementieren. Es kann Systemmenüs, Sammlungen, Felder sowie alle Plugins übersetzen, um sie an die Sprache und Kultur bestimmter Regionen anzupassen.

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

### Automatische Erstellung von Begriffen

Bei der Seitenbearbeitung werden benutzerdefinierte Texte in den einzelnen Blöcken automatisch als entsprechende Begriffe erstellt und gleichzeitig Übersetzungsinhalte für die aktuelle Sprache generiert.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=Hinweis}
Wenn Texte im Code definiert werden, muss der ns (Namespace) manuell angegeben werden, wie zum Beispiel: `${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Übersetzungsinhalte bearbeiten

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

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