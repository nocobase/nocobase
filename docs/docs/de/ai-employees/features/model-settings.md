---
title: 'AI-Mitarbeitermodelle konfigurieren'
description: 'AI-Mitarbeitermodelle konfigurieren.'
keywords: 'AI Employee model settings,dedicated model,model scope,LLM service,NocoBase AI'
---

# AI-Mitarbeitermodelle konfigurieren

Standardmäßig können AI-Mitarbeiter alle aktivierten LLM-Dienste und Modelle im System verwenden. Administratoren können für einzelne Mitarbeiter dedizierte Modelleinstellungen aktivieren und den Modellbereich einschränken.

## Voraussetzungen

- Das Plugin **AI Employees** ist aktiviert.
- Mindestens ein LLM-Dienst ist konfiguriert.
- Der Ziel-AI-Mitarbeiter ist aktiviert.

Zur Einrichtung des LLM-Dienstes siehe [LLM-Dienst konfigurieren](/ai-employees/features/llm-service).

## Einstiegspunkte

Gehen Sie zu `System Settings -> AI Employees -> AI employees`, öffnen Sie den gewünschten AI-Mitarbeiter und wechseln Sie zu `Model settings`.

![](https://static-docs.nocobase.com/202605121216415.png)

## Dedizierte Modelleinstellungen aktivieren

Nach Aktivierung von `Enable dedicated model configuration` wählen Sie unter `Models` die erlaubten Modelle aus.

- Der Modellwechsler im Chat zeigt nur ausgewählte Modelle.
- Schnellaufgaben und Workflow-Knoten können nur ausgewählte Modelle verwenden.

:::info{title=Hinweis}
Wenn dedizierte Modelleinstellungen aktiv sind, aber kein Modell ausgewählt wurde, kann kein verfügbares Modell aufgelöst werden.
:::

## Dedizierte Modelleinstellungen deaktivieren

Nach Deaktivierung gelten wieder die Standardregeln:

- Alle aktivierten LLM-Modelle können verwendet werden.
- Ohne manuelle Auswahl verwendet das System das globale Standardmodell.

## Modellauflösungsregeln

Bei der Ausführung wird das Modell in dieser Reihenfolge bestimmt:

1. Wenn dedizierte Modelleinstellungen aktiviert sind, zuerst innerhalb der ausgewählten Modelle auflösen.
2. Wenn die Anfrage ein Modell angibt und dieses erlaubt ist, dieses Modell verwenden.
3. Wenn das angegebene Modell nicht erlaubt ist, das erste erlaubte Modell verwenden.
4. Wenn keine dedizierten Modelleinstellungen aktiv sind, das von der Anfrage angegebene Modell bevorzugen.
5. Wenn kein Modell angegeben ist, das globale Standardmodell verwenden.

## Empfehlungen

- Wenn keine lokale Bereitstellung möglich ist, wählen Sie ein spezialisiertes Übersetzungsmodell statt eines allgemeinen Chatmodells.
- Die Parallelität kann je nach Modellfähigkeit angepasst werden, um Durchsatz, Antwortzeit und Kosten zu steuern.

## FAQ

### Warum ist die Modellliste leer?

Meist wurde kein LLM-Dienst konfiguriert oder kein Modell aktiviert. Prüfen Sie `Enabled Models`.

### Warum können Nutzer nicht zu anderen Modellen wechseln?

Bei aktivierten dedizierten Einstellungen ist nur der ausgewählte Modellbereich verfügbar.

### Welche Einträge sind betroffen?

Neue Chats, Schnellaufgaben, Workflow-AI-Mitarbeiterknoten und integrierte Plugin-Aufgaben sind betroffen. Historische Nachrichten werden nicht neu generiert.
