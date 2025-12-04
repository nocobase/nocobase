---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# JavaScript-skript

## Introduktion

JavaScript-skriptnoden låter dig köra ett anpassat JavaScript-skript på serversidan inom ett arbetsflöde. Skriptet kan använda variabler från tidigare steg i arbetsflödet som parametrar, och dess returvärde kan sedan användas av efterföljande noder.

Skriptet körs i en arbetstråd på NocoBase-applikationens server och stöder de flesta Node.js-funktioner. Det finns dock vissa skillnader jämfört med en inbyggd exekveringsmiljö. För mer information, se [Funktionslista](#funktionslista).

## Skapa en nod

I konfigurationsgränssnittet för arbetsflödet klickar du på plusknappen ("+") i flödet för att lägga till en "JavaScript"-nod:

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Nodkonfiguration

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parametrar

Används för att skicka variabler eller statiska värden från arbetsflödets kontext till skriptet, för användning i kodlogiken. `name` är parameternamnet, som blir variabelnamnet när det skickas till skriptet. `value` är parametervärdet, som kan vara en variabel eller en konstant.

### Skriptinnehåll

Skriptinnehållet kan betraktas som en funktion. Du kan skriva vilken JavaScript-kod som helst som stöds i Node.js-miljön och använda `return`-satsen för att returnera ett värde som nodens exekveringsresultat, vilket sedan kan användas som en variabel av efterföljande noder.

När du har skrivit koden kan du klicka på testknappen under redigeraren för att öppna en dialogruta för testkörning. Där kan du fylla i parametrar med statiska värden för en simulerad körning. Efter körningen kan du se returvärdet och utdata (loggen) i dialogrutan.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Tidsgränsinställning

Enheten är millisekunder. Ett värde på `0` innebär att ingen tidsgräns är inställd.

### Fortsätt arbetsflödet vid fel

Om du markerar detta kommer efterföljande noder att fortsätta exekveras även om skriptet stöter på ett fel eller om en tidsgräns överskrids.

:::info{title="Tips"}
Om skriptet misslyckas kommer det inte att ha något returvärde, och nodens resultat fylls med felmeddelandet. Om efterföljande noder använder resultatvariabeln från skriptnoden, bör detta hanteras med försiktighet.
:::

## Funktionslista

### Node.js-version

Samma som Node.js-versionen som kör huvudapplikationen.

### Modulstöd

Moduler kan användas i skriptet med vissa begränsningar, i enlighet med CommonJS, genom att använda `require()`-direktivet för att importera moduler.

Stöder inbyggda Node.js-moduler och moduler installerade i `node_modules` (inklusive beroenden som redan används av NocoBase). Moduler som ska vara tillgängliga för koden måste deklareras i applikationens miljövariabel `WORKFLOW_SCRIPT_MODULES`, där flera paketnamn separeras med kommatecken, till exempel:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Tips"}
Moduler som inte deklarerats i miljövariabeln `WORKFLOW_SCRIPT_MODULES` kan **inte** användas i skriptet, även om de är inbyggda i Node.js eller redan installerade i `node_modules`. Denna policy kan användas på driftsnivå för att kontrollera vilka moduler användare får använda, och i vissa scenarier förhindra att skript får för höga behörigheter.
:::

I en miljö som inte är källkodsbaserad, om en modul inte är installerad i `node_modules`, kan du manuellt installera det nödvändiga paketet i `storage`-katalogen. Om du till exempel behöver använda paketet `exceljs` kan du utföra följande steg:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Lägg sedan till paketets relativa (eller absoluta) sökväg, baserat på applikationens CWD (aktuell arbetsmapp), till miljövariabeln `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

Du kan sedan använda paketet `exceljs` i ditt skript:

```js
const ExcelJS = require('exceljs');
// ...
```

### Globala variabler

**Stöder inte** globala variabler som `global`, `process`, `__dirname` och `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Indataparametrar

Parametrar som konfigurerats i noden blir globala variabler inom skriptet och kan användas direkt. Parametrar som skickas till skriptet stöder endast grundläggande typer, såsom `boolean`, `number`, `string`, `object` och arrayer. Ett `Date`-objekt kommer att konverteras till en sträng i ISO-format när det skickas in. Andra komplexa typer, som instanser av anpassade klasser, kan inte skickas direkt.

### Returvärde

Med `return`-satsen kan du returnera data av grundläggande typer (samma regler som för parametrar) till noden som dess resultat. Om `return`-satsen inte anropas i koden, kommer nodexekveringen inte att ha något returvärde.

```js
return 123;
```

### Utdata (logg)

**Stöder** användning av `console` för att skriva ut loggar.

```js
console.log('hello world!');
```

När arbetsflödet exekveras loggas även skriptnodens utdata i den motsvarande arbetsflödets loggfil.

### Asynkron

**Stöder** användning av `async` för att definiera asynkrona funktioner och `await` för att anropa dem. **Stöder** användning av det globala `Promise`-objektet.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Timers

För att använda metoder som `setTimeout`, `setInterval` eller `setImmediate` behöver du importera dem från Node.js-paketet `timers`.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```