---
pkg: '@nocobase/plugin-workflow-javascript'
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/workflow/nodes/javascript).
:::

# JavaScript-skript

## Introduktion

JavaScript-skriptnoden tillåter användare att exekvera ett anpassat JavaScript-skript på serversidan i ett arbetsflöde. Variabler från uppströms i flödet kan användas som parametrar i skriptet, och skriptets returvärde kan tillhandahållas till nedströms noder för användning.

Skriptet körs i en arbetstråd på NocoBase-applikationens server och stöder de flesta funktionerna i Node.js, men det finns fortfarande vissa skillnader från den ursprungliga exekveringsmiljön, se [Funktionslista](#funktionslista) för detaljer.

## Skapa nod

I konfigurationsgränssnittet för arbetsflödet, klicka på plusknappen ("+") i flödet för att lägga till en ”JavaScript”-nod:

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Nodkonfiguration

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parametrar

Används för att skicka in variabler från arbetsflödets kontext eller statiska värden till skriptet för användning i kodlogiken. Där är `name` parameternamnet, vilket fungerar som variabelnamn efter att det skickats till skriptet. `value` är parametervärdet, där ni kan välja en variabel eller ange en konstant.

### Skriptinnehåll

Skriptinnehållet kan ses som en funktion. Ni kan skriva vilken JavaScript-kod som helst som stöds i Node.js-miljön, och ni kan använda `return`-satsen för att returnera ett värde som nodens körresultat, vilket kan användas som en variabel av efterföljande noder.

Efter att ha skrivit koden kan ni via testknappen under redigeringsrutan öppna en dialogruta för testkörning och använda statiska värden för att fylla i parametrar för simulerad exekvering. Efter exekvering kan ni se returvärdet och utdata (logg) i dialogrutan.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Timeout-inställning

Enheten beräknas i millisekunder. När den är inställd på `0` innebär det att ingen timeout är inställd.

### Fortsätt arbetsflödet efter fel

Om detta är markerat kommer efterföljande noder fortfarande att exekveras även om skriptet stöter på ett fel eller ett timeout-fel.

:::info{title="Tips"}
Om skriptet felar kommer det inte att finnas något returvärde, och nodens resultat kommer att fyllas med felinformation. Om efterföljande noder använder resultatvariabeln från skriptnoden måste ni hantera detta med försiktighet.
:::

## Funktionslista

### Node.js-version

Samma som den Node.js-version som kör huvudapplikationen.

### Modulstöd

I skriptet kan moduler användas med begränsningar, i enlighet med CommonJS, där koden använder instruktionen `require()` för att importera moduler.

Stöder inbyggda Node.js-moduler och moduler installerade i `node_modules` (inklusive beroendepaket som redan används av NocoBase). Moduler som ska tillhandahållas koden måste deklareras i applikationens miljövariabel `WORKFLOW_SCRIPT_MODULES`, där flera paketnamn separeras med kommatecken, till exempel:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Tips"}
Moduler som inte deklarerats i miljövariabeln `WORKFLOW_SCRIPT_MODULES` kan **inte** användas i skriptet, även om de är inbyggda i Node.js eller redan installerade i `node_modules`. Denna strategi kan användas för att kontrollera listan över moduler som användare kan använda på driftsnivå, för att i vissa scenarier undvika att skript får för höga behörigheter.
:::

I miljöer som inte är källkodsbaserade, om en modul inte är installerad i `node_modules`, kan ni manuellt installera de nödvändiga paketen i katalogen `storage`. Om ni till exempel behöver använda paketet `exceljs` kan ni utföra följande åtgärder:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Lägg sedan till paketets relativa (eller absoluta) sökväg baserat på applikationens CWD (aktuell arbetskatalog) i miljövariabeln `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Därefter kan ni använda paketet `exceljs` i skriptet (namnet i `require` måste överensstämma exakt med det som definierats i miljövariabeln):

```js
const ExcelJS = require('./storage/node_modules/exceljs');
// ...
```

### Globala variabler

**Stöder inte** globala variabler som `global`, `process`, `__dirname` och `__filename`.

```js
console.log(global); // kommer att kasta fel: "global is not defined"
```

### Indataparametrar

Parametrar som konfigurerats i noden fungerar som globala variabler i skriptet och kan användas direkt. Parametrar som skickas till skriptet stöder endast grundläggande typer, såsom `boolean`, `number`, `string`, `object` och arrayer. `Date`-objekt konverteras till ISO-baserade strängar efter att de skickats in. Andra komplexa typer kan inte skickas direkt, såsom instanser av anpassade klasser.

### Returvärde

Genom `return`-satsen kan data av grundläggande typ returneras (samma regler som för parametrar) till noden som resultat. Om ingen `return`-sats anropas i koden har nodexekveringen inget returvärde.

```js
return 123;
```

### Utdata (logg)

**Stöder** användning av `console` för att skriva ut loggar.

```js
console.log('hello world!');
```

När arbetsflödet exekveras kommer även skriptnodens utdata att registreras i motsvarande arbetsflödes loggfil.

### Asynkron

**Stöder** användning av `async` för att definiera asynkrona funktioner, samt `await` för att anropa asynkrona funktioner. **Stöder** användning av det globala objektet `Promise`.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Timers

Om ni behöver använda metoder som `setTimeout`, `setInterval` eller `setImmediate`, måste dessa importeras via Node.js-paketet `timers`.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```