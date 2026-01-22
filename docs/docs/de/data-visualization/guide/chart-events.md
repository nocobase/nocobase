:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

# Benutzerdefinierte Interaktionsereignisse

Schreiben Sie JavaScript im Ereignis-Editor und registrieren Sie Interaktionen über die ECharts-Instanz `chart`, um Verknüpfungen zu ermöglichen. Dazu gehören beispielsweise das Navigieren zu einer neuen Seite oder das Öffnen eines Drill-down-Dialogs.

![clipboard-image-1761489617](https://static-docs.nocobase.com/clipboard-image-1761489617.png)

## Ereignisse registrieren und deregistrieren
- Registrieren: `chart.on(eventName, handler)`
- Deregistrieren: `chart.off(eventName, handler)` oder `chart.off(eventName)`, um Ereignisse desselben Namens zu löschen.

**Hinweis:**
Aus Sicherheitsgründen wird dringend empfohlen, ein Ereignis vor der erneuten Registrierung zu deregistrieren!

## Datenstruktur der `params`-Parameter im Handler

![20251026222859](https://static-docs.nocobase.com/20251026222859.png)

Häufig verwendete Felder sind `params.data` und `params.name`.

## Beispiel: Klick zum Hervorheben einer Auswahl
```js
chart.off('click');
chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // Aktuellen Datenpunkt hervorheben
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // Andere Hervorhebungen aufheben
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

## Beispiel: Klick zum Navigieren
```js
chart.off('click');
chart.on('click', (params) => {
  const order_date = params.data[0]
  
  // Option 1: Interne Navigation ohne vollständiges Neuladen der Seite (empfohlen), nur relativer Pfad erforderlich
  ctx.router.navigate(`/new-path/orders?order_date=${order_date}`)

  // Option 2: Navigation zu externer Seite, vollständige URL erforderlich
  window.location.href = `https://www.host.com/new-path/orders?order_date=${order_date}`

  // Option 3: Externe Seite in neuem Tab öffnen, vollständige URL erforderlich
  window.open(`https://www.host.com/new-path/orders?order_date=${order_date}`)
});
```

## Beispiel: Klick zum Öffnen eines Detail-Dialogs (Drill-down)
```js
chart.off('click');
chart.on('click', (params) => {
  ctx.openView(ctx.model.uid + '-1', {
    mode: 'dialog',
    size: 'large',
    defineProperties: {}, // Kontextvariablen für den neuen Dialog registrieren
  });
});
```

![clipboard-image-1761490321](https://static-docs.nocobase.com/clipboard-image-1761490321.png)

Im neu geöffneten Dialog verwenden Sie die im Diagramm deklarierten Kontextvariablen über `ctx.view.inputArgs.XXX`.

## Vorschau und Speichern
- Klicken Sie auf „Vorschau“, um den Ereigniscode zu laden und auszuführen.
- Klicken Sie auf „Speichern“, um die aktuelle Ereigniskonfiguration zu speichern.
- Klicken Sie auf „Abbrechen“, um zum zuletzt gespeicherten Zustand zurückzukehren.

**Empfehlungen:**
- Verwenden Sie immer `chart.off('event')` vor dem Binden, um doppelte Ausführungen oder erhöhten Speicherverbrauch zu vermeiden.
- Verwenden Sie in Ereignis-Handlern möglichst leichte Operationen (z. B. `dispatchAction`, `setOption`), um das Blockieren des Rendering-Prozesses zu vermeiden.
- Validieren Sie die Ereignisbehandlung anhand der Diagrammoptionen und Datenabfragen, um sicherzustellen, dass die verwendeten Felder mit den aktuellen Daten übereinstimmen.