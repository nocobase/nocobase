---
title: "Skill definieren"
description: "Einführung in das Frontmatter, den Prompt-Text, die Tool-Bindung und die automatische Verzeichniserkennung von SKILLS.md für NocoBase AI-Mitarbeiter."
keywords: "NocoBase, AI-Mitarbeiter Skill, SKILLS.md, Skill Tool Bindung, business-analysis-report"
---

# Skill definieren

Ein Skill führt keinen Code aus. Er ist ein dem Modell bereitgestellter Leitfaden, der den Verarbeitungsfluss, die verfügbaren Tools, Überprüfungsschritte und Anforderungen an die Ausgabe festlegt.

## Skill-Verzeichnis

Jeder Skill verwendet ein separates Verzeichnis:

```text
src/ai/skills/business-analysis-report/
├── SKILLS.md
└── tools/
    └── businessReportGenerator.ts
```

Hierbei gilt:

- `SKILLS.md` definiert die Metadaten und den Prompt-Text
- `tools/` speichert Tools, die ausschließlich mit diesem Skill verwendet werden
- In `tools/` gefundene Tools werden automatisch der Tool-Liste dieses Skills hinzugefügt

## Das Frontmatter von `SKILLS.md`

Ein minimaler Skill sieht wie folgt aus:

```md
---
scope: SPECIFIED
name: welcome-developer
description: Greet a developer by name and explain the next step for starting NocoBase plugin development.
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
---

You help welcome developers who are starting NocoBase plugin development.

When the user asks you to greet or welcome a developer:

1. Extract the developer name from the request.
2. Call `greetDeveloper` exactly once.
3. Return the greeting from the tool result.
4. Ask which plugin capability the developer wants to build next.

Do not claim that the greeting was generated until the tool returns `status: "success"`.
```

Häufig verwendete Felder im Frontmatter sind:

| Feld | Funktion |
| --- | --- |
| `scope` | Gültigkeitsbereich des Skills, Standardwert ist `SPECIFIED` |
| `name` | Eindeutiger Name des Skills |
| `description` | Hilft dem Modell zu entscheiden, wann dieser Skill geladen werden soll |
| `introduction.title` | Titel für die Anzeige in der Verwaltungsoberfläche |
| `introduction.about` | Beschreibung für die Anzeige in der Verwaltungsoberfläche |
| `tools` | Liste zusätzlicher zu bindender Tool-Namen |

Der Textkörper des Skills wird unverändert gespeichert und nach dem Laden des Skills dem Kontext des Modells hinzugefügt. Der Textkörper sollte sich auf den Workflow und die Einschränkungen konzentrieren und keine Implementierungsdetails der Tools kopieren.

## Tools an einen Skill binden

Dafür gibt es zwei Möglichkeiten.

Die erste Möglichkeit ist die explizite Deklaration im Frontmatter:

```yaml
tools:
  - getSkill
  - businessReportGenerator
```

Die zweite Möglichkeit besteht darin, das Tool in das `tools/`-Verzeichnis des aktuellen Skills zu legen:

```text
src/ai/skills/welcome-developer/
├── SKILLS.md
└── tools/
    └── greetDeveloper.ts
```

Der Loader erkennt `greetDeveloper` automatisch und fügt es der Tool-Liste des Skills hinzu. Tools, die ausschließlich für einen bestimmten Skill bestimmt sind, sollten standardmäßig im Skill-Verzeichnis liegen, damit die Dateiposition zugleich die Bindungsbeziehung ausdrückt.

## Einen guten Skill schreiben

Ein effektiver Skill enthält in der Regel folgende Punkte:

1. Rolle und Aufgabengrenzen
2. Die einzuhaltende Verarbeitungsreihenfolge
3. Welches Tool in jedem Schritt aufgerufen werden soll
4. In welchen Fällen eine Bestätigung des Benutzers erforderlich ist
5. Vorgehensweise nach einem Tool-Fehler
6. Struktur der endgültigen Ausgabe und Validierungsbedingungen

Wenn ein Tool Daten ändert, muss der Skill ausdrücklich verlangen, dass das Modell auf ein erfolgreiches Tool-Ergebnis wartet. Es darf nicht schon vor dem Aufruf behaupten, der Vorgang sei abgeschlossen.

## Beispiel eines integrierten Skills: `business-analysis-report`

`packages/plugins/@nocobase/plugin-ai/src/ai/skills/business-analysis-report/SKILLS.md` unterteilt die Geschäftsanalyse in einen klaren Workflow:

```yaml
---
scope: GENERAL
name: business-analysis-report
description: Analyze business data with the data-query workflow and generate stakeholder-facing reports with markdown and ECharts.
introduction:
  title: '{{t("ai.skills.businessAnalysisReport.title", { ns: "@nocobase/plugin-ai" })}}'
  about: '{{t("ai.skills.businessAnalysisReport.about", { ns: "@nocobase/plugin-ai" })}}'
tools:
  - getSkill
  - businessReportGenerator
---
```

Im Textkörper steht nicht nur „Erstelle einen Geschäftsbericht“, sondern es wird weiter festgelegt:

- Zuerst Entscheidungsziele, Zielgruppe, Zeitraum und Metriken klären
- Bei Geschäftsdaten muss der erste ToolCall den Skill `data-query` laden
- Keine Vermutungen über Datentabellen, Verknüpfungspfade und Abfrageergebnisse zulassen
- `businessReportGenerator` erst aufrufen, wenn die Daten bereitstehen
- Diagramme und Markdown-Berichte im selben ToolCall generieren
- Erfolg anhand der vom Tool zurückgegebenen Werte `status`, `chartCount`, `errors` und `warnings` beurteilen
- Bei einem Diagrammfehler nur einmal erneut versuchen und danach auf einen reinen Markdown-Bericht zurückgreifen

Solche Regeln sind der Hauptwert eines Skills – sie verwandeln das „Was das Modell tun kann“ in einen reproduzierbaren und überprüfbaren Prozess.

## Verwandte Links

- [Entwicklung von AI-Mitarbeiter-Plugins](./index.md) — Die Rolle von Skills bei der Erweiterung von AI-Mitarbeitern kennenlernen
- [Serverseitiges Tool definieren](./define-tool.md) — Tools definieren, die ein Skill aufrufen kann
- [Integrierten AI-Mitarbeiter definieren](./define-ai-employee.md) — Einen Skill an einen festen Mitarbeiter binden
- [Vollständiges Beispiel: Integrierten AI-Mitarbeiter erstellen](./complete-example.md) — Ein vollständiges Beispiel für die Bindung von Skills und Tools ansehen
