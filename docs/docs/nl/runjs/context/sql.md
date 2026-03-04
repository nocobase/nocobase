:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/runjs/context/sql) voor nauwkeurige informatie.
:::

# ctx.sql

`ctx.sql` biedt mogelijkheden voor het uitvoeren en beheren van SQL, veelal gebruikt in RunJS (zoals JSBlock en workflows) om direct toegang te krijgen tot de database. Het ondersteunt tijdelijke SQL-uitvoering, het uitvoeren van opgeslagen SQL-sjablonen op basis van ID, parameterbinding, sjabloonvariabelen (`{{ctx.xxx}}`) en controle over het resultaat-type.

## Toepassingsscenario's

| Scenario | Beschrijving |
|------|------|
| **JSBlock** | Aangepaste statistische rapporten, complexe gefilterde lijsten en aggregatie-query's over meerdere tabellen. |
| **Grafiekblok** | SQL-sjablonen opslaan om gegevensbronnen voor grafieken aan te sturen. |
| **Workflow / Koppeling** | Vooraf ingestelde SQL uitvoeren om gegevens op te halen voor vervolglogica. |
| **SQLResource** | Gebruikt in combinatie met `ctx.initResource('SQLResource')` voor scenario's zoals gepagineerde lijsten. |

> Let op: `ctx.sql` benadert de database via de `flowSql`-API. Zorg ervoor dat de huidige gebruiker over de juiste uitvoeringsrechten beschikt voor de betreffende gegevensbron.

## Rechten

| Recht | Methode | Beschrijving |
|------|------|------|
| **Ingelogde gebruiker** | `runById` | Uitvoeren op basis van een geconfigureerd SQL-sjabloon-ID. |
| **SQL-configuratierechten** | `run`, `save`, `destroy` | Tijdelijke SQL uitvoeren, of SQL-sjablonen opslaan/bijwerken/verwijderen. |

Frontend-logica bedoeld voor gewone gebruikers moet `ctx.sql.runById(uid, options)` gebruiken. Wanneer dynamische SQL of sjabloonbeheer vereist is, moet u ervoor zorgen dat de huidige rol beschikt over SQL-configuratierechten.

## Type-definitie

```ts
sql: FlowSQLRepository;

interface FlowSQLRepository {
  run<T = any>(
    sql: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  save(options: { uid: string; sql: string; dataSourceKey?: string }): Promise<void>;

  runById<T = any>(
    uid: string,
    options?: {
      bind?: Record<string, any> | any[];
      type?: 'selectRows' | 'selectRow' | 'selectVar';
      dataSourceKey?: string;
      filter?: Record<string, any>;
    },
  ): Promise<T>;

  destroy(uid: string): Promise<void>;
}
```

## Veelgebruikte methoden

| Methode | Beschrijving | Vereiste rechten |
|------|------|----------|
| `ctx.sql.run(sql, options?)` | Voert tijdelijke SQL uit; ondersteunt parameterbinding en sjabloonvariabelen. | SQL-configuratierechten |
| `ctx.sql.save({ uid, sql, dataSourceKey? })` | Slaat een SQL-sjabloon op of werkt deze bij op basis van ID voor hergebruik. | SQL-configuratierechten |
| `ctx.sql.runById(uid, options?)` | Voert een eerder opgeslagen SQL-sjabloon uit op basis van het ID. | Elke ingelogde gebruiker |
| `ctx.sql.destroy(uid)` | Verwijdert een specifiek SQL-sjabloon op basis van ID. | SQL-configuratierechten |

Let op:

- `run` wordt gebruikt voor het debuggen van SQL en vereist configuratierechten.
- `save` en `destroy` worden gebruikt voor het beheren van SQL-sjablonen en vereisen configuratierechten.
- `runById` is toegankelijk voor gewone gebruikers; het kan alleen opgeslagen sjablonen uitvoeren en kan de SQL niet debuggen of wijzigen.
- Wanneer een SQL-sjabloon wordt gewijzigd, moet `save` worden aangeroepen om de wijzigingen op te slaan.

## Parameters

### options voor run / runById

| Parameter | Type | Beschrijving |
|------|------|------|
| `bind` | `Record<string, any>` \| `any[]` | Binding-variabelen. Gebruik een object voor `:name` placeholders of een array voor `?` placeholders. |
| `type` | `'selectRows'` \| `'selectRow'` \| `'selectVar'` | Resultaat-type: meerdere rijen, enkele rij of enkele waarde. Standaard ingesteld op `selectRows`. |
| `dataSourceKey` | `string` | Gegevensbron-identificatie. Standaard wordt de hoofdgegevensbron gebruikt. |
| `filter` | `Record<string, any>` | Extra filtervoorwaarden (afhankelijk van interface-ondersteuning). |

### options for save

| Parameter | Type | Beschrijving |
|------|------|------|
| `uid` | `string` | Unieke identificatie voor het sjabloon. Na opslaan kan het worden uitgevoerd via `runById(uid, ...)`. |
| `sql` | `string` | SQL-inhoud. Ondersteunt `{{ctx.xxx}}` sjabloonvariabelen en `:name` / `?` placeholders. |
| `dataSourceKey` | `string` | Optioneel. Gegevensbron-identificatie. |

## SQL-sjabloonvariabelen en parameterbinding

### Sjabloonvariabelen `{{ctx.xxx}}`

U kunt `{{ctx.xxx}}` in SQL gebruiken om naar contextvariabelen te verwijzen. Deze worden vóór uitvoering omgezet naar de werkelijke waarden:

```js
// Verwijs naar ctx.user.id
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = {{ctx.user.id}}',
  { type: 'selectRow' }
);
```

De bronnen voor verwijsbare variabelen zijn hetzelfde als bij `ctx.getVar()` (bijv. `ctx.user.*`, `ctx.record.*`, aangepaste `ctx.defineProperty`, etc.).

### Parameterbinding

- **Benoemde parameters**: Gebruik `:name` in SQL en geef een object `{ name: value }` door in `bind`.
- **Positionele parameters**: Gebruik `?` in SQL en geef een array `[value1, value2]` door in `bind`.

```js
// Benoemde parameters
const users = await ctx.sql.run(
  'SELECT * FROM users WHERE status = :status AND age > :minAge',
  { bind: { status: 'active', minAge: 18 }, type: 'selectRows' }
);

// Positionele parameters
const count = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users WHERE city = ? AND status = ?',
  { bind: ['London', 'active'], type: 'selectVar' }
);
```

## Voorbeelden

### Tijdelijke SQL uitvoeren (vereist SQL-configuratierechten)

```js
// Meerdere rijen (standaard)
const rows = await ctx.sql.run('SELECT * FROM users LIMIT 10');

// Enkele rij
const user = await ctx.sql.run(
  'SELECT * FROM users WHERE id = :id',
  { bind: { id: 1 }, type: 'selectRow' }
);

// Enkele waarde (bijv. COUNT, SUM)
const total = await ctx.sql.run(
  'SELECT COUNT(*) AS total FROM users',
  { type: 'selectVar' }
);
```

### Sjabloonvariabelen gebruiken

```js
ctx.defineProperty('minId', { get: () => 1 });

const rows = await ctx.sql.run(
  'SELECT * FROM users WHERE id > {{ctx.minId}}',
  { type: 'selectRows' }
);
```

### Sjablonen opslaan en hergebruiken

```js
// Opslaan (vereist SQL-configuratierechten)
await ctx.sql.save({
  uid: 'active-users-report',
  sql: 'SELECT * FROM users WHERE status = :status ORDER BY created_at DESC',
});

// Elke ingelogde gebruiker kan dit uitvoeren
const users = await ctx.sql.runById('active-users-report', {
  bind: { status: 'active' },
  type: 'selectRows',
});

// Sjabloon verwijderen (vereist SQL-configuratierechten)
await ctx.sql.destroy('active-users-report');
```

### Gepagineerde lijst (SQLResource)

```js
// Gebruik SQLResource wanneer paginering of filtering nodig is
ctx.initResource('SQLResource');
ctx.resource.setFilterByTk('saved-sql-uid');  // ID van het opgeslagen SQL-sjabloon
ctx.resource.setBind({ status: 'active' });
await ctx.resource.refresh();
const data = ctx.resource.getData();
const meta = ctx.resource.getMeta();  // Bevat page, pageSize, etc.
```

## Relatie met ctx.resource en ctx.request

| Doel | Aanbevolen gebruik |
|------|----------|
| **SQL-query uitvoeren** | `ctx.sql.run()` of `ctx.sql.runById()` |
| **Gepagineerde SQL-lijst (Blok)** | `ctx.initResource('SQLResource')` + `ctx.resource.refresh()` |
| **Algemeen HTTP-verzoek** | `ctx.request()` |

`ctx.sql` omvat de `flowSql`-API en is gespecialiseerd voor SQL-scenario's; `ctx.request` kan worden gebruikt om elke API aan te roepen.

## Aandachtspunten

- Gebruik parameterbinding (`:name` / `?`) in plaats van tekenreeks-samenvoeging (string concatenation) om SQL-injectie te voorkomen.
- `type: 'selectVar'` retourneert een scalaire waarde, meestal gebruikt voor `COUNT`, `SUM`, etc.
- Sjabloonvariabelen `{{ctx.xxx}}` worden vóór uitvoering opgelost; zorg ervoor dat de overeenkomstige variabelen in de context zijn gedefinieerd.

## Gerelateerd

- [ctx.resource](./resource.md): Gegevensbronnen; SQLResource roept intern de `flowSql`-API aan.
- [ctx.initResource()](./init-resource.md): Initialiseert SQLResource voor gepagineerde lijsten, etc.
- [ctx.request()](./request.md): Algemene HTTP-verzoeken.