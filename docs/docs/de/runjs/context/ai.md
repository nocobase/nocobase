---
title: "ctx.ai"
description: "Verwenden Sie ctx.ai in RunJS, um KI-Mitarbeiteraufgaben auszulösen, entweder mit direkt übergebenem Aufgabeninhalt oder mit Aufgaben aus einer KI-Mitarbeiteraktion."
keywords: "ctx.ai,AI employee,triggerTask,triggerModelTask,RunJS,NocoBase"
---

# ctx.ai

Mit `ctx.ai` können Sie in RunJS **KI-Mitarbeiteraufgaben** auslösen. Das ist nützlich in JSBlock, JSAction und anderen Interaktionen, bei denen ein Button, Formular oder Geschäftsablauf Arbeit an einen bestimmten KI-Mitarbeiter übergibt.

`ctx.ai` löst nur Aufgaben aus. Das Ergebnis der KI-Mitarbeiteraufgabe wird nicht zurückgegeben. Nach dem Aufruf läuft die Aufgabe im Konversationsfluss des KI-Mitarbeiters weiter.

:::warning Hinweis

`ctx.ai` wird vom AI-Plugin bereitgestellt. Wenn das AI-Plugin nicht aktiviert ist oder die aktuelle RunJS-Umgebung die passende Client-Funktion nicht geladen hat, kann `ctx.ai` fehlen. Prüfen Sie vor dem Aufruf `ctx.ai?.triggerTask` oder `ctx.ai?.triggerModelTask`.

:::

## Methoden

### ctx.ai.triggerTask()

Löst eine KI-Mitarbeiteraufgabe direkt aus.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Parameter | Typ | Beschreibung |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | KI-Mitarbeiter. Bei einer Zeichenkette wird exakt gegen `AIEmployee.username` abgeglichen, und der KI-Mitarbeiter muss für den aktuellen Benutzer zugänglich sein. |
| `tasks` | `Task[]` | Auszulösende Aufgaben. |
| `open` | `boolean` | Ob das Konversationspanel des KI-Mitarbeiters geöffnet wird. |
| `auto` | `boolean` | Ob die automatische Auslösesemantik einer KI-Mitarbeiteraktion verwendet wird. |

Häufige Felder von `Task`:

| Feld | Typ | Beschreibung |
|------|------|------|
| `title` | `string` | Aufgabentitel. |
| `message.system` | `string` | Systemnachricht zur Eingrenzung von Rolle und Ausgabeanforderungen. |
| `message.user` | `string` | Benutzernachricht, also die Hauptanweisung der Aufgabe. |
| `message.workContext` | `ContextItem[]` | Seitenblockkontext, den die Aufgabe verwendet. |
| `autoSend` | `boolean` | Ob die Aufgabennachricht automatisch gesendet wird. |
| `webSearch` | `boolean` | Ob diese Aufgabe Web search verwenden darf. |
| `model` | `{ llmService: string; model: string } \| null` | Modell für diese Aufgabe. |
| `skillSettings` | `SkillSettings` | Skills / tools für diese Aufgabe. |

### Seitenblockkontext hinzufügen

`message.workContext` wird aktuell verwendet, um Seitenblöcke zu übergeben. Tragen Sie dort die FlowModel uid des Zielblocks ein:

```ts
message: {
  user: 'Review the current users table and summarize operational risks.',
  workContext: [
    {
      type: 'flow-model',
      uid: 'USERS_TABLE_BLOCK_UID',
    },
  ],
}
```

| Feld | Beschreibung |
|------|------|
| `type` | Fest `flow-model`, zeigt einen Seitenblockkontext an. |
| `uid` | FlowModel uid des Seitenblocks, etwa Tabellen-, Detail- oder Diagrammblock. |

Wenn der aktuelle JSBlock selbst als Kontext verwendet werden soll, nutzen Sie die uid des aktuellen Modells:

```ts
workContext: [
  {
    type: 'flow-model',
    uid: ctx.model.uid,
  },
],
```

### Modell angeben

`model` legt das Modell für eine einzelne Aufgabe fest. Ohne Angabe wird die Standardmodellkonfiguration des KI-Mitarbeiters verwendet. `null` bedeutet, dass kein Modell auf Aufgabenebene gesetzt wird.

```ts
model: {
  llmService: 'openai-main',
  model: 'gpt-4.1',
}
```

### Skills / tools konfigurieren

`skillSettings` legt fest, welche skills und tools einer einzelnen Aufgabe zur Verfügung stehen. Ohne Angabe wird die Fähigkeitskonfiguration des KI-Mitarbeiters verwendet.

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: ['business-analysis-report'],
  tools: ['businessReportGenerator'],
}
```

Um alle skills oder tools für diese Aufgabe ausdrücklich zu deaktivieren, übergeben Sie leere Arrays und behalten die Versionsfelder bei:

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: [],
  tools: [],
}
```

Beispiel:

```ts
if (!ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

ctx.ai.triggerTask({
  aiEmployee: 'viz',
  open: true,
  tasks: [
    {
      title: ctx.t('Daily operations handoff brief'),
      message: {
        system:
          'You prepare reusable daily operations handoff briefs. Focus on risks, blockers, decisions, owners, and next actions.',
        user: [
          "Prepare today's operations handoff brief.",
          'Cover customer escalations, SLA risks, approvals, and follow-up owners.',
          'Return a concise brief that can be posted to the team channel.',
        ].join('\n'),
      },
      autoSend: true,
      webSearch: false,
    },
  ],
});

ctx.message.success(ctx.t('AI employee task triggered.'));
```

Wenn `aiEmployee` eine Zeichenkette ist, sucht NocoBase exakt nach `username` unter den KI-Mitarbeitern, auf die der aktuelle Benutzer zugreifen kann.

### ctx.ai.triggerModelTask()

Liest eine Aufgabe aus einem KI-Mitarbeiteraktionsmodell auf der Seite und löst sie aus.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Parameter | Typ | Beschreibung |
|------|------|------|
| `uid` | `string` | FlowModel uid der KI-Mitarbeiteraktion. |
| `taskIndex` | `number` | Aufgabenindex, beginnend bei `0`. |
| `options.open` | `boolean` | Ob das Konversationspanel des KI-Mitarbeiters geöffnet wird. |
| `options.auto` | `boolean` | Ob die automatische Auslösesemantik einer KI-Mitarbeiteraktion verwendet wird. |

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

Wenn das Zielmodell nicht existiert, kein KI-Mitarbeiter konfiguriert ist oder der angegebene Index keine Aufgabe enthält, wird keine Aufgabe ausgelöst und eine Warnung in der Konsole ausgegeben.

## Hinweise

- `triggerTask()` und `triggerModelTask()` sind fire-and-forget. Sie geben kein Ausführungsergebnis der KI-Mitarbeiteraufgabe zurück.
- Zeichenketten in `aiEmployee` werden nur exakt gegen `AIEmployee.username` abgeglichen.
- `triggerModelTask()` verwendet einen `taskIndex`, der bei `0` beginnt.
- `message.workContext` beschreibt aktuell nur Seitenblockkontext.

## Verwandte Themen

- [ctx.message](./message.md): Zeigt leichte Hinweise vor und nach dem Auslösen von Aufgaben.
- [ctx.render](./render.md): Rendert Buttons oder Formulare in JSBlock.
- [ctx.model](./model.md): Ruft Informationen zum aktuellen FlowModel ab.
