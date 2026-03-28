---
pkg: "@nocobase/plugin-ai"
---

:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/ai-employees/index).
:::

# Übersicht

![clipboard-image-1771905619](https://static-docs.nocobase.com/clipboard-image-1771905619.png)

AI-Mitarbeiter (`AI Employees`) sind intelligente Agenten-Fähigkeiten, die tief in die NocoBase-Geschäftssysteme integriert sind.

Es handelt sich nicht um Roboter, die „nur chatten“ können, sondern um „digitale Kollegen“, die den Kontext direkt in der Geschäftsoberfläche verstehen und Aktionen ausführen können:

- **Geschäftskontext verstehen**: Wahrnehmung der aktuellen Seite, Blöcke, Datenstrukturen und ausgewählten Inhalte.
- **Aktionen direkt ausführen**: Fähigkeiten aufrufen, um Abfragen, Analysen, Ausfüllen, Konfigurationen, Generierungen und andere Aufgaben zu erledigen.
- **Rollenbasierte Zusammenarbeit**: Konfiguration verschiedener Mitarbeiter nach Positionen und Wechsel der Modelle in der Konversation zur Zusammenarbeit.

## 5-Minuten-Einstiegspfad

Sehen Sie sich zuerst den [Schnellstart](/ai-employees/quick-start) an und schließen Sie die minimale Konfiguration in der folgenden Reihenfolge ab:

1. Konfigurieren Sie mindestens einen [LLM-Dienst](/ai-employees/features/llm-service).
2. Aktivieren Sie mindestens einen [AI-Mitarbeiter](/ai-employees/features/enable-ai-employee).
3. Öffnen Sie eine Konversation und beginnen Sie die [Zusammenarbeit mit AI-Mitarbeitern](/ai-employees/features/collaborate).
4. Aktivieren Sie bei Bedarf die [Websuche](/ai-employees/features/web-search) und [Schnellaufgaben](/ai-employees/features/task).

## Funktionskarte

### A. Basiskonfiguration (Administrator)

- [LLM-Dienst konfigurieren](/ai-employees/features/llm-service): Provider anbinden, verfügbare Modelle konfigurieren und verwalten.
- [AI-Mitarbeiter aktivieren](/ai-employees/features/enable-ai-employee): Integrierte Mitarbeiter aktivieren/deaktivieren, Verfügbarkeitsbereich steuern.
- [Neuen AI-Mitarbeiter erstellen](/ai-employees/features/new-ai-employees): Rollen, Rolleneinstellungen, Begrüßungen und Fähigkeitsgrenzen definieren.
- [Fähigkeiten nutzen](/ai-employees/features/tool): Berechtigungen für Fähigkeiten konfigurieren (`Ask` / `Allow`), Ausführungsrisiken kontrollieren.

### B. Tägliche Zusammenarbeit (Geschäftsanwender)

- [Zusammenarbeit mit AI-Mitarbeitern](/ai-employees/features/collaborate): Mitarbeiter und Modelle innerhalb der Konversation wechseln, kontinuierliche Zusammenarbeit.
- [Kontext hinzufügen - Blöcke](/ai-employees/features/pick-block): Seitenblöcke als Kontext an die KI senden.
- [Schnellaufgaben](/ai-employees/features/task): Häufige Aufgaben auf Seiten/Blöcken voreinstellen und mit einem Klick ausführen.
- [Websuche](/ai-employees/features/web-search): Bei Bedarf an aktuellen Informationen die suchgestützte Beantwortung aktivieren.

### C. Fortgeschrittene Fähigkeiten (Erweiterungen)

- [Integrierte AI-Mitarbeiter](/ai-employees/features/built-in-employee): Positionierung und Anwendungsszenarien vordefinierter Mitarbeiter verstehen.
- [Berechtigungskontrolle](/ai-employees/permission): Zugriff auf Mitarbeiter, Fähigkeiten und Daten gemäß dem Organisationsberechtigungsmodell steuern.
- [AI-Wissensdatenbank](/ai-employees/knowledge-base/index): Unternehmenswissen einbinden, Stabilität und Rückverfolgbarkeit der Antworten verbessern.
- [Workflow-LLM-Knoten](/ai-employees/workflow/nodes/llm/chat): KI-Fähigkeiten in automatisierte Abläufe orchestrieren.

## Kernkonzepte (Empfehlung zur Vereinheitlichung)

Die folgenden Begriffe stimmen mit dem Glossar überein; es wird empfohlen, sie innerhalb des Teams einheitlich zu verwenden:

- **AI-Mitarbeiter (AI Employee)**: Ein ausführbarer Agent, der aus Rolleneinstellungen (Role setting) und Fähigkeiten (Tool / Skill) besteht.
- **LLM-Dienst (LLM Service)**: Einheit für Modellzugriff und Fähigkeitskonfiguration zur Verwaltung von Providern und Modelllisten.
- **Anbieter (Provider)**: Der Modelllieferant hinter einem LLM-Dienst.
- **Aktivierte Modelle (Enabled Models)**: Die Menge der Modelle, die der aktuelle LLM-Dienst in der Konversation zur Auswahl zulässt.
- **Mitarbeiter-Umschalter (AI Employee Switcher)**: Wechsel des aktuell zusammenarbeitenden Mitarbeiters innerhalb der Konversation.
- **Modell-Umschalter (Model Switcher)**: Modellwechsel innerhalb der Konversation mit Speicherung der Präferenzen pro Mitarbeiter.
- **Fähigkeit (Tool / Skill)**: Eine von der KI aufrufbare Ausführungseinheit.
- **Fähigkeitsberechtigung (Permission: Ask / Allow)**: Ob vor dem Aufruf einer Fähigkeit eine menschliche Bestätigung erforderlich ist.
- **Kontext (Context)**: Informationen zur Geschäftsumgebung wie Seiten, Blöcke, Datenstrukturen usw.
- **Konversation (Chat)**: Ein kontinuierlicher Interaktionsprozess zwischen Benutzer und AI-Mitarbeiter.
- **Websuche (Web Search)**: Die Fähigkeit, Antworten durch externe Suche mit Echtzeitinformationen zu ergänzen.
- **Wissensdatenbank (Knowledge Base / RAG)**: Einbindung von Unternehmenswissen durch Retrieval-Augmented Generation.
- **Vektorspeicher (Vector Store)**: Vektorisierter Speicher, der semantische Suchfunktionen für die Wissensdatenbank bereitstellt.

## Installationsanweisungen

AI-Mitarbeiter sind ein integriertes NocoBase-Plugin (`@nocobase/plugin-ai`), das sofort einsatzbereit ist und keine separate Installation erfordert.