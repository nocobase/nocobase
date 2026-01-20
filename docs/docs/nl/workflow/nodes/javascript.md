---
pkg: '@nocobase/plugin-workflow-javascript'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# JavaScript-script

## Introductie

Het JavaScript-scriptknooppunt stelt u in staat om een aangepast server-side JavaScript-script uit te voeren binnen een workflow. Het script kan variabelen uit eerdere stappen in de workflow als parameters gebruiken, en de retourwaarde kan beschikbaar worden gesteld aan volgende knooppunten.

Het script wordt uitgevoerd in een worker thread op de server van de NocoBase-applicatie en ondersteunt de meeste Node.js-functionaliteiten. Er zijn echter enkele verschillen met een native uitvoeringsomgeving. Zie [Functielijst](#functielijst) voor meer details.

## Knooppunt aanmaken

Klik in de workflowconfiguratie-interface op de plusknop ('+') in de workflow om een 'JavaScript'-knooppunt toe te voegen:

![20241202203457](https://static-docs.nocobase.com/20241202203457.png)

## Knooppuntconfiguratie

![20241202203655](https://static-docs.nocobase.com/20241202203655.png)

### Parameters

Wordt gebruikt om variabelen of statische waarden uit de workflowcontext door te geven aan het script, zodat deze in de code kunnen worden gebruikt. `name` is de parameternaam, die na het doorgeven aan het script als variabelenaam fungeert. `value` is de parameterwaarde; u kunt hier een variabele selecteren of een constante invoeren.

### Scriptinhoud

De scriptinhoud kan worden beschouwd als een functie. U kunt elke JavaScript-code schrijven die wordt ondersteund in de Node.js-omgeving en de `return`-instructie gebruiken om een waarde terug te geven als het uitvoerresultaat van het knooppunt, die vervolgens door volgende knooppunten als variabele kan worden gebruikt.

Nadat u de code hebt geschreven, kunt u op de testknop onder het bewerkingsveld klikken om een dialoogvenster voor testuitvoering te openen. Hierin kunt u parameters invullen met statische waarden voor een gesimuleerde uitvoering. Na de uitvoering ziet u de retourwaarde en de uitvoer (log) in het dialoogvenster.

![20241202203833](https://static-docs.nocobase.com/20241202203833.png)

### Time-outinstelling

De eenheid is milliseconden. Een waarde van `0` betekent dat er geen time-out is ingesteld.

### Doorgaan bij fout

Indien aangevinkt, worden volgende knooppunten nog steeds uitgevoerd, zelfs als het script een fout tegenkomt of een time-out optreedt.

:::info{title="Opmerking"}
Als het script een fout genereert, heeft het geen retourwaarde en wordt het resultaat van het knooppunt gevuld met het foutbericht. Als volgende knooppunten de resultaatvariabele van het scriptknooppunt gebruiken, moet dit met de nodige voorzichtigheid worden behandeld.
:::

## Functielijst

### Node.js-versie

Gelijk aan de Node.js-versie waarop de hoofdapplicatie draait.

### Moduleondersteuning

Modules kunnen met beperkingen in het script worden gebruikt, consistent met CommonJS, door de `require()`-instructie te gebruiken om modules te importeren.

Ondersteunt native Node.js-modules en modules die zijn geïnstalleerd in `node_modules` (inclusief afhankelijkheden die al door NocoBase worden gebruikt). Modules die beschikbaar moeten zijn voor de code, moeten worden gedeclareerd in de omgevingsvariabele `WORKFLOW_SCRIPT_MODULES` van de applicatie, waarbij meerdere pakketnamen worden gescheiden door komma's, bijvoorbeeld:

```ini
WORKFLOW_SCRIPT_MODULES=crypto,timers,lodash,dayjs
```

:::info{title="Opmerking"}
Modules die niet zijn gedeclareerd in de omgevingsvariabele `WORKFLOW_SCRIPT_MODULES`, kunnen **niet** in het script worden gebruikt, zelfs als ze native zijn voor Node.js of al zijn geïnstalleerd in `node_modules`. Dit beleid kan op operationeel niveau worden gebruikt om de lijst met modules te beheren die voor gebruikers beschikbaar zijn, en in sommige scenario's te voorkomen dat scripts te veel rechten hebben.
:::

In een omgeving die niet vanuit de broncode is geïmplementeerd, kunt u, als een module niet is geïnstalleerd in `node_modules`, het benodigde pakket handmatig installeren in de `storage`-map. Als u bijvoorbeeld het `exceljs`-pakket wilt gebruiken, kunt u de volgende stappen uitvoeren:

```shell
cd storage
npm i --no-save --no-package-lock --prefix . exceljs
```

Voeg vervolgens het relatieve (of absolute) pad van het pakket, gebaseerd op de CWD (huidige werkmap) van de applicatie, toe aan de omgevingsvariabele `WORKFLOW_SCRIPT_MODULES`:

```ini
WORKFLOW_SCRIPT_MODULES=./storage/node_modules/exceljs
```

U kunt het `exceljs`-pakket dan in uw script gebruiken:

```js
const ExcelJS = require('exceljs');
// ...
```

### Globale variabelen

**Ondersteunt geen** globale variabelen zoals `global`, `process`, `__dirname` en `__filename`.

```js
console.log(global); // will throw error: "global is not defined"
```

### Invoerparameters

Parameters die in het knooppunt zijn geconfigureerd, worden globale variabelen binnen het script en kunnen direct worden gebruikt. Parameters die aan het script worden doorgegeven, ondersteunen alleen basistypen, zoals `boolean`, `number`, `string`, `object` en arrays. Een `Date`-object wordt bij het doorgeven geconverteerd naar een ISO-geformatteerde string. Andere complexe typen, zoals instanties van aangepaste klassen, kunnen niet direct worden doorgegeven.

### Retourwaarde

Met de `return`-instructie kunnen basistypen (volgens dezelfde regels als parameters) als resultaat naar het knooppunt worden teruggestuurd. Als de `return`-instructie niet in de code wordt aangeroepen, heeft de uitvoering van het knooppunt geen retourwaarde.

```js
return 123;
```

### Uitvoer (Log)

**Ondersteunt** het gebruik van `console` om logs uit te voeren.

```js
console.log('hello world!');
```

Wanneer de workflow wordt uitgevoerd, wordt de uitvoer van het scriptknooppunt ook vastgelegd in het logbestand van de betreffende workflow.

### Asynchroon

**Ondersteunt** het gebruik van `async` om asynchrone functies te definiëren en `await` om deze aan te roepen. **Ondersteunt** het gebruik van het globale `Promise`-object.

```js
async function test() {
  return Promise.resolve(1);
}

const value = await test();
return value;
```

### Timers

Om methoden zoals `setTimeout`, `setInterval` of `setImmediate` te gebruiken, moet u deze importeren uit het Node.js `timers`-pakket.

```js
const { setTimeout, setInterval, setImmediate, clearTimeout, clearInterval, clearImmediate } = require('timers');

async function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

await sleep(1000);

return 123;
```