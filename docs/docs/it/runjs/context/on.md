:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/on).
:::

# ctx.on()

Sottoscriva gli eventi del contesto (come modifiche ai valori dei campi, cambiamenti di proprietà, aggiornamenti delle risorse, ecc.) in RunJS. Gli eventi vengono mappati su eventi DOM personalizzati su `ctx.element` o sul bus di eventi interno di `ctx.resource` in base al loro tipo.

## Scenari di utilizzo

| Scenario | Descrizione |
|------|------|
| **JSField / JSEditableField** | Ascolti le modifiche del valore del campo da fonti esterne (moduli, collegamenti, ecc.) per aggiornare l'interfaccia utente in modo sincrono, realizzando il data binding bidirezionale. |
| **JSBlock / JSItem / JSColumn** | Ascolti eventi personalizzati sul contenitore per rispondere a cambiamenti di dati o di stato. |
| **Relativi a resource** | Ascolti gli eventi del ciclo di vita della risorsa, come l'aggiornamento o il salvataggio, per eseguire logica dopo l'aggiornamento dei dati. |

## Definizione del tipo

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Eventi comuni

| Nome evento | Descrizione | Origine evento |
|--------|------|----------|
| `js-field:value-change` | Valore del campo modificato esternamente (es. collegamento del modulo, aggiornamento del valore predefinito) | CustomEvent su `ctx.element`, dove `ev.detail` è il nuovo valore |
| `resource:refresh` | I dati della risorsa sono stati aggiornati | Bus di eventi `ctx.resource` |
| `resource:saved` | Salvataggio della risorsa completato | Bus di eventi `ctx.resource` |

> Regole di mappatura degli eventi: gli eventi con prefisso `resource:` passano attraverso `ctx.resource.on`, mentre gli altri solitamente passano attraverso gli eventi DOM su `ctx.element` (se esistente).

## Esempi

### Data binding bidirezionale del campo (React useEffect + Cleanup)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Ascolto DOM nativo (alternativa quando ctx.on non è disponibile)

```ts
// Quando ctx.on non è fornito, è possibile utilizzare direttamente ctx.element
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Durante il cleanup: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Aggiornamento dell'interfaccia utente dopo l'aggiornamento della risorsa

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Aggiorna il rendering in base ai dati
});
```

## Coordinazione con ctx.off

- I listener registrati tramite `ctx.on` devono essere rimossi al momento opportuno tramite [ctx.off](./off.md) per evitare perdite di memoria o attivazioni duplicate.
- In React, `ctx.off` viene solitamente chiamato all'interno della funzione di cleanup di `useEffect`.
- `ctx.off` potrebbe non esistere; si consiglia di utilizzare l'optional chaining: `ctx.off?.('eventName', handler)`.

## Note

1. **Cancellazione accoppiata**: ogni `ctx.on(eventName, handler)` deve avere un corrispondente `ctx.off(eventName, handler)`, e il riferimento all' `handler` passato deve essere identico.
2. **Ciclo di vita**: rimuova i listener prima che il componente venga smontato o che il contesto venga distrutto per prevenire perdite di memoria.
3. **Disponibilità degli eventi**: diversi tipi di contesto supportano eventi diversi. Consulti la documentazione specifica dei singoli componenti per i dettagli.

## Documentazione correlata

- [ctx.off](./off.md) - Rimuovere i listener di eventi
- [ctx.element](./element.md) - Contenitore di rendering ed eventi DOM
- [ctx.resource](./resource.md) - Istanza della risorsa e i suoi metodi `on`/`off`
- [ctx.setValue](./set-value.md) - Impostare il valore del campo (attiva `js-field:value-change`)