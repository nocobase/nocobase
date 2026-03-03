:::tip{title="Avviso di traduzione IA"}
Questo documento è stato tradotto dall'IA. Per informazioni accurate, consultare la [versione inglese](/runjs/context/off).
:::

# ctx.off()

Rimuove i listener di eventi registrati tramite `ctx.on(eventName, handler)`. Viene spesso utilizzato in combinazione con [ctx.on](./on.md) per annullare la sottoscrizione al momento opportuno, evitando perdite di memoria o attivazioni duplicate.

## Casi d'uso

| Scenario | Descrizione |
|------|------|
| **Pulizia di React useEffect** | Chiamato all'interno della funzione di cleanup di `useEffect` per rimuovere i listener quando il componente viene smontato. |
| **JSField / JSEditableField** | Annulla la sottoscrizione a `js-field:value-change` durante il data binding bidirezionale per i campi. |
| **Relativo alle risorse (resource)** | Annulla la sottoscrizione a listener come `refresh` o `saved` registrati tramite `ctx.resource.on`. |

## Definizione del tipo

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Esempi

### Utilizzo abbinato in React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Annullamento della sottoscrizione agli eventi delle risorse

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Al momento opportuno
ctx.resource?.off('refresh', handler);
```

## Note

1. **Riferimento dell'handler coerente**: L'handler passato a `ctx.off` deve essere lo stesso riferimento di quello utilizzato in `ctx.on`; in caso contrario, non potrà essere rimosso correttamente.
2. **Pulizia tempestiva**: Chiami `ctx.off` prima che il componente venga smontato o che il contesto venga distrutto per evitare perdite di memoria.

## Documenti correlati

- [ctx.on](./on.md) - Sottoscrizione agli eventi
- [ctx.resource](./resource.md) - Istanza della risorsa e i suoi metodi `on`/`off`