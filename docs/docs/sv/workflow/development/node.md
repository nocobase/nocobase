:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Utöka nodtyper

En nods typ är i grunden en operationell instruktion. Olika instruktioner representerar olika operationer som utförs i arbetsflödet.

I likhet med utlösare delas även utökning av nodtyper in i två delar: server-sida och klient-sida. Server-sidan behöver implementera logiken för den registrerade instruktionen, medan klient-sidan behöver tillhandahålla gränssnittskonfigurationen för parametrarna för den nod där instruktionen finns.

## Server-sidan

### Den enklaste nodinstruktionen

Kärnan i en instruktion är en funktion, vilket innebär att `run`-metoden i instruktionsklassen måste implementeras för att utföra instruktionens logik. Inom funktionen kan ni utföra alla nödvändiga operationer, som databasoperationer, filoperationer, anrop till tredjeparts-API:er med mera.

Alla instruktioner måste härledas från basklassen `Instruction`. Den enklaste instruktionen behöver bara implementera en `run`-funktion:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class MyInstruction extends Instruction {
  run(node, input, processor) {
    console.log('my instruction runs!');
    return {
      status: JOB_STATUS.RESOVLED,
    };
  }
}
```

Och registrera denna instruktion i arbetsflödes-pluginen:

```ts
export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('my-instruction', MyInstruction);
  }
}
```

Statusvärdet (`status`) i instruktionens returobjekt är obligatoriskt och måste vara ett värde från konstanten `JOB_STATUS`. Detta värde avgör hur noden kommer att behandlas vidare i arbetsflödet. Vanligtvis används `JOB_STATUS.RESOVLED`, vilket indikerar att noden har utförts framgångsrikt och att exekveringen fortsätter till nästa noder. Om det finns ett resultatvärde som behöver sparas i förväg, kan ni också anropa `processor.saveJob`-metoden och returnera dess returobjekt. Exekutorn kommer att generera en exekveringsresultatpost baserat på detta objekt.

### Nodens resultatvärde

Om det finns ett specifikt exekveringsresultat, särskilt data som förbereds för att användas av efterföljande noder, kan det returneras via egenskapen `result` och sparas i nodens jobobjekt:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class RandomStringInstruction extends Instruction {
  run(node, input, processor) {
    // customized config from node
    const { digit = 1 } = node.config;
    const result = `${Math.round(10 ** digit * Math.random())}`.padStart(
      digit,
      '0',
    );
    return {
      status: JOB_STATUS.RESOVLED,
      result,
    };
  },
};
```

Här är `node.config` nodens konfigurationspost, som kan vara vilket värde som helst som behövs. Det sparas som ett fält av typen `JSON` i motsvarande nodpost i databasen.

### Felhantering för instruktioner

Om undantag kan uppstå under exekveringen kan ni fånga dem i förväg och returnera en misslyckad status:

```ts
import { JOB_STATUS } from '@nocobase/plugin-workflow';

export const errorInstruction = {
  run(node, input, processor) {
    try {
      throw new Error('exception');
    } catch (error) {
      return {
        status: JOB_STATUS.ERROR,
        result: error,
      };
    }
  },
};
```

Om förutsägbara undantag inte fångas, kommer arbetsflödesmotorn automatiskt att fånga dem och returnera en felstatus för att förhindra att ofångade undantag kraschar programmet.

### Asynkrona noder

När ni behöver flödeskontroll eller asynkrona (tidskrävande) I/O-operationer, kan `run`-metoden returnera ett objekt med status `JOB_STATUS.PENDING`. Detta instruerar exekutorn att vänta (pausa) tills en extern asynkron operation är slutförd, och sedan meddela arbetsflödesmotorn att fortsätta exekveringen. Om ett pausat statusvärde returneras i `run`-funktionen, måste instruktionen implementera `resume`-metoden; annars kan arbetsflödesexekveringen inte återupptas:

```ts
import { Instruction, JOB_STATUS } from '@nocobase/plugin-workflow';

export class PayInstruction extends Instruction {
  async run(node, input, processor) {
    // job could be create first via processor
    const job = await processor.saveJob({
      status: JOB_STATUS.PENDING,
    });

    const { workflow } = processor;
    // do payment asynchronously
    paymentService.pay(node.config, (result) => {
      // notify processor to resume the job
      return workflow.resume(job.id, result);
    });

    // return created job instance
    return job;
  }

  resume(node, job, processor) {
    // check payment status
    job.set('status', job.result.status === 'ok' ? JOB_STATUS.RESOVLED : JOB_STATUS.REJECTED);
    return job;
  },
};
```

Här refererar `paymentService` till en betaltjänst. I tjänstens callback utlöses arbetsflödet för att återuppta exekveringen av motsvarande jobb, och den nuvarande processen avslutas först. Därefter skapar arbetsflödesmotorn en ny processor och skickar den till nodens `resume`-metod för att fortsätta exekvera den tidigare pausade noden.

:::info{title=Tips}
Med "asynkron operation" här avses inte `async`-funktioner i JavaScript, utan snarare operationer som inte returnerar omedelbart vid interaktion med andra externa system, till exempel en betaltjänst som behöver vänta på en annan avisering för att få reda på resultatet.
:::

### Nodens resultatstatus

En nods exekveringsstatus påverkar hela arbetsflödets framgång eller misslyckande. Vanligtvis, om det inte finns några förgreningar, leder ett misslyckande i en nod direkt till att hela arbetsflödet misslyckas. Det vanligaste scenariot är att om en nod exekveras framgångsrikt, fortsätter den till nästa nod i nodtabellen tills det inte finns fler efterföljande noder, varpå hela arbetsflödet avslutas med en framgångsrik status.

Om en nod returnerar en misslyckad exekveringsstatus under körningen, kommer motorn att hantera det annorlunda beroende på följande två situationer:

1.  Noden som returnerar en misslyckad status befinner sig i huvudarbetsflödet, det vill säga den är inte inom något förgreningsflöde som öppnats av en uppströms nod. I detta fall bedöms hela huvudarbetsflödet som misslyckat och processen avslutas.

2.  Noden som returnerar en misslyckad status befinner sig inom ett förgreningsflöde. I detta fall överförs ansvaret för att bestämma arbetsflödets nästa status till den nod som öppnade förgreningen. Den nodens interna logik avgör statusen för det efterföljande arbetsflödet, och detta beslut sprids rekursivt uppåt till huvudarbetsflödet.

Slutligen bestäms hela arbetsflödets nästa status vid noderna i huvudarbetsflödet. Om en nod i huvudarbetsflödet returnerar ett misslyckande, avslutas hela arbetsflödet med en misslyckad status.

Om någon nod returnerar statusen "väntar" efter exekvering, kommer hela exekveringsprocessen att tillfälligt avbrytas och pausas, i väntan på att en händelse definierad av motsvarande nod utlöses för att återuppta arbetsflödet. Till exempel, när en manuell nod exekveras, pausas den med statusen "väntar" och inväntar manuell intervention för att besluta om godkännande. Om den manuellt inmatade statusen är godkänd, fortsätter de efterföljande arbetsflödesnoderna; annars hanteras det enligt den tidigare beskrivna felhanteringslogiken.

För fler instruktionsreturstatusar, se avsnittet om arbetsflödets API-referens.

### Tidig avslutning

I vissa speciella arbetsflöden kan det vara nödvändigt att avsluta arbetsflödet direkt inom en nod. Ni kan returnera `null` för att indikera att det aktuella arbetsflödet avslutas, och efterföljande noder kommer inte att exekveras.

Denna situation är vanlig i noder för flödeskontroll, till exempel i en parallell förgreningsnod ([kodreferens](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)). Där avslutas det aktuella nodflödet, men nya flöden startas för varje underförgrening och fortsätter att exekveras.

:::warn{title=Varning}
Att schemalägga förgreningsarbetsflöden med utökade noder har en viss komplexitet och kräver noggrann hantering och grundlig testning.
:::

### Läs mer

Definitionerna för de olika parametrarna för att definiera nodtyper finns i avsnittet om arbetsflödets API-referens.

## Klient-sidan

I likhet med utlösare måste konfigurationsformuläret för en instruktion (nodtyp) implementeras på klient-sidan.

### Den enklaste nodinstruktionen

Alla instruktioner måste härledas från basklassen `Instruction`. De relaterade egenskaperna och metoderna används för att konfigurera och använda noden.

Om vi till exempel behöver tillhandahålla ett konfigurationsgränssnitt för noden av typen slumpmässig siffersträng (`randomString`) som definierades på server-sidan, och som har en konfigurationspost `digit` som representerar antalet siffror för det slumpmässiga numret, skulle vi använda ett numeriskt inmatningsfält i konfigurationsformuläret för att ta emot användarens input.

```tsx pure
import WorkflowPlugin, { Instruction, VariableOption } from '@nocobase/workflow/client';

class MyInstruction extends Instruction {
  title = 'Random number string';
  type = 'randomString';
  group = 'extended';
  fieldset = {
    'digit': {
      type: 'number',
      title: 'Digit',
      name: 'digit',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 6,
    },
  };
  useVariables(node, options): VariableOption {
    return {
      value: node.key,
      label: node.title,
    };
  }
}

export default class MyPlugin extends Plugin {
  load() {
    // get workflow plugin instance
    const workflowPlugin = this.app.getPlugin<WorkflowPlugin>(WorkflowPlugin);

    // register instruction
    workflowPlugin.registerInstruction('log', LogInstruction);
  }
}
```

:::info{title=Tips}
Nodtypens identifierare som registreras på klient-sidan måste vara konsekvent med den på server-sidan, annars kommer det att orsaka fel.
:::

### Tillhandahålla nodresultat som variabler

Ni kanske lägger märke till `useVariables`-metoden i exemplet ovan. Om ni behöver använda nodens resultat (delen `result`) som en variabel för efterföljande noder, måste ni implementera denna metod i den ärvda instruktionsklassen och returnera ett objekt som överensstämmer med typen `VariableOption`. Detta objekt fungerar som en strukturell beskrivning av nodens exekveringsresultat och tillhandahåller en mappning av variabelnamn för val och användning i efterföljande noder.

Typen `VariableOption` definieras enligt följande:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

Kärnan är egenskapen `value`, som representerar variabelnamnets segmenterade sökvägsvärde. `label` används för visning i gränssnittet, och `children` används för att representera en flernivåvariabelstruktur, vilket används när nodens resultat är ett djupt nästlat objekt.

En användbar variabel representeras internt i systemet som en sökvägsmallsträng avgränsad med `.`, till exempel `{{jobsMapByNodeKey.2dw92cdf.abc}}`. Här representerar `jobsMapByNodeKey` resultatuppsättningen för alla noder (internt definierad, behöver inte hanteras), `2dw92cdf` är nodens `key`, och `abc` är en anpassad egenskap i nodens resultatobjekt.

Dessutom, eftersom en nods resultat också kan vara ett enkelt värde, måste den första nivån **alltid** vara nodens egen beskrivning när nodvariabler tillhandahålls:

```ts
{
  value: node.key,
  label: node.title,
}
```

Det vill säga, den första nivån är nodens `key` och titel. Till exempel, i beräkningsnodens [kodreferens](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77), när resultatet av beräkningsnoden används, är gränssnittsalternativen följande:

![运算节点的结果](https://static-docs.nocobase.com/20240514230014.png)

När nodens resultat är ett komplext objekt kan ni använda `children` för att fortsätta beskriva djupt nästlade egenskaper. Till exempel kan en anpassad instruktion returnera följande JSON-data:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Då kan ni returnera det via `useVariables`-metoden på följande sätt:

```ts
useVariables(node, options): VariableOption {
  return {
    value: node.key,
    label: node.title,
    children: [
      {
        value: 'message',
        label: 'Message',
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'id',
            label: 'ID',
          },
          {
            value: 'name',
            label: 'Name',
          },
        ],
      },
    ],
  };
}
```

På så sätt kan ni i efterföljande noder använda följande gränssnitt för att välja variabler från det:

![映射后的结果变量](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="Tips"}
När en struktur i resultatet är en array av djupt nästlade objekt, kan ni också använda `children` för att beskriva sökvägen, men den får inte innehålla arrayindex. Detta beror på att i NocoBase arbetsflödets variabelhantering, när en variabelvägsbeskrivning för en array av objekt används, plattas den automatiskt ut till en array av djupt nästlade värden, och ni kan inte komma åt ett specifikt värde via dess index.
:::

### Nodens tillgänglighet

Som standard kan ni lägga till vilken nod som helst i ett arbetsflöde. Men i vissa fall är en nod inte tillämplig i vissa typer av arbetsflöden eller förgreningar. I sådana situationer kan ni konfigurera nodens tillgänglighet med `isAvailable`:

```ts
// Typdefinition
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // Arbetsflödes-plugininstans
  engine: WorkflowPlugin;
  // Arbetsflödesinstans
  workflow: object;
  // Uppströms nod
  upstream: object;
  // Om det är en förgreningsnod (förgreningsnummer)
  branchIndex: number;
};
```

Metoden `isAvailable` returnerar `true` om noden är tillgänglig, och `false` om den inte är det. Parametern `ctx` innehåller den aktuella nodens kontextinformation, som kan användas för att avgöra om noden är tillgänglig.

Om det inte finns några speciella krav behöver ni inte implementera `isAvailable`-metoden, eftersom noder är tillgängliga som standard. Det vanligaste scenariot som kräver konfiguration är när en nod kan vara en tidskrävande operation och inte är lämplig för exekvering i ett synkront arbetsflöde. Ni kan använda `isAvailable`-metoden för att begränsa dess användning. Till exempel:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### Läs mer

Definitionerna för de olika parametrarna för att definiera nodtyper finns i avsnittet om arbetsflödets API-referens.