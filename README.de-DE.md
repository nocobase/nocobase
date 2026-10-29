# NocoBase 3

> Dieser Branch enthält NocoBase 3. Wenn du die No-Code-Plattform NocoBase 2 suchst, besuche [NocoBase 2](https://nocode.nocobase.com/).

[English](./README.md) | [Español](./README.es-ES.md) | [Français](./README.fr-FR.md) | Deutsch | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [Bahasa Indonesia](./README.id-ID.md) | [Tiếng Việt](./README.vi-VN.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja-JP.md) | [한국어](./README.ko-KR.md)

**Zuverlässige Geschäftssysteme bauen**

NocoBase ist die Open-Source-Plattform, mit der Sie Geschäftssysteme mit KI entwickeln, betreiben und weiterentwickeln. Agenten schreiben den Code und erledigen die Arbeit, NocoBase liefert Fundament und Governance, und Menschen treffen die Entscheidungen.

[▶ Demo ansehen](https://static-docs.nocobase.com/nocobase-3-de.mp4)

[Website](https://www.nocobase.com/de-DE/) · [Dokumentation](https://docs.nocobase.com/) · [Schnellstart](#quick-start) · [Community](https://forum.nocobase.com/)

## Warum NocoBase

**KI schreibt Code im Handumdrehen. Zuverlässige Geschäftssysteme zu bauen, bleibt schwer.**

Ihr Team entwickelt bereits mit KI oder per Vibe Coding. Der Code entsteht schnell, doch neue Probleme kommen hinzu.

- **Das Fundament entsteht jedes Mal neu**

  Auch wenn KI den Code schreibt, bleiben Berechtigungen, Workflow-Engines und Freigaben schwer von Grund auf zu entwerfen. Es gibt viele Sonderfälle, und die Wartung ist aufwendig.

- **Die Architektur gerät außer Kontrolle**

  Wechseln Entwickler, Modell oder auch nur die Sitzung, kann die KI jedes Mal anders improvisieren. Das System wird immer schwerer wartbar.

- **Mehr parallele Arbeit, als sich prüfen lässt**

  Sie jonglieren mit mehreren Projekten und Aufgaben, wechseln zwischen Terminals und Chats, und die Agenten liefern immer mehr Änderungen. Niemand kann alles prüfen, doch die Kontrolle abzugeben, scheint zu riskant.

- **Wissen lässt sich schwer festhalten und teilen**

  Anforderungskontext, Geschäftsunterlagen und Erfahrungen verteilen sich auf Chats auf verschiedenen Rechnern. Wechseln Menschen oder Agenten, findet man sie kaum wieder.

<a id="quick-start"></a>

## Schnellstart

Voraussetzungen sind Node.js 24+ und pnpm 11. Verwende unter Windows WSL. Die Beispiele nutzen SQLite; ein separater Datenbankserver ist nicht erforderlich.

### Mit einem Coding-Agenten

Öffne einen Coding-Agenten mit Skills-Unterstützung in einem leeren Verzeichnis und installiere den Skill zur Anwendungserstellung:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Wähle bei der Installation deinen Agenten aus. Falls er den neuen Skill nicht erkennt, starte eine neue Sitzung. Sende anschließend:

```text
Befolge den Skill nocobase-create-app, um im aktuellen leeren Verzeichnis eine NocoBase-3-Anwendung mit der Standardvorlage und SQLite zu erstellen und zu starten.
```

### Im Terminal

Führe die folgenden Befehle im übergeordneten Verzeichnis deiner Projekte aus:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

Weitere Einrichtungsschritte und Entwicklungsanleitungen findest du in der [Dokumentation](https://docs.nocobase.com/).

## Das NocoBase-Ökosystem

- **[NocoBase Core](https://www.nocobase.com/de-DE/core/)**

  **Ihre Agenten kümmern sich um die Geschäftslogik. Das Fundament steht bereit.**

  NocoBase Core ist das Open-Source-Anwendungsfundament für Geschäftssysteme, die mit KI entwickelt und betrieben werden. Berechtigungen, Workflows, Dateien und weitere Bausteine sind sofort einsatzbereit. So entwickeln Agenten nur, was Ihr Geschäft ausmacht, auf einer einheitlichen Architektur.

- **[NocoBase Studio](https://www.nocobase.com/de-DE/studio/)**

  **Agenten treiben die Arbeit voran. Ihr Team behält die Kontrolle.**

  NocoBase Studio ist die Governance-Plattform für Menschen und Agenten, die gemeinsam Software entwickeln. Es bündelt Claude Code, Codex und OpenCode zu einem Agenten-Team, das Aufgaben selbstständig vorantreibt. Der Fortschritt ist auf einen Blick sichtbar, und die wichtigen Entscheidungen treffen Menschen.

- **[NocoBase Solution](https://www.nocobase.com/de-DE/solutions/)**

  **Geschäftsanwendungen als Open Source. KI-gesteuert, sofort einsatzbereit.**

  NocoBase Solution ist eine Reihe agentengesteuerter Geschäftsanwendungen auf Basis von Core. Agenten erledigen den Großteil der Arbeit, Menschen treffen nur die wichtigen Entscheidungen.

## Community und Beiträge

- Stelle Fragen und teile deine Erfahrungen im [Community-Forum](https://forum.nocobase.com/).
- Melde reproduzierbare Fehler und schlage Verbesserungen über [GitHub Issues](https://github.com/nocobase/nocobase/issues) vor.
- Lies die [Dokumentation](https://docs.nocobase.com/), um das Framework und die Plugins kennenzulernen.

Beiträge sind willkommen. Lies vor Änderungen an diesem Repository [AGENTS.md](./AGENTS.md) und die für deine Änderung relevanten Entwicklungsanweisungen.
