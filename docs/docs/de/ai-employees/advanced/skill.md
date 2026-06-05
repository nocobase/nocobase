:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Erweitert

## Einführung

Gängige große Sprachmodelle (LLMs) verfügen über die Fähigkeit, Werkzeuge zu nutzen. Das AI-Mitarbeiter-Plugin enthält einige integrierte, häufig verwendete Werkzeuge, die den großen Sprachmodellen zur Verfügung stehen.
Die auf der Einstellungsseite des AI-Mitarbeiters festgelegten Fähigkeiten sind die Werkzeuge, die das große Sprachmodell nutzen kann.

![20251022142348](https://static-docs.nocobase.com/20251022142348.png)

## Fähigkeiten einrichten

Navigieren Sie zur Konfigurationsseite des AI-Mitarbeiter-Plugins, klicken Sie auf den Tab `AI employees`, um zur Verwaltungsseite der AI-Mitarbeiter zu gelangen.

Wählen Sie den AI-Mitarbeiter aus, für den Sie Fähigkeiten einrichten möchten, klicken Sie auf die Schaltfläche `Edit`, um die Bearbeitungsseite des AI-Mitarbeiters aufzurufen.

Im Tab `Skills` klicken Sie auf die Schaltfläche `Add Skill`, um dem aktuellen AI-Mitarbeiter eine Fähigkeit hinzuzufügen.

![20251022145748](https://static-docs.nocobase.com/20251022145748.png)

## Einführung in die Fähigkeiten

### Frontend

Die Frontend-Gruppe ermöglicht es dem AI-Mitarbeiter, mit Frontend-Komponenten zu interagieren.

- Die Fähigkeit `Form filler` ermöglicht es dem AI-Mitarbeiter, generierte Formulardaten in ein vom Benutzer angegebenes Formular zurückzuschreiben.

![20251022145954](https://static-docs.nocobase.com/20251022145954.png)

### Datenmodellierung

Die Fähigkeiten der Datenmodellierungs-Gruppe verleihen dem AI-Mitarbeiter die Möglichkeit, interne NocoBase-APIs aufzurufen, um Daten zu modellieren.

- `Intent Router`: Routet Anfragen und entscheidet, ob der Benutzer die Struktur einer Sammlung ändern oder eine neue Sammlung erstellen möchte.
- `Get collection names`: Ruft die Namen aller vorhandenen Sammlungen im System ab.
- `Get collection metadata`: Ruft die Strukturinformationen einer bestimmten Sammlung ab.
- `Define collections`: Ermöglicht dem AI-Mitarbeiter, Sammlungen im System zu erstellen.

![20251022150441](https://static-docs.nocobase.com/20251022150441.png)

### Workflow-Aufrufer

`Workflow caller` verleiht dem AI-Mitarbeiter die Fähigkeit, Workflows auszuführen. Workflows, die im Workflow-Plugin mit dem `Trigger type` `AI employee event` konfiguriert sind, stehen hier als Fähigkeiten für den AI-Mitarbeiter zur Verfügung.

![20251022153320](https://static-docs.nocobase.com/20251022153320.png)

### Code-Editor

Die Fähigkeiten der Code-Editor-Gruppe ermöglichen es dem AI-Mitarbeiter hauptsächlich, mit dem Code-Editor zu interagieren.

- `Get code snippet list`: Ruft die Liste der vordefinierten Code-Snippets ab.
- `Get code snippet content`: Ruft den Inhalt eines bestimmten Code-Snippets ab.

![20251022153811](https://static-docs.nocobase.com/20251022153811.png)

### Sonstiges

- `Chart generator`: Verleiht dem AI-Mitarbeiter die Fähigkeit, Diagramme zu generieren und diese direkt im Gespräch auszugeben.

![20251022154141](https://static-docs.nocobase.com/20251022154141.png)