:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Details-blok

## Introductie

Het Details-blok gebruikt u om de veldwaarden van elk gegevensrecord weer te geven. Het ondersteunt flexibele veldindelingen en bevat ingebouwde functies voor gegevensacties, zodat u informatie gemakkelijk kunt bekijken en beheren.

## Blokinstellingen

![20251029202614](https://static-docs.nocobase.com/20251029202614.png)

### Koppelingsregels voor blokken

Beheer het gedrag van een blok (bijvoorbeeld of het wordt weergegeven of dat JavaScript wordt uitgevoerd) via koppelingsregels.

![20251023195004](https://static-docs.nocobase.com/20251023195004.png)
Voor meer details, zie [Koppelingsregels](/interface-builder/linkage-rule)

### Gegevensbereik instellen

Voorbeeld: Alleen betaalde bestellingen weergeven.

![20251023195051](https://static-docs.nocobase.com/20251023195051.png)

Voor meer details, zie [Gegevensbereik instellen](/interface-builder/blocks/block-settings/data-scope)

### Koppelingsregels voor velden

Koppelingsregels in het Details-blok ondersteunen het dynamisch instellen van velden om deze te tonen/verbergen.

Voorbeeld: Toon het bedrag niet wanneer de bestelstatus 'Geannuleerd' is.

![20251023200739](https://static-docs.nocobase.com/20251023200739.png)

Voor meer details, zie [Koppelingsregels](/interface-builder/linkage-rule)

## Velden configureren

### Velden uit deze collectie

> **Opmerking**: Velden uit overgeërfde collecties (d.w.z. velden van de bovenliggende collectie) worden automatisch samengevoegd en weergegeven in de huidige veldenlijst.

![20251023201012](https://static-docs.nocobase.com/20251023201012.png)

### Velden uit gerelateerde collecties

> **Opmerking**: Het weergeven van velden uit gerelateerde collecties wordt ondersteund (momenteel alleen voor één-op-één-relaties).

![20251023201258](https://static-docs.nocobase.com/20251023201258.png)

### Overige velden
- JS Field
- JS Item
- Scheidingslijn
- Markdown

![20251023201514](https://static-docs.nocobase.com/20251023201514.png)

> **Tip**: U kunt JavaScript schrijven om aangepaste weergave-inhoud te implementeren, zodat u complexere informatie kunt tonen.  
> U kunt bijvoorbeeld verschillende weergave-effecten renderen op basis van verschillende gegevenstypen, voorwaarden of logica.

![20251023202017](https://static-docs.nocobase.com/20251023202017.png)

## Acties configureren

![20251023200529](https://static-docs.nocobase.com/20251023200529.png)

- [Bewerken](/interface-builder/actions/types/edit)
- [Verwijderen](/interface-builder/actions/types/delete)
- [Koppeling](/interface-builder/actions/types/link)
- [Pop-up](/interface-builder/actions/types/pop-up)
- [Record bijwerken](/interface-builder/actions/types/update-record)
- [Workflow activeren](/interface-builder/actions/types/trigger-workflow)
- [JS Actie](/interface-builder/actions/types/js-action)
- [AI Medewerker](/interface-builder/actions/types/ai-employee)