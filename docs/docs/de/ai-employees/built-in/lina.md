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

## Prompt-Konfiguration

Öffnen Sie Linas Bearbeitungsdialog unter `Systemeinstellungen -> AI-Mitarbeiter -> AI employees` und passen Sie den Prompt unter `Role setting` an. Der Prompt dient in der Regel dazu, Informationen zur Geschäftsdomäne, Terminologieregeln und Ausgabevorgaben festzulegen. Er sollte nicht zu lang sein, da er sonst für spezialisierte Übersetzungsmodelle ungeeignet sein kann.

![](https://static-docs.nocobase.com/202605191351816.png)

Beispiel für den Standard-Prompt:

```text
# Role
You are Lina, a professional localization translator for NocoBase.

# Task
Translate NocoBase localization text into the requested target language.

# Translation requirements
1. Keep the translation faithful, concise, and natural for product UI.
2. Use consistent NocoBase and software terminology.
3. Preserve placeholders, variables, HTML tags, ICU syntax, line breaks, and code-like tokens.
4. Return only the translated text. Do not explain, quote, or use Markdown.
5. If the text should not be translated, return it unchanged.
```

Referenzübersetzungen und der zu übersetzende Text müssen nicht in Linas Prompt geschrieben werden. Beim Erstellen einer Aufgabe fügt das System sie automatisch anhand des Eintragsinhalts, der Zielsprache und der Referenzsprachen-Konfiguration im Bestätigungsdialog hinzu.

## Verwendung

Klicken Sie auf der Lokalisierungsverwaltungsseite auf Linas Avatar und wählen Sie den Umfang der AI-Übersetzungsaufgabe.

### Inkrementelle Übersetzung

Übersetzt nur Einträge ohne Übersetzung in der aktuellen Sprache.

Bei integrierten Einträgen gilt: Wenn im System- oder Plugin-Sprachpaket der Zielsprache bereits eine Übersetzung vorhanden ist, wird der Eintrag als übersetzt betrachtet, auch wenn in der Lokalisierungsübersetzungstabelle noch kein entsprechender Datensatz vorhanden ist. Er wird dann nicht zur inkrementellen Übersetzung gezählt.

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

- Aufgabenbeschreibung.
- Anzahl der zu übersetzenden Einträge.
- Zu verwendender Provider.
- Zu verwendendes Modell.
- Konfiguration der Referenzübersetzungssprachen.

Bei vollständiger und inkrementeller Übersetzung kann im Bestätigungsdialog außerdem der Übersetzungsumfang gewählt werden:

- **Alle**: verarbeitet alle Einträge, die den aktuellen Aufgabenbedingungen entsprechen.
- **Integrierte Einträge**: System- und Plugin-Einträge.
- **Benutzerdefinierte Einträge**: Routennamen, Sammlungs- und Feldnamen sowie UI-Inhalte.

Die Übersetzung ausgewählter Einträge verarbeitet nur die bereits in der Tabelle markierten Datensätze. Deshalb wird kein Übersetzungsumfang angezeigt. Außerdem wird nur eine allgemeine Referenzsprachen-Konfiguration angezeigt, ohne zwischen integrierten und benutzerdefinierten Einträgen zu unterscheiden.

Wenn die Anzahl der zu übersetzenden Einträge 0 ist, zeigt das System einen Hinweis an und erstellt keine Hintergrundaufgabe. Nach der Bestätigung erstellt das System eine Hintergrundaufgabe. Der Fortschritt ist in asynchronen Aufgaben sichtbar. Nach Abschluss werden die Übersetzungen in die entsprechende Sprache geschrieben.

![](https://static-docs.nocobase.com/202605191341968.png)

## Referenzübersetzungen

Kurze Einträge wie Feldnamen, Buttons und Status nutzen vorhandene Referenzübersetzungen, um Konsistenz zu verbessern.

- Integrierte Einträge verwenden standardmäßig chinesische Übersetzungen als Referenz und Japanisch als Fallback-Referenz.
- Benutzerdefinierte Einträge verwenden standardmäßig die Systemsprache als Referenz und Chinesisch als Fallback-Referenz.
- Benutzer können Standardsprache und Fallback-Sprache im Bestätigungsdialog der Aufgabe anpassen.
- Das System verwendet zuerst die Referenzübersetzung in der Standardsprache. Wenn sie nicht vorhanden ist, versucht es die Fallback-Sprache.

Wenn eine Referenz vorhanden ist, verwendet Lina sinngemäß folgenden Prompt:

```text
Refer to the following translation:
{source_term} is translated as {target_term}

Translate the following text into {target_language}. Output only the translated result without any additional explanation:

{source_text}
```

## Modellauswahl-Empfehlungen

Lokalisierungsübersetzungen verarbeiten oft viele Einträge. Wenn möglich, nutzen Sie zuerst ein lokal bereitgestelltes kleines Übersetzungsmodell, da Online-Modelle häufig Raten-, Parallelitäts- oder Token-Limits haben.

Wenn keine lokale Bereitstellung möglich ist, wählen Sie ein spezialisiertes Übersetzungsmodell statt eines allgemeinen Chatmodells. Übersetzungsmodelle eignen sich in der Regel besser für kurze Einträge, UI-Texte und Stapelübersetzungen. Lina organisiert den Mitarbeiter-Prompt, Referenzübersetzungen und den zu übersetzenden Text zu einem Prompt, der an das Modell gesendet wird. Benutzer können Linas Prompt anpassen, um Übersetzungsstil und Regeln zu steuern.

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
