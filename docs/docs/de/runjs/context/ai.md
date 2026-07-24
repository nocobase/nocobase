---
title: "ctx.ai"
description: "Verwenden Sie ctx.ai in RunJS, um KI-Mitarbeiteraufgaben im globalen Dialog oder in einer angegebenen AI Chat Box auszulösen, entweder mit direkt übergebenem Aufgabeninhalt oder mit Aufgaben aus einer KI-Mitarbeiteraktion."
keywords: "ctx.ai,AI employee,uploadFile,attachments,triggerTask,triggerModelTask,onResponseLoadingChange,chatBoxUid,AI Chat Box,RunJS,NocoBase"
---

# ctx.ai

Mit `ctx.ai` können Sie in RunJS **KI-Mitarbeiteraufgaben** auslösen. Das ist nützlich in JSBlock, JSAction und anderen Interaktionen, bei denen ein Button, Formular oder Geschäftsablauf Arbeit an einen bestimmten KI-Mitarbeiter übergibt.

`ctx.ai` lädt Anhänge für KI-Aufgaben hoch und löst Aufgaben aus. Datei-Uploads können abgewartet werden, das Auslösen einer Aufgabe gibt jedoch kein Ausführungsergebnis zurück. Nach dem Aufruf läuft die Aufgabe im Konversationsfluss des KI-Mitarbeiters weiter.

:::warning Hinweis

`ctx.ai` wird vom AI-Plugin bereitgestellt. Wenn das AI-Plugin nicht aktiviert ist oder die aktuelle RunJS-Umgebung die passende Client-Funktion nicht geladen hat, kann `ctx.ai` fehlen. Prüfen Sie vor dem Aufruf `ctx.ai?.uploadFile`, `ctx.ai?.triggerTask` oder `ctx.ai?.triggerModelTask`.

:::

## Methoden

### ctx.ai.uploadFile()

Lädt eine Datei hoch und gibt ein Anhangsobjekt zurück, das direkt an eine KI-Mitarbeiteraufgabe übergeben werden kann.

```ts
const attachment = await ctx.ai.uploadFile(file, options);
```

| Parameter | Typ | Beschreibung |
|------|------|------|
| `file` | `File` | Browser-Dateiobjekt, das hochgeladen werden soll. |
| `options.onProgress` | `(percent: number) => void` | Rückruf für den Upload-Fortschritt. `percent` liegt zwischen `0` und `100`. |
| `options.signal` | `AbortSignal` | Signal zum Abbrechen des Uploads. |

Der Upload verwendet den im AI-Plugin konfigurierten Dateispeicher und erstellt einen Datensatz in `aiFiles`. Das zurückgegebene Objekt enthält unter anderem `id`, `filename`, `url` und `source`:

```ts
const attachment = await ctx.ai.uploadFile(file, {
  onProgress(percent) {
    console.log('upload progress', percent);
  },
});

// attachment kann direkt in message.attachments verwendet werden
```

Bei einem Fehler wird das Promise abgelehnt. Wenn ein Anhang nur aus der lokalen Dateiliste entfernt wird, bleibt der bereits in `aiFiles` erstellte Datensatz bestehen. Dieses Verhalten entspricht dem standardmäßigen KI-Chatfenster.

### ctx.ai.triggerTask()

Löst eine KI-Mitarbeiteraufgabe direkt aus.

```ts
ctx.ai.triggerTask(options: TriggerTaskOptions): void
```

| Parameter | Typ | Beschreibung |
|------|------|------|
| `aiEmployee` | `string \| AIEmployee` | KI-Mitarbeiter. Bei einer Zeichenkette wird exakt gegen `AIEmployee.username` abgeglichen, und der KI-Mitarbeiter muss für den aktuellen Benutzer zugänglich sein. |
| `tasks` | `Task[]` | Auszulösende Aufgaben. |
| `chatBoxUid` | `string` | FlowModel uid des AI-Chat-Box-Blocks, der die Aufgabe empfangen soll. |
| `open` | `boolean` | Ob das Konversationspanel des KI-Mitarbeiters geöffnet wird. |
| `auto` | `boolean` | Ob die automatische Auslösesemantik einer KI-Mitarbeiteraktion verwendet wird. |
| `onResponseLoadingChange` | `(loading: boolean) => void` | Callback für den Ladezustand der Modellantwort. Er wird nur ausgeführt, wenn diese Aufgabe automatisch gesendet wird. |

Häufige Felder von `Task`:

| Feld | Typ | Beschreibung |
|------|------|------|
| `title` | `string` | Aufgabentitel. |
| `message.system` | `string` | Systemnachricht zur Eingrenzung von Rolle und Ausgabeanforderungen. |
| `message.user` | `string` | Benutzernachricht, also die Hauptanweisung der Aufgabe. |
| `message.attachments` | `Attachment[]` | Anhänge der Aufgabe, normalerweise aus `ctx.ai.uploadFile()`. |
| `message.workContext` | `ContextItem[]` | Seitenblockkontext, den die Aufgabe verwendet. |
| `autoSend` | `boolean` | Ob die Aufgabennachricht automatisch gesendet wird. |
| `webSearch` | `boolean` | Ob diese Aufgabe Web search verwenden darf. |
| `model` | `{ llmService: string; model: string } \| null` | Modell für diese Aufgabe. |
| `skillSettings` | `SkillSettings` | Skills / tools für diese Aufgabe. |

### Ladezustand der Antwort verfolgen

Übergeben Sie `onResponseLoadingChange` in den Optionen auf oberster Ebene, um den Ladezustand der Modellantwort zu verfolgen. Der Callback erhält `true`, sobald NocoBase auf die Modellantwort wartet, und `false`, wenn sie abgeschlossen, abgebrochen oder fehlgeschlagen ist. Wenn die React-Komponente `setResponseLoading` bereits mit `useState` deklariert hat, können Sie Folgendes schreiben:

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

`onResponseLoadingChange` verfolgt nur die Modellantwort, die direkt durch diesen `triggerTask()`-Aufruf gestartet wurde. Bei `autoSend: false` bleibt die Aufgabe im Chatentwurf und der Callback wird nicht ausgeführt. Wenn der Benutzer den Entwurf später manuell sendet, wird dieser Callback nicht wiederverwendet.

In einer React-Komponente eines JS-Blocks löst diese Zustandsänderung ein erneutes Rendern aus, solange die Komponente eingebunden bleibt.

### Eine AI Chat Box als Ziel festlegen

Setzen Sie `chatBoxUid` in den Optionen von `triggerTask()` auf oberster Ebene, um die Aufgabe in einem eingebundenen AI-Chat-Box-Block statt im globalen KI-Mitarbeiterdialog auszulösen.

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

Die uid muss zum äußeren AI-Chat-Box-Block gehören, der aktuell auf der Seite eingebunden ist. Legen Sie diesen Routing-Wert nicht in `tasks` ab. Wenn der Zielblock nicht gefunden wird, meldet NocoBase einen Fehler und fällt nicht auf den globalen Dialog zurück. Ohne `chatBoxUid` wird die Aufgabe im globalen KI-Mitarbeiterdialog ausgelöst.

### Anhänge in JSBlock hochladen und senden

Das folgende Beispiel rendert in JSBlock einen Datei-Upload, ein Feld für die Aufgabenanweisung und einen Senden-Button. Hochgeladene Dateien werden über `message.attachments` an den KI-Mitarbeiter übergeben:

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

Mit `autoSend: false` werden Anhänge und Aufgabenanweisung als Entwurf in den KI-Chat übernommen, aber nicht sofort gesendet.

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

Die öffentlichen Optionen von `triggerModelTask()` akzeptieren kein `chatBoxUid`. Um eine AI Chat Box als Ziel festzulegen, konfigurieren Sie `chatBoxUid` in der vordefinierten Aufgabe der KI-Mitarbeiteraktion. `triggerModelTask()` verwendet diesen voreingestellten Wert weiterhin.

```ts
ctx.ai.triggerModelTask(uid: string, taskIndex: number, options?: TriggerModelTaskOptions): void
```

| Parameter | Typ | Beschreibung |
|------|------|------|
| `uid` | `string` | FlowModel uid der KI-Mitarbeiteraktion. |
| `taskIndex` | `number` | Aufgabenindex, beginnend bei `0`. |
| `options.open` | `boolean` | Ob das Konversationspanel des KI-Mitarbeiters geöffnet wird. |
| `options.auto` | `boolean` | Ob die automatische Auslösesemantik einer KI-Mitarbeiteraktion verwendet wird. |
| `options.attachments` | `Attachment[]` | Anhänge, die dynamisch an die konfigurierte Aufgabe angefügt werden. |
| `options.onResponseLoadingChange` | `(loading: boolean) => void` | Callback für den Ladezustand der Modellantwort. Er wird nur ausgeführt, wenn die konfigurierte Aufgabe automatisch gesendet wird. |

`options.onResponseLoadingChange` verhält sich wie bei `triggerTask()`. Ob der Callback ausgeführt wird, hängt vom Wert `autoSend` der konfigurierten Aufgabe ab. Bei `autoSend: false` wird er nicht ausgeführt.

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

Wenn das Zielmodell nicht existiert, kein KI-Mitarbeiter konfiguriert ist oder der angegebene Index keine Aufgabe enthält, wird keine Aufgabe ausgelöst und eine Warnung in der Konsole ausgegeben.

## Hinweise

- `triggerTask()` und `triggerModelTask()` sind fire-and-forget. Sie geben kein Ausführungsergebnis der KI-Mitarbeiteraufgabe zurück.
- `uploadFile()` gibt ein Promise zurück. Warten Sie auf den Abschluss des Uploads, bevor Sie eine Aufgabe mit diesem Anhang auslösen.
- Zeichenketten in `aiEmployee` werden nur exakt gegen `AIEmployee.username` abgeglichen.
- `triggerModelTask()` verwendet einen `taskIndex`, der bei `0` beginnt.
- `message.workContext` beschreibt aktuell nur Seitenblockkontext.
- `triggerTask().chatBoxUid` auf oberster Ebene muss auf einen aktuell eingebundenen AI-Chat-Box-Block verweisen.
- `triggerModelTask()` verwendet weiterhin das in der vordefinierten Aufgabe konfigurierte `chatBoxUid`.
- Dynamische Anhänge von `triggerModelTask()` werden an vorhandene `message.attachments` der vordefinierten Aufgabe angefügt, ohne die gespeicherte Konfiguration zu ändern.
- `onResponseLoadingChange` verfolgt nur eine von diesem Aufruf automatisch gesendete Modellantwort. Eine später manuell gesendete Nachricht wird nicht verfolgt.

## Verwandte Themen

- [ctx.message](./message.md): Zeigt leichte Hinweise vor und nach dem Auslösen von Aufgaben.
- [ctx.render](./render.md): Rendert Buttons oder Formulare in JSBlock.
- [ctx.model](./model.md): Ruft Informationen zum aktuellen FlowModel ab.
