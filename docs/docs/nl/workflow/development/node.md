:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Knooppunttypen uitbreiden

Het type van een knooppunt is in essentie een operationele instructie. Verschillende instructies vertegenwoordigen verschillende bewerkingen die in de **workflow** worden uitgevoerd.

Net als bij triggers is het uitbreiden van knooppunttypen verdeeld in twee delen: server-side en client-side. De server-side moet de logica voor de geregistreerde instructie implementeren, terwijl de client-side de interfaceconfiguratie moet bieden voor de parameters van het knooppunt waar de instructie zich bevindt.

## Server-side

### De eenvoudigste knooppuntinstructie

De kern van een instructie is een functie. Dit betekent dat de `run`-methode in de instructieklasse geïmplementeerd moet worden om de logica van de instructie uit te voeren. Binnen deze functie kunt u elke gewenste bewerking uitvoeren, zoals databasebewerkingen, bestandsbewerkingen of het aanroepen van API's van derden.

Alle instructies moeten afgeleid zijn van de basisklasse `Instruction`. De eenvoudigste instructie hoeft alleen een `run`-functie te implementeren:

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

En registreer deze instructie bij de **workflow plugin**:

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

De statuswaarde (`status`) in het returnobject van de instructie is verplicht en moet een waarde zijn uit de `JOB_STATUS`-constante. Deze waarde bepaalt de verdere afhandeling van dit knooppunt in de **workflow**. Meestal gebruikt u `JOB_STATUS.RESOVLED`, wat aangeeft dat het knooppunt succesvol is uitgevoerd en de uitvoering doorgaat naar de volgende knooppunten. Als er een resultaatwaarde is die u vooraf wilt opslaan, kunt u ook de `processor.saveJob`-methode aanroepen en het returnobject van die methode retourneren. De uitvoerder genereert dan een uitvoeringsresultaatrecord op basis van dit object.

### Knooppuntresultaatwaarde

Als er een specifiek uitvoeringsresultaat is, met name gegevens die voorbereid zijn voor gebruik door volgende knooppunten, dan kunt u dit retourneren via de `result`-eigenschap en opslaan in het taakobject van het knooppunt:

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

Hierbij is `node.config` het configuratie-item van het knooppunt, wat elke gewenste waarde kan zijn. Het wordt opgeslagen als een `JSON`-type veld in de corresponderende knooppuntrecord in de database.

### Foutafhandeling van instructies

Als er tijdens de uitvoering uitzonderingen kunnen optreden, kunt u deze vooraf opvangen en een mislukte status retourneren:

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

Als voorspelbare uitzonderingen niet worden opgevangen, zal de **workflow**-engine deze automatisch opvangen en een foutstatus retourneren om te voorkomen dat niet-opgevangen uitzonderingen het programma laten crashen.

### Asynchrone knooppunten

Wanneer **workflow**-controle of asynchrone (tijdrovende) I/O-bewerkingen nodig zijn, kan de `run`-methode een object retourneren met een `status` van `JOB_STATUS.PENDING`. Dit geeft de uitvoerder de instructie om te wachten (op te schorten) totdat een externe asynchrone bewerking is voltooid, en vervolgens de **workflow**-engine te informeren om de uitvoering voort te zetten. Als een 'pending' statuswaarde wordt geretourneerd in de `run`-functie, moet de instructie de `resume`-methode implementeren; anders kan de **workflow**-uitvoering niet worden hervat:

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

Hier verwijst `paymentService` naar een betaaldienst. In de callback van de dienst wordt de **workflow** geactiveerd om de uitvoering van de corresponderende taak te hervatten, waarna het huidige proces eerst wordt afgesloten. Vervolgens creëert de **workflow**-engine een nieuwe processor die wordt doorgegeven aan de `resume`-methode van het knooppunt, om het eerder opgeschorte knooppunt verder uit te voeren.

:::info{title=Tip}
De hierboven genoemde "asynchrone bewerking" verwijst niet naar `async`-functies in JavaScript, maar eerder naar bewerkingen die niet direct een resultaat retourneren bij interactie met andere externe systemen. Denk bijvoorbeeld aan een betaaldienst die moet wachten op een andere melding om het resultaat te weten.
:::

### Knooppuntresultaatstatus

De uitvoeringsstatus van een knooppunt beïnvloedt het succes of falen van de gehele **workflow**. Meestal, zonder vertakkingen, leidt het falen van één knooppunt direct tot het falen van de hele **workflow**. Het meest voorkomende scenario is dat als een knooppunt succesvol wordt uitgevoerd, het doorgaat naar het volgende knooppunt in de knooppunttabel. Zodra er geen volgende knooppunten meer zijn, wordt de gehele **workflow** succesvol voltooid.

Als een knooppunt tijdens de uitvoering een mislukte status retourneert, zal de engine dit op twee verschillende manieren afhandelen, afhankelijk van de situatie:

1.  Het knooppunt dat een mislukte status retourneert, bevindt zich in de hoofd**workflow**, wat betekent dat het zich niet binnen een vertakte **workflow** bevindt die door een upstream knooppunt is geopend. In dit geval wordt de gehele hoofd**workflow** als mislukt beschouwd en wordt het proces beëindigd.

2.  Het knooppunt dat een mislukte status retourneert, bevindt zich binnen een vertakte **workflow**. In dit geval wordt de verantwoordelijkheid voor het bepalen van de volgende status van de **workflow** overgedragen aan het knooppunt dat de vertakking heeft geopend. De interne logica van dat knooppunt bepaalt de status van de verdere **workflow**, en deze beslissing wordt recursief doorgegeven aan de hoofd**workflow**.

Uiteindelijk wordt de volgende status van de gehele **workflow** bepaald bij de knooppunten van de hoofd**workflow**. Als een knooppunt in de hoofd**workflow** een mislukking retourneert, eindigt de gehele **workflow** met een mislukte status.

Als een knooppunt na uitvoering een "wachtende" status retourneert, wordt het gehele uitvoeringsproces tijdelijk onderbroken en opgeschort. Het wacht dan op een gebeurtenis, gedefinieerd door het corresponderende knooppunt, om de uitvoering van de **workflow** te hervatten. Bij een handmatig knooppunt bijvoorbeeld, pauzeert de uitvoering bij dit knooppunt met een "wachtende" status, in afwachting van handmatige tussenkomst om te beslissen of het wordt goedgekeurd. Als de handmatig ingevoerde status "goedgekeurd" is, worden de volgende **workflow**-knooppunten voortgezet; anders wordt het afgehandeld volgens de eerder beschreven faallogica.

Voor meer informatie over de retourstatussen van instructies, raadpleegt u het gedeelte over de **Workflow** API-referentie.

### Voortijdig afsluiten

In sommige speciale **workflows** kan het nodig zijn om de **workflow** direct binnen een knooppunt te beëindigen. U kunt dan `null` retourneren om aan te geven dat u de huidige **workflow** verlaat en dat volgende knooppunten niet worden uitgevoerd.

Deze situatie komt vaak voor bij knooppunten voor **workflow**-controle, zoals het Parallelle Vertakkingsknooppunt ([code referentie](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow-parallel/src/server/ParallelInstruction.ts#L87)). Hierbij wordt de **workflow** van het huidige knooppunt afgesloten, maar worden voor elke subvertakking nieuwe **workflows** gestart en voortgezet.

:::warn{title=Waarschuwing}
Het plannen van vertakte **workflows** met uitgebreide knooppunten is complex en vereist zorgvuldige afhandeling en grondige tests.
:::

### Meer informatie

Voor de definities van de verschillende parameters voor het definiëren van knooppunttypen, raadpleegt u het gedeelte over de **Workflow** API-referentie.

## Client-side

Net als bij triggers moet het configuratieformulier voor een instructie (knooppunttype) aan de client-side worden geïmplementeerd.

### De eenvoudigste knooppuntinstructie

Alle instructies moeten afgeleid zijn van de basisklasse `Instruction`. De bijbehorende eigenschappen en methoden worden gebruikt voor het configureren en gebruiken van het knooppunt.

Als voorbeeld: stel dat we een configuratie-interface moeten bieden voor het `randomString`-knooppunt (willekeurige getallenreeks) dat we hierboven aan de server-side hebben gedefinieerd. Dit knooppunt heeft een configuratie-item `digit` dat het aantal cijfers voor het willekeurige getal vertegenwoordigt. In het configuratieformulier gebruiken we dan een numeriek invoerveld om de gebruikersinvoer te ontvangen.

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
    workflowPlugin.registerInstruction('randomString', MyInstruction);
  }
}
```

:::info{title=Tip}
De identificatie van het knooppunttype dat aan de client-side is geregistreerd, moet overeenkomen met die aan de server-side, anders ontstaan er fouten.
:::

### Knooppuntresultaten aanbieden als variabelen

U ziet de `useVariables`-methode in het bovenstaande voorbeeld. Als u het resultaat van een knooppunt (het `result`-gedeelte) als variabele wilt gebruiken voor volgende knooppunten, moet u deze methode implementeren in de overgeërfde instructieklasse. Deze methode moet een object retourneren dat voldoet aan het `VariableOption`-type. Dit object dient als een structurele beschrijving van het uitvoeringsresultaat van het knooppunt en biedt een toewijzing van variabelenamen, zodat deze in volgende knooppunten kunnen worden geselecteerd en gebruikt.

Het `VariableOption`-type is als volgt gedefinieerd:

```ts
export type VariableOption = {
  value?: string;
  label?: string;
  children?: VariableOption[] | null;
  [key: string]: any;
};
```

De kern is de `value`-eigenschap, die de gesegmenteerde padwaarde van de variabelenaam vertegenwoordigt. `label` wordt gebruikt voor weergave in de interface, en `children` wordt gebruikt om een meerlaagse variabele structuur weer te geven, wat van pas komt wanneer het resultaat van het knooppunt een diep genest object is.

Een bruikbare variabele wordt intern in het systeem weergegeven als een pad-sjabloonstring gescheiden door `.` , bijvoorbeeld `{{jobsMapByNodeKey.2dw92cdf.abc}}`. Hierbij vertegenwoordigt `jobsMapByNodeKey` de verzameling resultaten van alle knooppunten (intern gedefinieerd, hoeft u niet te verwerken), `2dw92cdf` is de `key` van het knooppunt, en `abc` is een aangepaste eigenschap in het resultaatobject van het knooppunt.

Aangezien het resultaat van een knooppunt ook een eenvoudige waarde kan zijn, moet het eerste niveau bij het aanbieden van knooppuntvariabelen **altijd** de beschrijving van het knooppunt zelf zijn:

```ts
{
  value: node.key,
  label: node.title,
}
```

Dat wil zeggen, het eerste niveau bestaat uit de `key` en de titel van het knooppunt. Bijvoorbeeld, bij de [code referentie](https://github.com/nocobase/nocobase/blob/main/packages/plugins/%40nocobase/plugin-workflow/src/client/nodes/calculation.tsx#L77) van een rekenknooppunt, zijn de interface-opties bij het gebruik van het resultaat van dat knooppunt als volgt:

![Result of Calculation Node](https://static-docs.nocobase.com/20240514230014.png)

Wanneer het resultaat van een knooppunt een complex object is, kunt u `children` gebruiken om dieper gelegen eigenschappen te blijven beschrijven. Een aangepaste instructie kan bijvoorbeeld de volgende JSON-gegevens retourneren:

```json
{
  "message": "ok",
  "data": {
    "id": 1,
    "name": "test",
  }
}
```

Dan kunt u het retourneren via de `useVariables`-methode, als volgt:

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

Op deze manier kunt u in volgende knooppunten de volgende interface gebruiken om de variabelen te selecteren:

![Mapped Result Variables](https://static-docs.nocobase.com/20240514230103.png)

:::info{title="Tip"}
Wanneer een structuur in het resultaat een array van diep geneste objecten is, kunt u ook `children` gebruiken om het pad te beschrijven, maar het mag geen array-indices bevatten. Dit komt omdat in de variabeleafhandeling van NocoBase **workflow**, de variabelepadbeschrijving voor een array van objecten automatisch wordt afgevlakt tot een array van diepe waarden wanneer deze wordt gebruikt, en u geen specifieke waarde kunt benaderen via de index.
:::

### Beschikbaarheid van knooppunten

Standaard kunnen knooppunten willekeurig worden toegevoegd aan een **workflow**. In sommige gevallen is een knooppunt echter niet geschikt voor bepaalde typen **workflows** of vertakkingen. In dergelijke situaties kunt u de beschikbaarheid van het knooppunt configureren met behulp van `isAvailable`:

```ts
// Type definition
export abstract class Instruction {
  isAvailable?(ctx: NodeAvailableContext): boolean;
}

export type NodeAvailableContext = {
  // Workflow plugin instance
  engine: WorkflowPlugin;
  // Workflow instance
  workflow: object;
  // Upstream node
  upstream: object;
  // Whether it is a branch node (branch number)
  branchIndex: number;
};
```

De `isAvailable`-methode retourneert `true` als het knooppunt beschikbaar is, en `false` als het niet beschikbaar is. De `ctx`-parameter bevat de contextinformatie van het huidige knooppunt, die u kunt gebruiken om de beschikbaarheid ervan te bepalen.

Als er geen speciale vereisten zijn, hoeft u de `isAvailable`-methode niet te implementeren, aangezien knooppunten standaard beschikbaar zijn. De meest voorkomende situatie waarin configuratie nodig is, is wanneer een knooppunt een tijdrovende bewerking kan zijn en niet geschikt is voor uitvoering in een synchrone **workflow**. U kunt de `isAvailable`-methode gebruiken om het gebruik van het knooppunt te beperken. Bijvoorbeeld:

```ts
isAvailable({ engine, workflow, upstream, branchIndex }) {
  return !engine.isWorkflowSync(workflow);
}
```

### Meer informatie

Voor de definities van de verschillende parameters voor het definiëren van knooppunttypen, raadpleegt u het gedeelte over de **Workflow** API-referentie.