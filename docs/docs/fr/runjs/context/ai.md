---
title: "ctx.ai"
description: "Utilisez ctx.ai dans RunJS pour déclencher des tâches d'employé IA dans la conversation globale ou dans une AI Chat Box précise, avec un contenu direct ou avec les tâches configurées sur une action d'employé IA."
keywords: "ctx.ai,AI employee,uploadFile,attachments,triggerTask,triggerModelTask,onResponseLoadingChange,chatBoxUid,AI Chat Box,RunJS,NocoBase"
---

# ctx.ai

Dans RunJS, `ctx.ai` permet de déclencher des **tâches d'employé IA**. Il est utile dans JSBlock, JSAction et d'autres interactions où un bouton, un formulaire ou un flux métier doit confier un travail à un employé IA précis.

`ctx.ai` charge les pièces jointes des tâches IA et déclenche les tâches. Le chargement d'un fichier peut être attendu, mais le déclenchement d'une tâche ne renvoie pas son résultat d'exécution. Après l'appel, la tâche entre dans le flux de conversation de l'employé IA.

:::warning Remarque

`ctx.ai` est fourni par le plugin IA. Si le plugin IA n'est pas activé, ou si l'environnement RunJS actuel n'a pas chargé la capacité cliente correspondante, `ctx.ai` peut ne pas exister. Vous pouvez vérifier `ctx.ai?.uploadFile`, `ctx.ai?.triggerTask` ou `ctx.ai?.triggerModelTask` avant l'appel.

:::

## Méthodes

### ctx.ai.uploadFile()

Charge un fichier et renvoie un objet de pièce jointe qui peut être transmis directement à une tâche d'employé IA.

```ts
const attachment = await ctx.ai.uploadFile(file, options);
```

| Paramètre | Type | Description |
|------|------|------|
| `file` | `File` | Objet fichier du navigateur à charger. |
| `options.onProgress` | `(percent: number) => void` | Callback de progression du chargement. `percent` va de `0` à `100`. |
| `options.signal` | `AbortSignal` | Signal utilisé pour annuler le chargement. |

Le chargement utilise le stockage de fichiers configuré par le plugin IA et crée un enregistrement dans `aiFiles`. L'objet renvoyé contient notamment `id`, `filename`, `url` et `source`:

```ts
const attachment = await ctx.ai.uploadFile(file, {
  onProgress(percent) {
    console.log('upload progress', percent);
  },
});

// attachment peut être placé directement dans message.attachments
```

Le Promise est rejeté si le chargement échoue. Retirer une pièce jointe de la liste locale ne supprime pas l'enregistrement déjà créé dans `aiFiles`, comme dans la fenêtre de chat IA par défaut.

### ctx.ai.triggerTask()

Déclenche directement une tâche d'employé IA.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Paramètre | Type | Description |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | Employé IA. Si une chaîne est fournie, NocoBase cherche une correspondance exacte avec `AIEmployee.username`, accessible à l'utilisateur actuel. |
| `tasks` | `Task[]` | Liste des tâches à déclencher. |
| `chatBoxUid` | `string` | uid FlowModel du bloc AI Chat Box qui doit recevoir la tâche. |
| `open` | `boolean` | Indique s'il faut ouvrir le panneau de conversation de l'employé IA. |
| `auto` | `boolean` | Indique s'il faut utiliser la sémantique de déclenchement automatique d'une action d'employé IA. |
| `onResponseLoadingChange` | `(loading: boolean) => void` | Callback de l'état de chargement de la réponse. Il s'exécute uniquement lorsque cette tâche est envoyée automatiquement. |

Champs courants de `Task`:

| Champ | Type | Description |
|------|------|------|
| `title` | `string` | Titre de la tâche. |
| `message.system` | `string` | Message système qui contraint le rôle et les exigences de sortie de l'employé IA. |
| `message.user` | `string` | Message utilisateur, c'est-à-dire l'instruction principale de la tâche. |
| `message.attachments` | `Attachment[]` | Pièces jointes utilisées par la tâche, généralement renvoyées par `ctx.ai.uploadFile()`. |
| `message.workContext` | `ContextItem[]` | Contexte de blocs de page utilisé par la tâche. |
| `autoSend` | `boolean` | Indique si le message de tâche est envoyé automatiquement. |
| `webSearch` | `boolean` | Indique si la tâche peut utiliser Web search. |
| `model` | `{ llmService: string; model: string } \| null` | Modèle utilisé par cette tâche. |
| `skillSettings` | `SkillSettings` | Configuration des skills / tools disponibles pour cette tâche. |

### Suivre l'état de chargement de la réponse

Passez `onResponseLoadingChange` dans les options de premier niveau pour suivre l'état de chargement de la réponse du modèle. Le callback reçoit `true` lorsque NocoBase commence à attendre la réponse, puis `false` lorsqu'elle se termine, est annulée ou échoue. Si le composant React a déjà déclaré `setResponseLoading` avec `useState`, vous pouvez écrire :

```tsx
ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
      autoSend: true,
    },
  ],
  onResponseLoadingChange(loading) {
    setResponseLoading(loading);
  },
});
```

`onResponseLoadingChange` suit uniquement la réponse démarrée directement par cet appel à `triggerTask()`. Avec `autoSend: false`, la tâche reste dans le brouillon du chat et le callback ne s'exécute pas. Si l'utilisateur envoie le brouillon plus tard, cet envoi manuel ne réutilise pas le callback.

Dans un composant React d'un bloc JS, cette mise à jour provoque un nouveau rendu tant que le composant reste monté.

### Cibler une AI Chat Box

Définissez `chatBoxUid` dans les options de premier niveau de `triggerTask()` pour déclencher la tâche dans un bloc AI Chat Box monté, au lieu d'ouvrir la boîte de dialogue globale de l'employé IA.

```ts
ctx.ai.triggerTask({
  aiEmployee: 'nathan',
  chatBoxUid: 'AI_CHAT_BOX_BLOCK_UID',
  open: true,
  tasks: [
    {
      title: ctx.t('Review current page'),
      message: {
        user: 'Review the current page and summarize the main risks.',
      },
    },
  ],
});
```

Le uid doit appartenir au bloc AI Chat Box externe actuellement monté sur la page. Ne placez pas cette valeur de routage dans `tasks`. Si le bloc cible est introuvable, NocoBase affiche une erreur et ne revient pas à la boîte de dialogue globale. Lorsque `chatBoxUid` est omis, la tâche utilise la boîte de dialogue globale de l'employé IA.

### Charger et envoyer des pièces jointes dans JSBlock

L'exemple suivant affiche dans JSBlock un chargement de fichiers, les instructions de la tâche et un bouton d'envoi. Les fichiers chargés sont transmis à l'employé IA via `message.attachments`:

```tsx
if (!ctx.ai?.uploadFile || !ctx.ai?.triggerTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const { React } = ctx.libs;
const { useState } = React;
const { Button, Card, Input, Space, Upload } = ctx.libs.antd;
const { InboxOutlined, SendOutlined } = ctx.libs.antdIcons;

const AttachmentTask = () => {
  const [prompt, setPrompt] = useState('');
  const [fileList, setFileList] = useState([]);

  const uploadAttachment = async ({ file, onError, onProgress, onSuccess }) => {
    try {
      const attachment = await ctx.ai.uploadFile(file, {
        onProgress(percent) {
          onProgress?.({ percent });
        },
      });
      onSuccess?.(attachment);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(ctx.t('File upload failed')));
    }
  };

  const sendTask = () => {
    const attachments = fileList
      .filter((file) => file.status === 'done' && file.response)
      .map((file) => file.response);

    if (!prompt.trim()) {
      ctx.message.warning(ctx.t('Enter task instructions'));
      return;
    }

    ctx.ai.triggerTask({
      aiEmployee: 'viz',
      open: true,
      tasks: [
        {
          title: ctx.t('Analyze uploaded files'),
          message: {
            user: prompt.trim(),
            attachments,
          },
          autoSend: true,
        },
      ],
    });
    setPrompt('');
    setFileList([]);
  };

  const uploading = fileList.some((file) => file.status === 'uploading');

  return (
    <Card title={ctx.t('AI file analysis')}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Upload.Dragger
          multiple
          fileList={fileList}
          customRequest={uploadAttachment}
          onChange={({ fileList: nextFileList }) => setFileList(nextFileList)}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p>{ctx.t('Click or drag files here to upload')}</p>
        </Upload.Dragger>
        <Input.TextArea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={ctx.t('Describe the task for the AI employee')}
          autoSize={{ minRows: 3, maxRows: 8 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          disabled={uploading || !prompt.trim()}
          onClick={sendTask}
        >
          {ctx.t('Send to AI')}
        </Button>
      </Space>
    </Card>
  );
};

ctx.render(<AttachmentTask />);
```

Avec `autoSend: false`, les pièces jointes et les instructions sont placées dans le brouillon du chat IA et ne sont pas envoyées immédiatement.

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

Les options publiques de `triggerModelTask()` n'acceptent pas `chatBoxUid`. Pour cibler une AI Chat Box, configurez `chatBoxUid` sur la tâche prédéfinie de l'action d'employé IA. `triggerModelTask()` continue de réutiliser cette valeur prédéfinie.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Paramètre | Type | Description |
|------|------|------|
| `uid` | `string` | uid FlowModel de l'action d'employé IA. |
| `taskIndex` | `number` | Index de la tâche, à partir de `0`. |
| `options.open` | `boolean` | Indique s'il faut ouvrir le panneau de conversation de l'employé IA. |
| `options.auto` | `boolean` | Indique s'il faut utiliser la sémantique de déclenchement automatique d'une action d'employé IA. |
| `options.attachments` | `Attachment[]` | Pièces jointes ajoutées dynamiquement à la tâche configurée. |
| `options.onResponseLoadingChange` | `(loading: boolean) => void` | Callback de l'état de chargement de la réponse. Il s'exécute uniquement lorsque la tâche configurée est envoyée automatiquement. |

`options.onResponseLoadingChange` fonctionne comme dans `triggerTask()`. Son exécution dépend de la valeur `autoSend` de la tâche configurée. Il ne s'exécute pas lorsque la tâche utilise `autoSend: false`.

```ts
if (!ctx.ai?.triggerModelTask) {
  ctx.message.error(ctx.t('AI employee task API is not available.'));
  return;
}

const weeklyReviewActionUid = 'AI_EMPLOYEE_ACTION_MODEL_UID';

ctx.ai.triggerModelTask(weeklyReviewActionUid, 0, {
  open: true,
  attachments,
});

ctx.message.success(ctx.t('Configured AI employee task triggered.'));
```

Si le modèle cible n'existe pas, si aucun employé IA n'est configuré, ou si l'index indiqué ne correspond à aucune tâche, aucune tâche n'est déclenchée et un avertissement est affiché dans la console.

## Notes

- `triggerTask()` et `triggerModelTask()` sont fire-and-forget. Ils ne renvoient pas le résultat d'exécution de la tâche.
- `uploadFile()` renvoie un Promise. Attendez la fin du chargement avant de déclencher une tâche qui utilise la pièce jointe.
- Les chaînes `aiEmployee` correspondent uniquement à `AIEmployee.username` de façon exacte.
- `triggerModelTask()` utilise un `taskIndex` basé sur `0`.
- `message.workContext` décrit actuellement uniquement le contexte de blocs de page.
- La valeur de premier niveau `triggerTask().chatBoxUid` doit référencer un bloc AI Chat Box actuellement monté sur la page.
- `triggerModelTask()` continue d'utiliser le `chatBoxUid` configuré sur sa tâche prédéfinie.
- Les pièces jointes dynamiques de `triggerModelTask()` sont ajoutées aux `message.attachments` existants de la tâche prédéfinie sans modifier la configuration enregistrée.
- `onResponseLoadingChange` suit uniquement une réponse envoyée automatiquement par l'appel actuel. Il ne suit pas un message envoyé manuellement plus tard par l'utilisateur.

## Liens associés

- [ctx.message](./message.md): Afficher des messages légers avant et après le déclenchement.
- [ctx.render](./render.md): Rendre des boutons ou des formulaires dans JSBlock.
- [ctx.model](./model.md): Obtenir les informations du FlowModel actuel.
