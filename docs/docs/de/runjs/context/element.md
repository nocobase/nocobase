:::tip{title="KI-Übersetzungshinweis"}
Dieses Dokument wurde von KI übersetzt. Für genaue Informationen lesen Sie bitte die [englische Version](/runjs/context/element).
:::

# ctx.element

Eine `ElementProxy`-Instanz, die auf den Sandbox-DOM-Container verweist und als Standard-Rendering-Ziel für `ctx.render()` dient. Sie ist in Szenarien verfügbar, in denen ein Rendering-Container existiert, wie z. B. `JSBlock`, `JSField`, `JSItem` und `JSColumn`.

## Anwendungsbereiche

| Szenario | Beschreibung |
|------|------|
| **JSBlock** | Der DOM-Container des Blocks, der zum Rendern benutzerdefinierter Block-Inhalte verwendet wird. |
| **JSField / JSItem / FormJSFieldItem** | Der Rendering-Container für ein Feld oder ein Formularelement (normalerweise ein `<span>`). |
| **JSColumn** | Der DOM-Container für eine Tabellenzelle, der zum Rendern benutzerdefinierter Spalteninhalte verwendet wird. |

> Hinweis: `ctx.element` ist nur in RunJS-Kontexten verfügbar, die über einen Rendering-Container verfügen. In Szenarien ohne UI-Kontext (wie z. B. reine Backend-Logik) kann dieser Wert `undefined` sein. Es wird empfohlen, vor der Verwendung eine Prüfung auf Nullwerte durchzuführen.

## Typdefinition

```typescript
element: ElementProxy | undefined;

// ElementProxy ist ein Proxy für das rohe HTMLElement und stellt eine sichere API bereit
class ElementProxy {
  __el: HTMLElement;  // Das interne native DOM-Element (nur in speziellen Szenarien zugänglich)
  innerHTML: string;  // Wird beim Lesen/Schreiben durch DOMPurify bereinigt
  outerHTML: string; // Wie oben
  appendChild(child: HTMLElement | string): void;
  // Andere HTMLElement-Methoden werden durchgereicht (direkte Verwendung nicht empfohlen)
}
```

## Sicherheitsanforderungen

**Empfohlen: Alle Rendering-Vorgänge sollten über `ctx.render()` erfolgen.** Vermeiden Sie die direkte Verwendung der DOM-APIs von `ctx.element` (z. B. `innerHTML`, `appendChild`, `querySelector` usw.).

### Warum ctx.render() empfohlen wird

| Vorteil | Beschreibung |
|------|------|
| **Sicherheit** | Zentrale Sicherheitskontrolle zur Vermeidung von XSS und unsachgemäßen DOM-Operationen. |
| **React-Unterstützung** | Vollständige Unterstützung für JSX, React-Komponenten und Lebenszyklen. |
| **Kontext-Vererbung** | Erbt automatisch den `ConfigProvider`, Themes usw. der Anwendung. |
| **Konfliktbehandlung** | Automatische Verwaltung der Erstellung und Aufhebung von React-Roots, um Konflikte zwischen mehreren Instanzen zu vermeiden. |

### ❌ Nicht empfohlen: Direkte Manipulation von ctx.element

```ts
// ❌ Nicht empfohlen: Direkte Verwendung der APIs von ctx.element
ctx.element.innerHTML = '<div>Inhalt</div>';
ctx.element.appendChild(node);
ctx.element.querySelector('.class');
```

> `ctx.element.innerHTML` ist veraltet. Bitte verwenden Sie stattdessen `ctx.render()`.

### ✅ Empfohlen: Verwendung von ctx.render()

```ts
// ✅ Rendern einer React-Komponente
const { Button, Card } = ctx.libs.antd;
ctx.render(
  <Card title={ctx.t('Willkommen')}>
    <Button type="primary">Klicken</Button>
  </Card>
);

// ✅ Rendern eines HTML-Strings
ctx.render('<div style="padding:16px;">' + ctx.t('Inhalt') + '</div>');

// ✅ Rendern eines DOM-Knotens
const div = document.createElement('div');
div.textContent = ctx.t('Hallo');
ctx.render(div);
```

## Sonderfall: Als Popover-Anker

Wenn Sie ein Popover öffnen müssen, das das aktuelle Element als Anker verwendet, können Sie auf `ctx.element?.__el` zugreifen, um das native DOM als `target` zu erhalten:

```ts
// ctx.viewer.popover benötigt ein natives DOM als Ziel (target)
await ctx.viewer.popover({
  target: ctx.element?.__el,
  content: <div>Popup-Inhalt</div>,
});
```

> Verwenden Sie `__el` nur in solchen Szenarien, in denen der aktuelle Container als Anker dient; manipulieren Sie das DOM in anderen Fällen nicht direkt.

## Beziehung zu ctx.render

- Wenn `ctx.render(vnode)` ohne das Argument `container` aufgerufen wird, erfolgt das Rendering standardmäßig in den Container `ctx.element`.
- Wenn sowohl `ctx.element` fehlt als auch kein `container` übergeben wurde, wird ein Fehler ausgelöst.
- Sie können explizit einen Container angeben: `ctx.render(vnode, customContainer)`.

## Hinweise

- `ctx.element` ist für die interne Verwendung durch `ctx.render()` vorgesehen. Der direkte Zugriff auf oder die Änderung seiner Eigenschaften/Methoden wird nicht empfohlen.
- In Kontexten ohne Rendering-Container ist `ctx.element` gleich `undefined`. Stellen Sie sicher, dass der Container verfügbar ist, oder übergeben Sie manuell einen `container`, bevor Sie `ctx.render()` aufrufen.
- Obwohl `innerHTML`/`outerHTML` in `ElementProxy` über DOMPurify bereinigt werden, wird dennoch empfohlen, `ctx.render()` für eine einheitliche Rendering-Verwaltung zu verwenden.

## Verwandte Themen

- [ctx.render](./render.md): Inhalte in einen Container rendern
- [ctx.view](./view.md): Aktueller View-Controller
- [ctx.modal](./modal.md): Shortcut-API für Modalfenster