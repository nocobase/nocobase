---
title: 'Lina: Lokalisierungsingenieurin'
description: 'NocoBase AI-Mitarbeiterdokumentation.'
keywords: 'Lina,Localization Engineer,AI translation,Localization Management,AI Employee,NocoBase'
---

# Lina: Lokalisierungsingenieurin

## Rolle

Lina: Lokalisierungsingenieurin ist auf dieses integrierte NocoBase-Szenario spezialisiert und hilft, die entsprechenden Aufgaben effizienter zu erledigen.

![](https://static-docs.nocobase.com/202605121152196.png)

:::info{title=Hinweis}
Lina ist für Lokalisierungsszenarien dediziert und verwendet keine allgemeinen Skills oder Tools.
:::

## Szenarien

- System- und Plugin-Einträge stapelweise übersetzen.
- Lokalisierungsinhalte für Sammlungen, Felder und Menüs übersetzen.
- Nur ausgewählte Einträge in der Tabelle übersetzen.

## Voraussetzungen

Schließen Sie vor der Verwendung folgende Einrichtung ab:

- Aktivieren Sie das Plugin **Lokalisierungsverwaltung**.
- Konfigurieren Sie einen verfügbaren LLM-Dienst und weisen Sie Lina ein Standardmodell zu. Siehe [AI-Mitarbeitermodelle konfigurieren](/ai-employees/features/model-settings) und [Modellauswahl-Empfehlungen](#modellauswahl-empfehlungen).
- Aktivieren Sie die Zielsprache in den Systemeinstellungen.
- Synchronisieren Sie die zu übersetzenden Einträge auf der Lokalisierungsverwaltungsseite.

:::info{title=Hinweis}
Lina erstellt Übersetzungsaufgaben für die aktuelle Sprache.
:::

## Verwendung

Klicken Sie auf der Lokalisierungsverwaltungsseite auf Linas Avatar und wählen Sie den Umfang der AI-Übersetzungsaufgabe.

### Inkrementelle Übersetzung

Übersetzt nur Einträge ohne Übersetzung in der aktuellen Sprache.

### Ausgewählte Übersetzung

Wählen Sie zuerst Tabelleneinträge aus und übersetzen Sie dann nur die ausgewählten Inhalte.

Wenn kein Eintrag ausgewählt ist, fordert das System zur Auswahl auf.

### Vollständige Übersetzung

Übersetzt alle geeigneten Einträge der aktuellen Sprache.

:::warning{title=Hinweis}
Die vollständige Übersetzung kann vorhandene Übersetzungen überschreiben. Prüfen Sie Zielsprache, Anzahl der Einträge und Modelldienst vor dem Start.
:::

## Aufgabenbestätigung

Vor dem Erstellen der Aufgabe zeigt das System einen Bestätigungsdialog mit:

- Anzahl der zu übersetzenden Einträge.
- Zu verwendender Provider.
- Zu verwendendes Modell.

Nach der Bestätigung erstellt das System eine Hintergrundaufgabe. Der Fortschritt ist in asynchronen Aufgaben sichtbar. Nach Abschluss werden die Übersetzungen in die entsprechende Sprache geschrieben.

![](https://static-docs.nocobase.com/202605121233608.png)

## Übersetzungsstrategie

Lina folgt beim Übersetzen diesen Regeln:

- Nur den übersetzten Text ohne Erklärung oder Zusatzinhalt zurückgeben.
- Variablen, Platzhalter, HTML-Tags, ICU-Syntax und Formatierung beibehalten.
- UI-Texte kurz und natürlich halten.

## Referenzübersetzungen

Kurze Einträge wie Feldnamen, Buttons und Status nutzen vorhandene Referenzübersetzungen, um Konsistenz zu verbessern.

- Integrierte Einträge verwenden bevorzugt chinesische Übersetzungen als Referenz.
- Nicht integrierte Einträge verwenden bevorzugt die Standardsprache des Systems.

Wenn eine Referenz vorhanden ist, verwendet Lina sinngemäß folgenden Prompt:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Modellauswahl-Empfehlungen

Lokalisierungsübersetzungen verarbeiten oft viele Einträge. Wenn möglich, nutzen Sie zuerst ein lokal bereitgestelltes kleines Übersetzungsmodell, da Online-Modelle häufig Raten-, Parallelitäts- oder Token-Limits haben.

Wenn keine lokale Bereitstellung möglich ist, wählen Sie ein spezialisiertes Übersetzungsmodell statt eines allgemeinen Chatmodells.

Die Parallelität kann je nach Modellfähigkeit angepasst werden, um Durchsatz, Antwortzeit und Kosten zu steuern.

Eine vollständige Praxis mit lokal bereitgestelltem Übersetzungsmodell finden Sie unter [Mit Lina und lokalem HY-MT1.5-1.8B Lokalisierungseinträge übersetzen](/ai-employees/scenarios/localization-hy-mt).

:::info{title=Hinweis}
Die Parallelität wird über `AI_LOCALIZATION_CONCURRENCY` gesteuert. Standard ist `10`, erlaubt sind `1` bis `20`; Werte außerhalb des Bereichs verwenden den Standard.
:::

## Fortschritt und Fehlerbehandlung

Lina-Übersetzungsaufgaben laufen als asynchrone Hintergrundaufgaben und schreiben Ergebnisse eintragsweise.

![](https://static-docs.nocobase.com/202605121235761.png)

Wenn ein Eintrag fehlschlägt, wird der Fehler aufgezeichnet und die Aufgabe gestoppt, um unkontrollierte Ergebnisse zu vermeiden.

- AI-Plugin oder Async Task Manager ist nicht aktiviert.
- Lina hat kein verfügbares Modell konfiguriert.
- Der Modelldienst ist nicht verfügbar oder läuft in ein Timeout.

Prüfen Sie asynchrone Aufgabendetails und Serverlogs auf Provider, Modell, Zielsprache, Eintrags-ID und Dauer.

## Prüfung vor Veröffentlichung

Nach Abschluss der AI-Übersetzung vor der Veröffentlichung prüfen:

- Kurze Einträge wie Menüs, Buttons und Feldnamen passen zum Produktkontext.
- Variablen, Platzhalter und HTML-Tags bleiben erhalten.
- Geschäftsterminologie ist konsistent.
- Nach der Prüfung veröffentlichen.
