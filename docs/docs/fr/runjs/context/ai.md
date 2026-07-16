---
title: "ctx.ai"
description: "Utilisez ctx.ai dans RunJS pour déclencher des tâches d'employé IA, avec un contenu de tâche direct ou avec les tâches configurées sur une action d'employé IA."
keywords: "ctx.ai,AI employee,triggerTask,triggerModelTask,RunJS,NocoBase"
---

# ctx.ai

Dans RunJS, `ctx.ai` permet de déclencher des **tâches d'employé IA**. Il est utile dans JSBlock, JSAction et d'autres interactions où un bouton, un formulaire ou un flux métier doit confier un travail à un employé IA précis.

`ctx.ai` ne fait que déclencher des tâches. Il ne renvoie pas le résultat d'exécution de la tâche. Après l'appel, la tâche entre dans le flux de conversation de l'employé IA.

:::warning Remarque

`ctx.ai` est fourni par le plugin IA. Si le plugin IA n'est pas activé, ou si l'environnement RunJS actuel n'a pas chargé la capacité cliente correspondante, `ctx.ai` peut ne pas exister. Vous pouvez vérifier `ctx.ai?.triggerTask` ou `ctx.ai?.triggerModelTask` avant l'appel.

:::

## Méthodes

### ctx.ai.triggerTask()

Déclenche directement une tâche d'employé IA.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Paramètre | Type | Description |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | Employé IA. Si une chaîne est fournie, NocoBase cherche une correspondance exacte avec `AIEmployee.username`, accessible à l'utilisateur actuel. |
| `tasks` | `Task[]` | Liste des tâches à déclencher. |
| `open` | `boolean` | Indique s'il faut ouvrir le panneau de conversation de l'employé IA. |
| `auto` | `boolean` | Indique s'il faut utiliser la sémantique de déclenchement automatique d'une action d'employé IA. |

Champs courants de `Task`:

| Champ | Type | Description |
|------|------|------|
| `title` | `string` | Titre de la tâche. |
| `message.system` | `string` | Message système qui contraint le rôle et les exigences de sortie de l'employé IA. |
| `message.user` | `string` | Message utilisateur, c'est-à-dire l'instruction principale de la tâche. |
| `message.workContext` | `ContextItem[]` | Contexte de blocs de page utilisé par la tâche. |
| `autoSend` | `boolean` | Indique si le message de tâche est envoyé automatiquement. |
| `webSearch` | `boolean` | Indique si la tâche peut utiliser Web search. |
| `model` | `{ llmService: string; model: string } \| null` | Modèle utilisé par cette tâche. |
| `skillSettings` | `SkillSettings` | Configuration des skills / tools disponibles pour cette tâche. |

### Ajouter le contexte de blocs de page

`message.workContext` sert actuellement à transmettre des blocs de page. Placez-y le uid FlowModel du bloc cible:

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

| Champ | Description |
|------|------|
| `type` | Valeur fixe `flow-model`, qui indique un contexte de bloc de page. |
| `uid` | uid FlowModel du bloc de page, par exemple un bloc tableau, détail ou graphique. |

Pour utiliser le JSBlock actuel comme contexte, utilisez le uid du modèle actuel:

```ts
workContext: [
  {
    type: 'flow-model',
    uid: ctx.model.uid,
  },
],
```

### Spécifier le modèle

`model` spécifie le modèle d'une tâche. S'il est omis, la configuration de modèle par défaut de l'employé IA est utilisée. `null` signifie qu'aucun modèle au niveau de la tâche n'est spécifié.

```ts
model: {
  llmService: 'openai-main',
  model: 'gpt-4.1',
}
```

### Configurer les skills / tools

`skillSettings` spécifie les skills et tools disponibles pour une tâche. S'il est omis, la configuration de capacités de l'employé IA est utilisée.

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: ['business-analysis-report'],
  tools: ['businessReportGenerator'],
}
```

Pour désactiver explicitement toutes les skills ou tools de cette tâche, passez des tableaux vides et conservez les champs de version:

```ts
skillSettings: {
  skillsVersion: 2,
  toolsVersion: 2,
  skills: [],
  tools: [],
}
```

Exemple:

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

Si `aiEmployee` est une chaîne, NocoBase recherche une correspondance exacte sur `username` parmi les employés IA accessibles à l'utilisateur actuel.

### ctx.ai.triggerModelTask()

Lit une tâche depuis un modèle d'action d'employé IA sur la page et la déclenche.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Paramètre | Type | Description |
|------|------|------|
| `uid` | `string` | uid FlowModel de l'action d'employé IA. |
| `taskIndex` | `number` | Index de la tâche, à partir de `0`. |
| `options.open` | `boolean` | Indique s'il faut ouvrir le panneau de conversation de l'employé IA. |
| `options.auto` | `boolean` | Indique s'il faut utiliser la sémantique de déclenchement automatique d'une action d'employé IA. |

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

Si le modèle cible n'existe pas, si aucun employé IA n'est configuré, ou si l'index indiqué ne correspond à aucune tâche, aucune tâche n'est déclenchée et un avertissement est affiché dans la console.

## Notes

- `triggerTask()` et `triggerModelTask()` sont fire-and-forget. Ils ne renvoient pas le résultat d'exécution de la tâche.
- Les chaînes `aiEmployee` correspondent uniquement à `AIEmployee.username` de façon exacte.
- `triggerModelTask()` utilise un `taskIndex` basé sur `0`.
- `message.workContext` décrit actuellement uniquement le contexte de blocs de page.

## Liens associés

- [ctx.message](./message.md): Afficher des messages légers avant et après le déclenchement.
- [ctx.render](./render.md): Rendre des boutons ou des formulaires dans JSBlock.
- [ctx.model](./model.md): Obtenir les informations du FlowModel actuel.
