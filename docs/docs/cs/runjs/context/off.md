:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/off).
:::

# ctx.off()

Odstraní posluchače událostí registrované pomocí `ctx.on(eventName, handler)`. Často se používá ve spojení s [ctx.on](./on.md) k odhlášení odběru ve vhodný okamžik, čímž se zabrání únikům paměti nebo opakovanému spouštění.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **Úklid v React useEffect** | Volá se v rámci úklidové (cleanup) funkce `useEffect` k odstranění posluchačů při odpojení (unmount) komponenty. |
| **JSField / JSEditableField** | Zrušení odběru události `js-field:value-change` během obousměrné vazby dat polí. |
| **Související se zdroji (resource)** | Zrušení odběru posluchačů jako `refresh` nebo `saved` registrovaných přes `ctx.resource.on`. |

## Definice typu

```ts
off(eventName: string, handler: (event?: any) => void): void;
```

## Příklady

### Párové použití v React useEffect

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on('js-field:value-change', handler);
  return () => ctx.off('js-field:value-change', handler);
}, []);
```

### Zrušení odběru událostí zdroje

```ts
const handler = () => { /* ... */ };
ctx.resource?.on('refresh', handler);
// Ve vhodný okamžik
ctx.resource?.off('refresh', handler);
```

## Poznámky

1. **Konzistentní reference handleru**: `handler` předaný do `ctx.off` musí být stejná reference jako ta, která byla použita v `ctx.on`; jinak jej nebude možné správně odstranit.
2. **Včasný úklid**: Zavolejte `ctx.off` před odpojením komponenty nebo zničením kontextu (context), abyste předešli únikům paměti.

## Související dokumentace

- [ctx.on](./on.md) – Přihlášení k odběru událostí
- [ctx.resource](./resource.md) – Instance zdroje a její metody `on`/`off`