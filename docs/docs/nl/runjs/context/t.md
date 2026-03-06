:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/t) voor nauwkeurige informatie.
:::

# ctx.t()

Een i18n-snelkoppelingsfunctie in RunJS voor het vertalen van teksten op basis van de taalinstellingen van de huidige context. Het is geschikt voor de internationalisering van inline teksten zoals knoppen, titels en meldingen.

## Toepassingen

`ctx.t()` kan in alle RunJS-uitvoeringsomgevingen worden gebruikt.

## Type-definitie

```ts
t(key: string, options?: Record<string, any>): string
```

## Parameters

| Parameter | Type | Beschrijving |
|-----------|------|-------------|
| `key` | `string` | Vertaalsleutel of sjabloon met tijdelijke aanduidingen (bijv. `Hallo {{name}}`, `{{count}} rijen`). |
| `options` | `object` | Optioneel. Interpolatievariabelen (bijv. `{ name: 'Jan', count: 5 }`), of i18n-opties (bijv. `defaultValue`, `ns`). |

## Retourwaarde

- Retourneert de vertaalde string. Als er geen vertaling bestaat voor de sleutel en er geen `defaultValue` is opgegeven, kan de sleutel zelf of de geïnterpoleerde string worden geretourneerd.

## Namespace (ns)

De **standaard namespace voor de RunJS-omgeving is `runjs`**. Wanneer `ns` niet is gespecificeerd, zoekt `ctx.t(key)` de sleutel op in de `runjs` namespace.

```ts
// Zoekt standaard de sleutel op in de 'runjs' namespace
ctx.t('Submit'); // Gelijk aan ctx.t('Submit', { ns: 'runjs' })

// Zoekt de sleutel op in een specifieke namespace
ctx.t('Submit', { ns: 'myModule' });

// Zoekt opeenvolgend in meerdere namespaces (eerst 'runjs', daarna 'common')
ctx.t('Save', { ns: ['runjs', 'common'] });
```

## Voorbeelden

### Eenvoudige sleutel

```ts
ctx.t('Submit');
ctx.t('No data');
```

### Met interpolatievariabelen

```ts
const text = ctx.t('Hallo {{name}}', { name: ctx.user?.nickname || 'Gast' });
ctx.render(`<div>${text}</div>`);
```

```ts
ctx.message.success(ctx.t('{{count}} rijen verwerkt', { count: rows.length }));
```

### Dynamische tekst (bijv. relatieve tijd)

```ts
if (minutes < 60) return ctx.t('{{count}} minuten geleden', { count: minutes });
if (hours < 24) return ctx.t('{{count}} uur geleden', { count: hours });
```

### Een namespace specificeren

```ts
ctx.t('Hallo {{name}}', { name: 'Gast', ns: 'myModule' });
```

## Opmerkingen

- **Lokalisatie-plugin**: Om tekst te vertalen, moet de lokalisatie-plugin geactiveerd zijn. Ontbrekende vertaalsleutels worden automatisch geëxtraheerd naar de lokalisatiebeheerlijst voor centraal onderhoud en vertaling.
- Ondersteunt interpolatie in i18next-stijl: Gebruik `{{variabeleNaam}}` in de sleutel en geef de bijbehorende variabele door in `options` om deze te vervangen.
- De taal wordt bepaald door de huidige context (bijv. `ctx.i18n.language`, gebruikersinstellingen).

## Gerelateerd

- [ctx.i18n](./i18n.md): Taal lezen of wijzigen