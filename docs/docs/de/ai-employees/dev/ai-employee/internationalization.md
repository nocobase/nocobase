---
title: "Internationalisierung von AI-Mitarbeiter-Plugins"
description: "Einführung in Sprachdateien, Übersetzungsvorlagen und aktuelle Einschränkungen für Tools, Skills und Profile integrierter AI-Mitarbeiter in NocoBase."
keywords: "NocoBase,Internationalisierung von AI-Mitarbeiter-Plugins,Tool introduction,Skill introduction,locale"
---

# Internationalisierung von AI-Mitarbeiter-Plugins

Texte der Verwaltungsoberfläche in AI-Mitarbeiter-Plugins sollten in der aktuellen Oberflächensprache angezeigt werden. Tools und Skills können über `introduction` die locale-Dateien des eigenen Plugins verwenden. Für Mitarbeiterprofile gelten andere Regeln.

## Welche Inhalte internationalisiert werden müssen

Üblicherweise müssen Texte internationalisiert werden, die Administratoren oder Benutzern in der Oberfläche angezeigt werden:

- `introduction.title` und `introduction.about` eines Tools
- `introduction.title` und `introduction.about` eines Skills
- Texte in Frontend-Karten, Modalen und Aktionsschaltflächen

`definition.name`, `definition.description`, Schema-Beschreibungen, der Haupttext eines Skills und der System-Prompt eines AI-Mitarbeiters richten sich hauptsächlich an das Modell. Ändern Sie keine stabilen Tool-Namen oder Workflow-Inhalte nur für die Übersetzung der Oberfläche.

## Texte der Verwaltungsoberfläche von Tools und Skills übersetzen

Die `introduction` eines Tools kann die Übersetzungsvorlage `{{t(...)}}` verwenden:

```ts
introduction: {
  title: '{{t("ai.tools.greetDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}',
  about: '{{t("ai.tools.greetDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}',
},
```

Ein Skill verwendet dieselbe Schreibweise im Frontmatter von `SKILLS.md`:

```yaml
introduction:
  title: '{{t("ai.skills.welcomeDeveloper.title", { ns: "@nocobase/plugin-developer-helper" })}}'
  about: '{{t("ai.skills.welcomeDeveloper.about", { ns: "@nocobase/plugin-developer-helper" })}}'
```

Dabei muss `ns` mit dem Internationalisierungs-Namespace übereinstimmen, den das Plugin tatsächlich verwendet.

## Sprachdateien hinzufügen

Die Sprachdateien eines Plugins liegen im Verzeichnis `src/locale/`. Alle Sprachen verwenden dieselben Schlüssel; nur die jeweiligen Texte unterscheiden sich.

### Englische Texte hinzufügen

Fügen Sie die folgenden Einträge zu `src/locale/en-US.json` hinzu:

```json
{
  "ai.tools.greetDeveloper.title": "Developer name check",
  "ai.tools.greetDeveloper.about": "Validate the developer name before writing a welcome message.",
  "ai.tools.developerChoice.title": "Developer choices",
  "ai.tools.developerChoice.about": "Ask the developer to choose the next plugin capability.",
  "ai.skills.welcomeDeveloper.title": "Developer welcome",
  "ai.skills.welcomeDeveloper.about": "Welcome a developer and ask what plugin capability they want to build."
}
```

### Chinesische Texte hinzufügen

Fügen Sie die folgenden Einträge zu `src/locale/zh-CN.json` hinzu:

```json
{
  "ai.tools.greetDeveloper.title": "开发者姓名确认",
  "ai.tools.greetDeveloper.about": "在生成欢迎语之前确认开发者姓名。",
  "ai.tools.developerChoice.title": "开发方向选择",
  "ai.tools.developerChoice.about": "让开发者选择下一步要实现的插件能力。",
  "ai.skills.welcomeDeveloper.title": "欢迎开发者",
  "ai.skills.welcomeDeveloper.about": "欢迎开发者，并询问接下来要实现的插件能力。"
}
```

## Aktuelle Einschränkungen für AI-Mitarbeiterprofile

`nickname`, `position`, `bio` und `greeting` in einem AI-Mitarbeiterprofil verwenden nicht den oben beschriebenen Mechanismus mit `{{t(...)}}`. Die Laufzeit für integrierte Mitarbeiter übersetzt diese Rohtexte derzeit im Namespace `@nocobase/plugin-ai`. Plugins von Drittanbietern sollten daher nicht davon ausgehen, dass ein eigener Namespace automatisch wirksam wird.

Wenn keine zusätzliche Lokalisierungslogik angebunden ist, wählen Sie für das Mitarbeiterprofil eine Standardsprache. Legen Sie die Oberflächentexte von Tools, Skills und Frontend-Interaktionen in den locale-Dateien des eigenen Plugins ab.

## Verwandte Links

- [Entwicklung von AI-Mitarbeiter-Plugins](./index.md) — Zur Übersicht des Entwicklungsleitfadens zurückkehren
- [Serverseitiges Tool definieren](./define-tool.md) — Übersetzungsvorlagen in der Tool-`introduction` verwenden
- [Skill definieren](./define-skill.md) — Übersetzungsvorlagen im Skill-Frontmatter verwenden
- [Integrierten AI-Mitarbeiter definieren](./define-ai-employee.md) — Felder des Mitarbeiterprofils kennenlernen
- [Frontend-Interaktion für ein Tool hinzufügen](./frontend-tool-ui.md) — Oberflächentexte für Frontend-Karten und Modale übersetzen
