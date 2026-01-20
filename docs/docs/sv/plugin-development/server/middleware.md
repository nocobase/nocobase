:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Middleware

NocoBase Servers middleware är i grunden **Koa middleware**. Ni kan hantera förfrågningar och svar genom att manipulera `ctx`-objektet, precis som i Koa. Men eftersom NocoBase behöver hantera logik på olika affärsnivåer, blir det mycket svårt att underhålla och hantera om all middleware placeras tillsammans.

Därför delar NocoBase in middleware i **fyra nivåer**:

1.  **Middleware på datakällnivå**: `app.dataSourceManager.use()`  
    Påverkar endast förfrågningar för en **specifik datakälla**, används ofta för logik som databasanslutningar, fältvalidering eller transaktionshantering för den datakällan.

2.  **Middleware på resursnivå**: `app.resourceManager.use()`  
    Gäller endast för definierade resurser, lämplig för att hantera resursnivålogik, såsom databehörigheter, formatering, etc.

3.  **Middleware på behörighetsnivå**: `app.acl.use()`  
    Körs före behörighetskontroller, används för att verifiera användarbehörigheter eller roller.

4.  **Middleware på applikationsnivå**: `app.use()`  
    Körs för varje förfrågan, lämplig för loggning, allmän felhantering, svarshantering, etc.

## Registrering av middleware

Middleware registreras vanligtvis i pluginens `load`-metod, till exempel:

```ts
export class MyPlugin extends Plugin {
  load() {
    // Middleware på applikationsnivå
    this.app.use(async (ctx, next) => {
      console.log('App middleware');
      await next();
    });

    // Middleware för datakälla
    this.app.dataSourceManager.use(async (ctx, next) => {
      console.log('DataSource middleware');
      await next();
    });

    // Middleware för behörighet
    this.app.acl.use(async (ctx, next) => {
      console.log('ACL middleware');
      await next();
    });

    // Middleware för resurs
    this.app.resourceManager.use(async (ctx, next) => {
      console.log('Resource middleware');
      await next();
    });

  }
}
```

### Exekveringsordning

Middleware körs i följande ordning:

1.  Först körs behörighets-middleware som lagts till med `acl.use()`
2.  Därefter körs resurs-middleware som lagts till med `resourceManager.use()`  
3.  Sedan körs datakälla-middleware som lagts till med `dataSourceManager.use()`  
4.  Slutligen körs applikations-middleware som lagts till med `app.use()`  

## before / after / tag Infogningsmekanism

För att få mer flexibel kontroll över middleware-ordningen erbjuder NocoBase parametrarna `before`, `after` och `tag`:

-   **tag**: Ger middleware en etikett som kan refereras av efterföljande middleware.  
-   **before**: Infogas före middleware med den angivna taggen.  
-   **after**: Infogas efter middleware med den angivna taggen.  

Exempel:

```ts
// Vanlig middleware
app.use(m1, { tag: 'restApi' });
app.resourceManager.use(m2, { tag: 'parseToken' });
app.resourceManager.use(m3, { tag: 'checkRole' });

// m4 kommer att placeras före m1
app.use(m4, { before: 'restApi' });

// m5 kommer att infogas mellan m2 och m3
app.resourceManager.use(m5, { after: 'parseToken', before: 'checkRole' });
```

:::tip

Om ingen position anges är standardexekveringsordningen för nyligen tillagd middleware:  
`acl.use()` -> `resourceManager.use()` -> `dataSourceManager.use()` -> `app.use()`  

:::

## Exempel på lökringmodellen

Middleware-exekveringsordningen följer Koas **lökringmodell**, vilket innebär att de först går in i middleware-stacken och sedan ut ur den.  

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

Exempel på utdataordning vid åtkomst av olika gränssnitt:

-   **Vanlig förfrågan**: `/api/hello`  
    Utdata: `[1,2]` (resursen är inte definierad, `resourceManager` och `acl` middleware körs inte)  

-   **Resursförfrågan**: `/api/test:list`  
    Utdata: `[5,3,7,1,2,8,4,6]`  
    Middleware körs enligt nivåordningen och lökringmodellen.

## Sammanfattning

-   NocoBase Middleware är en utökning av Koa Middleware.  
-   Fyra nivåer: Applikation -> Datakälla -> Resurs -> Behörighet
-   Ni kan använda `before` / `after` / `tag` för att flexibelt styra exekveringsordningen.  
-   Följer Koas lökringmodell, vilket säkerställer att middleware är komponerbart och kapslingsbart.  
-   Middleware på datakällnivå påverkar endast angivna datakällförfrågningar, och middleware på resursnivå påverkar endast definierade resursförfrågningar.