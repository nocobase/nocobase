:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Middleware

De middleware van de NocoBase Server is in essentie **Koa middleware**. U kunt het `ctx`-object manipuleren om verzoeken en antwoorden af te handelen, net als in Koa. Echter, aangezien NocoBase logica op verschillende bedrijfslagen moet beheren, wordt het erg moeilijk te onderhouden en te beheren als alle middleware bij elkaar wordt geplaatst. Daarom verdeelt NocoBase middleware in **vier lagen**:

1.  **Gegevensbron-niveau middleware**: `app.dataSourceManager.use()`  
    Heeft alleen invloed op verzoeken voor **een specifieke gegevensbron**, vaak gebruikt voor databankverbindingen, veldvalidatie of transactieverwerkingslogica voor die gegevensbron.

2.  **Resource-niveau middleware**: `app.resourceManager.use()`  
    Alleen effectief voor gedefinieerde resources, geschikt voor het afhandelen van resource-niveau logica, zoals datarechten, opmaak, enz.

3.  **Rechten-niveau middleware**: `app.acl.use()`  
    Wordt uitgevoerd vóór rechtencontroles en gebruikt om gebruikersrechten of rollen te verifiëren.

4.  **Applicatie-niveau middleware**: `app.use()`  
    Wordt uitgevoerd voor elk verzoek, geschikt voor logging, algemene foutafhandeling, verwerking van antwoorden, enz.

## Middleware Registratie

Middleware wordt doorgaans geregistreerd in de `load`-methode van de plugin, bijvoorbeeld:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Applicatie-niveau middleware
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Gegevensbron middleware
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Rechten middleware
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Resource middleware
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Uitvoeringsvolgorde

De uitvoeringsvolgorde van middleware is als volgt:

1.  Eerst wordt de rechten middleware uitgevoerd die is toegevoegd met `acl.use()`.
2.  Daarna wordt de resource middleware uitgevoerd die is toegevoegd met `resourceManager.use()`.
3.  Vervolgens wordt de gegevensbron middleware uitgevoerd die is toegevoegd met `dataSourceManager.use()`.
4.  Tot slot wordt de applicatie middleware uitgevoerd die is toegevoegd met `app.use()`.

## before / after / tag Invoegmechanisme

Voor een flexibelere controle over de middleware-volgorde biedt NocoBase de parameters `before`, `after` en `tag`:

-   **tag**: Geef de middleware een label, zodat deze kan worden gerefereerd door volgende middleware.
-   **before**: Voeg in vóór de middleware met de opgegeven tag.
-   **after**: Voeg in ná de middleware met de opgegeven tag.

Voorbeeld:

```ts
// Standaard middleware
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 wordt vóór m1 geplaatst
app.use(m4, { before: 'restApi' });

// m5 wordt tussen m2 en m3 ingevoegd
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Als er geen positie is opgegeven, is de standaard uitvoeringsvolgorde voor nieuw toegevoegde middleware:  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## Voorbeeld van het Uienringmodel

De uitvoeringsvolgorde van middleware volgt Koa's **uienringmodel**, wat betekent dat het eerst de middleware-stack binnengaat en als laatste weer verlaat.

```ts
app.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(1);
  await next();
  ctx.body.push(2);
});

app.resourceManager.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(3);
  await next();
  ctx.body.push(4);
});

app.acl.use(async (ctx, next) => {
  ctx.body = ctx.body || [];
  ctx.body.push(5);
  await next();
  ctx.body.push(6);
});

app.resourceManager.define({
  name: 'test',
  actions: {
    async list(ctx, next) {
      ctx.body = ctx.body || [];
      ctx.body.push(7);
      await next();
      ctx.body.push(8);
    },
  },
});
```

Voorbeelden van uitvoervolgorde bij verschillende interfaces:

-   **Standaard verzoek**: `/api/hello`  
    Uitvoer: `[1,2]` (resource niet gedefinieerd, voert `resourceManager` en `acl` middleware niet uit)  

-   **Resource verzoek**: `/api/test:list`  
    Uitvoer: `[5,3,7,1,2,8,4,6]`  
    Middleware wordt uitgevoerd volgens de lagenvolgorde en het uienringmodel.

## Samenvatting

-   NocoBase Middleware is een uitbreiding van Koa Middleware.
-   Vier lagen: Applicatie -> Gegevensbron -> Resource -> Rechten.
-   U kunt `before` / `after` / `tag` gebruiken om de uitvoeringsvolgorde flexibel te beheren.
-   Volgt het Koa uienringmodel, wat zorgt voor combineerbare en nestbare middleware.
-   Gegevensbron-niveau middleware heeft alleen invloed op gespecificeerde gegevensbronverzoeken, resource-niveau middleware heeft alleen invloed op gedefinieerde resourceverzoeken.