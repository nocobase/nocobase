:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/runjs/context/t).
:::

# ctx.t()

En i18n-genvägsfunktion som används i RunJS för att översätta text baserat på den aktuella kontextens språkinställningar. Den är lämplig för internationalisering av text i gränssnittet, såsom knappar, titlar och meddelanden.

## Användningsområden

`ctx.t()` kan användas i alla RunJS-exekveringsmiljöer.

## Typdefinition

```ts
t(key: string, options?: Record<string, any>): string
```

## Parametrar

| Parameter | Typ | Beskrivning |
|-----------|------|-------------|
| `key` | `string` | Översättningsnyckel eller mall med platshållare (t.ex. `Hello {{name}}`, `{{count}} rows`). |
| `options` | `object` | Valfritt. Interpolationsvariabler (t.ex. `{ name: 'Johan', count: 5 }`), eller i18n-alternativ (t.ex. `defaultValue`, `ns`). |

## Returvärde

- Returnerar den översatta strängen. Om ingen översättning finns för nyckeln och inget `defaultValue` har angetts, kan den returnera själva nyckeln eller den interpolerade strängen.

## Namnrymd (ns)

**Standardnamnrymden för RunJS-miljön är `runjs`**. När `ns` inte anges kommer `ctx.t(key)` att söka efter nyckeln i namnrymden `runjs`.

```ts
// Söker som standard efter nyckeln i namnrymden 'runjs'
ctx.t('Submit'); // Motsvarar ctx.t('Submit', { ns: 'runjs' })

// Söker efter nyckeln i en specifik namnrymd
ctx.t('Submit', { ns: 'myModule' });

// Söker i flera namnrymder sekventiellt (först 'runjs', sedan 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Exempel

### Enkel nyckel

```ts
ctx.t('Submit');
ctx.t('No data');
```

### Med interpolationsvariabler

```ts
const text = ctx.t('Hello {{name}}', { name: ctx.user?.nickname || 'Guest' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('Processed {{count}} rows', { count: rows.length }));
```

### Dynamisk text (t.ex. relativ tid)

```ts
if (minutes < 60) return ctx.t('{{count}} minutes ago', { count: minutes });
if (hours < 24) return ctx.t('{{count}} hours ago', { count: hours });
```

### Ange en namnrymd

```ts
ctx.t('Hello {{name}}', { name: 'Guest', ns: 'myModule' });
```

## Observera

- **Plugin för lokalisering**: För att översätta text måste ni först aktivera pluginet för lokalisering. Saknade översättningsnycklar extraheras automatiskt till hanteringslistan för lokalisering för enhetligt underhåll och översättning.
- Stöder interpolation i i18next-stil: Använd `{{variabelnamn}}` i nyckeln och skicka med motsvarande variabel i `options` för att ersätta den.
- Språket bestäms av den aktuella kontexten (t.ex. `ctx.i18n.language`, användarens språkinställning).

## Relaterat

- [ctx.i18n](./i18n.md): Läsa eller byta språk