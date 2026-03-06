:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/runjs/context/on).
:::

# ctx.on()

Slouží k přihlášení k odběru událostí kontextu v RunJS (jako jsou změny hodnot polí, změny vlastností, obnovení zdrojů atd.). Události jsou na základě svého typu mapovány na vlastní události DOM na `ctx.element` nebo na interní sběrnici událostí `ctx.resource`.

## Scénáře použití

| Scénář | Popis |
|------|------|
| **JSField / JSEditableField** | Sledování změn hodnot polí z externích zdrojů (formuláře, propojení atd.) pro synchronní aktualizaci UI, čímž se dosáhne obousměrné vazby. |
| **JSBlock / JSItem / JSColumn** | Sledování vlastních událostí na kontejneru pro reakci na změny dat nebo stavu. |
| **Související s resource** | Sledování událostí životního cyklu zdroje (resource), jako je obnovení nebo uložení, pro spuštění logiky po aktualizaci dat. |

## Definice typu

```ts
on(eventName: string, handler: (event?: any) => void): void;
```

## Běžné události

| Název události | Popis | Zdroj události |
|--------|------|----------|
| `js-field:value-change` | Hodnota pole byla změněna externě (např. propojení formulářů, aktualizace výchozí hodnoty) | CustomEvent na `ctx.element`, kde `ev.detail` je nová hodnota |
| `resource:refresh` | Data zdroje byla obnovena | Sběrnice událostí `ctx.resource` |
| `resource:saved` | Ukládání zdroje bylo dokončeno | Sběrnice událostí `ctx.resource` |

> Pravidla mapování událostí: Události s předponou `resource:` procházejí přes `ctx.resource.on`, zatímco ostatní obvykle procházejí přes události DOM na `ctx.element` (pokud existuje).

## Příklady

### Obousměrná vazba pole (React useEffect + vyčištění)

```tsx
React.useEffect(() => {
  const handler = (ev) => setValue(ev?.detail ?? '');
  ctx.on?.('js-field:value-change', handler);
  return () => {
    ctx.off?.('js-field:value-change', handler);
  };
}, []);
```

### Nativní sledování DOM (alternativa, když není ctx.on k dispozici)

```ts
// Pokud ctx.on není k dispozici, můžete použít přímo ctx.element
const handler = (ev) => {
  if (selectEl) selectEl.value = String(ev?.detail ?? '');
};
ctx.element?.addEventListener('js-field:value-change', handler);
// Při čištění: ctx.element?.removeEventListener('js-field:value-change', handler);
```

### Aktualizace UI po obnovení zdroje

```ts
ctx.resource?.on('refresh', () => {
  const data = ctx.resource?.getData?.();
  // Aktualizace vykreslování na základě dat
});
```

## Spolupráce s ctx.off

- Posluchače registrované pomocí `ctx.on` by měly být ve vhodnou chvíli odstraněny pomocí [ctx.off](./off.md), aby se zabránilo únikům paměti nebo duplicitnímu spouštění.
- V Reactu se `ctx.off` obvykle volá v rámci čistící (cleanup) funkce `useEffect`.
- `ctx.off` nemusí existovat; při použití se doporučuje použít volitelné řetězení (optional chaining): `ctx.off?.('eventName', handler)`.

## Poznamky

1. **Párové zrušení**: Každý `ctx.on(eventName, handler)` by měl mít odpovídající `ctx.off(eventName, handler)` a předaná reference na `handler` musí být identická.
2. **Životní cyklus**: Odstraňte posluchače před odpojením komponenty nebo zničením kontextu, abyste předešli únikům paměti.
3. **Dostupnost událostí**: Různé typy kontextů podporují různé události, podrobnosti naleznete v dokumentaci konkrétních komponent.

## Související dokumentace

- [ctx.off](./off.md) – Odstranění posluchačů událostí
- [ctx.element](./element.md) – Vykreslovací kontejner a události DOM
- [ctx.resource](./resource.md) – Instance zdroje a její metody `on`/`off`
- [ctx.setValue](./set-value.md) – Nastavení hodnoty pole (spouští `js-field:value-change`)