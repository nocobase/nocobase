---
title: "Component-Entwicklung"
description: "NocoBase Client-Component-Entwicklung: Plugin-Seitencomponents mit React/Antd entwickeln, Zustandsverwaltung mit observable, Zugriff auf NocoBase-Kontextfähigkeiten über useFlowContext()."
keywords: "Component,Component-Entwicklung,React,Antd,observable,observer,useFlowContext,ctx,NocoBase"
---

# Component-Entwicklung

In NocoBase sind die in der Route eingebundenen Seitencomponents gewöhnliche React Components. Sie können diese direkt mit React + [Antd](https://5x.ant.design/) schreiben — das unterscheidet sich nicht von gewöhnlicher Frontend-Entwicklung.

NocoBase stellt zusätzlich folgende Hilfsmittel bereit:

- **`observable` + `observer`** — die empfohlene Art der Zustandsverwaltung, besser geeignet für das NocoBase-Ökosystem als `useState`
- **`useFlowContext()`** — Zugriff auf die Kontextfähigkeiten von NocoBase (Anfragen senden, Internationalisierung, Routennavigation usw.)

## Grundlegende Schreibweise

Ein einfachstes Seitencomponent:

```tsx
// pages/HelloPage.tsx
export default function HelloPage() {
  return <h1>Hello, NocoBase!</h1>;
}
```

Nach dem Schreiben registrieren Sie es im `load()` des Plugins über `this.router.add()`. Details siehe [Router](../router).

## Zustandsverwaltung: observable

NocoBase empfiehlt, statt Reacts `useState` `observable` + `observer` zur Zustandsverwaltung von Components zu verwenden. Vorteile:

- Direkte Änderungen an Objekteigenschaften lösen Aktualisierungen aus, kein `setState` nötig
- Automatische Abhängigkeitsverfolgung, das Component rendert nur dann erneut, wenn tatsächlich verwendete Eigenschaften sich ändern
- Konsistent mit dem Reaktivitätsmechanismus der NocoBase-Basis (FlowModel, FlowContext usw.)

Grundlegende Verwendung: Erstellen Sie ein reaktives Objekt mit `observable.deep()` und umhüllen Sie das Component mit `observer()`. Sowohl `observable` als auch `observer` werden aus `@nocobase/flow-engine` importiert:

```tsx
import React from 'react';
import { Input } from 'antd';
import { observable, observer } from '@nocobase/flow-engine';

// Ein reaktives Zustandsobjekt erstellen
const state = observable.deep({
  text: '',
});

// Component mit observer umhüllen, wird automatisch bei Zustandsänderungen aktualisiert
const DemoPage = observer(() => {
  return (
    <div>
      <Input
        placeholder="Geben Sie etwas ein..."
        value={state.text}
        onChange={(e) => {
          state.text = e.target.value;
        }}
      />
      {state.text && <div style={{ marginTop: 8 }}>Sie haben eingegeben: {state.text}</div>}
    </div>
  );
});

export default DemoPage;
```

Live-Vorschau:

```tsx file="./_demos/observable-basic.tsx" preview
```

Mehr zur Verwendung siehe [Reaktivitätsmechanismus Observable](../../../flow-engine/observable).

## useFlowContext verwenden

`useFlowContext()` ist der Einstiegspunkt zu den NocoBase-Fähigkeiten. Es wird aus `@nocobase/flow-engine` importiert und gibt ein `ctx`-Objekt zurück:

```tsx
import { useFlowContext } from '@nocobase/flow-engine';

export default function MyPage() {
  const ctx = useFlowContext();
  // ctx.api — Anfragen senden
  // ctx.t — Internationalisierung
  // ctx.router — Routennavigation
  // ctx.logger — Logging
  // ...
}
```

Im Folgenden Beispiele für häufig verwendete Fähigkeiten.

### Anfragen senden

Über `ctx.api.request()` rufen Sie Backend-Schnittstellen auf, die Verwendung entspricht [Axios](https://axios-http.com/):

```tsx
const response = await ctx.api.request({
  url: 'users:list',
  method: 'get',
});
console.log(response.data);
```

### Internationalisierung

Über `ctx.t()` erhalten Sie übersetzte Texte:

```tsx
const label = ctx.t('Hello');
// Mit Namespace
const msg = ctx.t('Save success', { ns: '@my-project/plugin-hello' });
```

### Routennavigation

Über `ctx.router.navigate()` zu einer anderen Seite navigieren:

```tsx
ctx.router.navigate('/some-page'); // -> /v2/some-page
```

Aktuelle Routenparameter abrufen:

```tsx
// Beispielsweise mit der Route /users/:id
const { id } = ctx.route.params; // Dynamischen Parameter holen
```

Aktuellen Routennamen abrufen:

```tsx
const { name } = ctx.route; // Routennamen holen
```

<!-- ### Nachrichten, Modals, Benachrichtigungen

NocoBase kapselt die Antd-Feedback-Components über ctx, sodass sie direkt im Logikcode aufgerufen werden können:

```tsx
// Nachricht (leichtgewichtig, verschwindet automatisch)
ctx.message.success('Erfolgreich gespeichert');

// Modal-Bestätigung (blockierend, wartet auf Benutzeraktion)
const confirmed = await ctx.modal.confirm({
  title: 'Wirklich löschen?',
  content: 'Nicht wiederherstellbar nach dem Löschen',
});

// Benachrichtigung (rechts angezeigt, geeignet für längere Hinweise)
ctx.notification.open({
  message: 'Import abgeschlossen',
  description: '42 Datensätze importiert',
});
```

### Logging

Strukturierte Logs über `ctx.logger`:

```tsx
ctx.logger.info('Seite geladen', { page: 'UserList' });
ctx.logger.error('Datenladen fehlgeschlagen', { error });
``` -->

Mehr zu Log-Levels und Verwendung siehe [Context → Häufige Fähigkeiten](../ctx/common-capabilities).

## Vollständiges Beispiel

Eine Seite, die observable, useFlowContext und Antd kombiniert und Daten vom Backend abruft und anzeigt:

```tsx
// pages/PostListPage.tsx
import React, { useEffect } from 'react';
import { Button, Card, List, Spin } from 'antd';
import { observable, observer, FlowContext, useFlowContext } from '@nocobase/flow-engine';

interface Post {
  id: number;
  title: string;
}

// Seitenzustand mit observable verwalten
const state = observable.deep({
  posts: [] as Post[],
  loading: true,
});

const PostListPage = observer(() => {
  const ctx = useFlowContext();

  useEffect(() => {
    loadPosts(ctx);
  }, []);

  return (
    <Card title={ctx.t('Post list')}>
      <Spin spinning={state.loading}>
        <List
          dataSource={state.posts}
          renderItem={(post: Post) => (
            <List.Item
              actions={[
                <Button danger onClick={() => handleDelete(ctx, post.id)}>
                  {ctx.t('Delete')}
                </Button>,
              ]}
            >
              {post.title}
            </List.Item>
          )}
        />
      </Spin>
    </Card>
  );
});

async function loadPosts(ctx: FlowContext) {
  state.loading = true;
  try {
    const response = await ctx.api.request({
      url: 'posts:list',
      method: 'get',
    });
    state.posts = response.data?.data || [];
  } catch (error) {
    ctx.logger.error('Beitragsliste konnte nicht geladen werden', { error });
  } finally {
    state.loading = false;
  }
}

async function handleDelete(ctx: FlowContext, id: number) {
  await ctx.api.request({
    url: `posts:destroy/${id}`,
    method: 'post',
  });
  loadPosts(ctx); // Liste aktualisieren
}

export default PostListPage;
```

## Wie geht es weiter

- Vollständige Fähigkeiten von `useFlowContext` — siehe [Context](../ctx/index.md)
- Component-Styles und Theme-Anpassung — siehe [Styles & Themes](./styles-themes)
- Wenn Ihr Component im Menü „Block / Feld / Aktion hinzufügen" von NocoBase erscheinen und vom Benutzer visuell konfigurierbar sein muss, verpacken Sie es mit einem FlowModel — siehe [FlowEngine](../flow-engine/index.md)
- Unsicher, ob Component oder FlowModel verwenden? — siehe [Component vs FlowModel](../component-vs-flow-model)

## Verwandte Links

- [Router](../router) — Seitenrouten registrieren, Components an URLs binden
- [Context](../ctx/index.md) — Vollständige Vorstellung der Fähigkeiten von useFlowContext
- [Styles & Themes](./styles-themes) — createStyles, Theme-Tokens usw.
- [FlowEngine](../flow-engine/index.md) — Bei visueller Konfiguration mit FlowModel arbeiten
- [Reaktivitätsmechanismus Observable](../../../flow-engine/observable) — Reaktive Zustandsverwaltung des FlowEngine
- [Context → Häufige Fähigkeiten](../ctx/common-capabilities) — eingebaute Fähigkeiten wie ctx.api, ctx.t
- [Component vs FlowModel](../component-vs-flow-model) — Component oder FlowModel wählen
