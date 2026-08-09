---
title: "Häufige Probleme bei der Entwicklung von AI-Mitarbeiter-Plugins"
description: "Fehlerbehebung, wenn NocoBase AI-Mitarbeiter-Tools, Skills, integrierte Mitarbeiter oder Frontend-Tool-Karten nicht registriert oder ausgeführt werden."
keywords: "NocoBase,AI-Mitarbeiter häufige Probleme,Tool nicht registriert,Skill nicht geladen,Frontend-Karte"
---

# Häufige Probleme bei der Entwicklung von AI-Mitarbeiter-Plugins

## Tool wurde nicht registriert

Prüfen Sie die folgenden Punkte in dieser Reihenfolge:

- Befindet sich die Datei innerhalb des Plugin-Build-Bereichs unter `src/ai/**/tools/`?
- Verwendet sie die Dateiendung `.ts` oder `.js`?
- Wird `export default defineTools(...)` verwendet?
- Wurde die Tool-Datei versehentlich als `.d.ts` benannt?
- Gibt es ein Tool mit demselben Namen, sodass der später registrierte Eintrag ignoriert wird?
- Wurde das Plugin neu gebaut und geladen?

## Skill wird nicht angezeigt

Prüfen Sie zuerst den Dateinamen. Derzeit muss er wie folgt lauten:

```text
SKILLS.md
```

Stellen Sie außerdem sicher, dass das Frontmatter einen stabilen `name` und eine `description` enthält und die Datei unter `src/ai/**/skills/<skill-name>/SKILLS.md` liegt.

## Skill wird geladen, kann das Tool aber nicht aufrufen

Prüfen Sie die folgenden Punkte:

- Enthält die `tools`-Liste des Skills den Namen des Tools?
- Liegt das Tool im Verzeichnis `tools/` des aktuellen Skills?
- Stimmen Dateiname des Tools, `definition.name` und die Referenz im Skill überein?
- Eignet sich der `scope` für die aktuelle Bindungsart?
- Wurde das Tool wegen eines doppelten Namens nicht registriert?

Die Bindung eines Tools bedeutet nur, dass das Modell es verwenden kann. Wenn das Tool bereits im Skill aufgeführt ist, vom Modell aber weiterhin nicht aufgerufen wird, müssen der Aufrufzeitpunkt, die Parameteranforderungen und der Schritt zum Abwarten des Ergebnisses im Workflow von `SKILLS.md` ausdrücklich beschrieben werden.

## Frontend-Karte wird nicht angezeigt

Der im Frontend registrierte Name muss exakt mit dem endgültigen Namen des serverseitigen Tools übereinstimmen:

```ts
this.ai.toolsManager.registerTools('developerChoice', options);
```

Prüfen Sie außerdem:

- Verwendet das benutzerdefinierte Plugin die Laufzeit unter `src/client-v2/`?
- Wird die Karte in `load()` des Client-Plugins registriert?
- Hat der ToolCall einen von der Karte unterstützten Status erreicht?
- Wurde die Karte durch die Prüfung von `invokeStatus` deaktiviert?
- Wurde das Client-Plugin neu gebaut und geladen?

## Tool wird nach einem Klick auf die Karte nicht weiter ausgeführt

Stellen Sie sicher, dass `approve()`, `edit()` oder `reject()` aufgerufen wird. Wenn die Auswahl des Benutzers in die Parameter zurückgeschrieben werden soll, verwenden Sie:

```ts
await decisions.edit({
  ...toolCall.args,
  option: selectedOption,
});
```

Stellen Sie zugleich sicher, dass das serverseitige Schema dieses Feld zulässt und `invoke()` es ausliest.

## Änderungen an `definition.name` werden nicht wirksam

Der Name eines automatisch geladenen Tools wird durch den Datei- oder Verzeichnisnamen bestimmt. Zum Beispiel:

```text
src/ai/tools/developerChoice.ts
```

Der endgültige Name lautet `developerChoice`. Wenn Sie ihn ändern möchten, müssen Sie auch die Datei, die Referenz im Skill, die AI-Mitarbeiterkonfiguration und den im Frontend registrierten Namen umbenennen.

## Verwandte Links

- [Entwicklung von AI-Mitarbeiter-Plugins](./index.md) — Zur Übersicht des Entwicklungsleitfadens zurückkehren
- [Serverseitiges Tool definieren](./define-tool.md) — Benennung und Registrierung des Tools prüfen
- [Skill definieren](./define-skill.md) — Bindung zwischen Skill und Tool prüfen
- [Frontend-Interaktion für ein Tool hinzufügen](./frontend-tool-ui.md) — ToolCall und Frontend-Registrierung prüfen
