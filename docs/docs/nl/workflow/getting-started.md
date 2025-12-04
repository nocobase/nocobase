:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Snel aan de slag

## Uw eerste workflow configureren

Ga naar de beheerpagina van de **workflow** **plugin** via het **plugin**-configuratiemenu in de bovenste menubalk:

![Ingang workflow plugin beheer](https://static-docs.nocobase.com/20251027222721.png)

De beheerinterface toont een lijst van alle aangemaakte **workflows**:

![Workflow beheer](https://static-docs.nocobase.com/20251027222900.png)

Klik op de knop "Nieuw" om een nieuwe **workflow** te maken en kies "Collectie-gebeurtenis":

![Workflow maken](https://static-docs.nocobase.com/20251027222951.png)

Na het indienen klikt u op de link "Configureren" in de lijst om de **workflow**-configuratie-interface te openen:

![Een lege workflow](https://static-docs.nocobase.com/20251027223131.png)

Klik vervolgens op de kaart van de trigger om het configuratiepaneel van de trigger te openen. Selecteer een eerder aangemaakte **collectie** (bijvoorbeeld de **collectie** 'Artikelen'), kies "Na toevoegen van record" voor het triggertijdstip en klik op de knop "Opslaan" om de triggerconfiguratie te voltooien:

![Trigger configureren](https://static-docs.nocobase.com/20251027224735.png)

Vervolgens kunnen we op de plusknop in de stroom klikken om een node toe te voegen. Kies bijvoorbeeld een reken-node om het veld "Titel" en het veld "ID" van de triggergegevens samen te voegen:

![Reken-node toevoegen](https://static-docs.nocobase.com/20251027224842.png)

Klik op de node-kaart om het configuratiepaneel van de node te openen. Gebruik de `CONCATENATE`-functie van Formula.js om de velden "Titel" en "ID" samen te voegen. Beide velden voegt u in via de variabelekiezer:

![Reken-node gebruikt functies en variabelen](https://static-docs.nocobase.com/20251027224939.png)

Maak daarna een "record bijwerken"-node aan om het resultaat op te slaan in het veld "Titel":

![Record bijwerken-node maken](https://static-docs.nocobase.com/20251027232654.png)

Klik op dezelfde manier op de kaart om het configuratiepaneel van de "record bijwerken"-node te openen. Selecteer de **collectie** 'Artikelen', kies de **data**-ID van de trigger voor de te updaten record-ID, selecteer "Titel" voor het te updaten veld en kies het resultaat van de reken-node als waarde:

![Record bijwerken-node configureren](https://static-docs.nocobase.com/20251027232802.png)

Klik ten slotte op de schakelaar "Inschakelen"/"Uitschakelen" in de werkbalk rechtsboven om de **workflow** in te schakelen, zodat de **workflow** kan worden geactiveerd en uitgevoerd.

## De workflow activeren

Keer terug naar de hoofdinterface van het systeem, maak een artikel aan via het artikelenblok en vul de artikel-titel in:

![Artikelgegevens aanmaken](https://static-docs.nocobase.com/20251027233004.png)

Na het indienen en vernieuwen van het blok ziet u dat de artikel-titel automatisch is bijgewerkt naar het formaat "Artikel-titel + Artikel-ID":

![Artikel-titel gewijzigd door workflow](https://static-docs.nocobase.com/20251027233043.png)

:::info{title=Tip}
Aangezien **workflows** die door **collectie**-gebeurtenissen worden geactiveerd, asynchroon worden uitgevoerd, ziet u de **data**-update niet onmiddellijk in de interface na het indienen van de **data**. Echter, na korte tijd kunt u de bijgewerkte inhoud zien door de pagina of het blok te vernieuwen.
:::

## Uitvoeringsgeschiedenis bekijken

De **workflow** is zojuist succesvol geactiveerd en één keer uitgevoerd. U kunt teruggaan naar de beheerinterface van de **workflow** om de bijbehorende uitvoeringsgeschiedenis te bekijken:

![Workflowlijst bekijken](https://static-docs.nocobase.com/20251027233246.png)

In de **workflow**-lijst ziet u dat deze **workflow** één uitvoeringsgeschiedenis heeft gegenereerd. Klik op de link in de kolom "Aantal" om de uitvoeringsgeschiedenisrecords voor de betreffende **workflow** te openen:

![Uitvoeringsgeschiedenislijst voor de betreffende workflow](https://static-docs.nocobase.com/20251027233341.png)

Klik vervolgens op de link "Bekijken" om de detailpagina voor die uitvoering te openen, waar u de uitvoeringsstatus en resultaatgegevens voor elke node kunt zien:

![Details uitvoeringsgeschiedenis workflow](https://static-docs.nocobase.com/20251027233615.png)

De contextgegevens van de trigger en de resultaatgegevens van de node-uitvoering kunt u bekijken door op de statusknop in de rechterbovenhoek van de betreffende kaart te klikken. Laten we bijvoorbeeld de resultaatgegevens van de reken-node bekijken:

![Resultaat reken-node](https://static-docs.nocobase.com/20251027233635.png)

U ziet dat de resultaatgegevens van de reken-node de berekende titel bevatten. Deze titel is de **data** die door de daaropvolgende "record bijwerken"-node wordt gebruikt.

## Samenvatting

Met de bovenstaande stappen hebben we de configuratie en activering van een eenvoudige **workflow** voltooid en zijn we geïntroduceerd in de volgende basisconcepten:

- **Workflow**: Wordt gebruikt om de basisinformatie van een stroom te definiëren, inclusief naam, triggertype en ingeschakelde status. U kunt er een willekeurig aantal nodes in configureren. Het is de entiteit die de stroom draagt.
- **Trigger**: Elke **workflow** bevat één trigger, die kan worden geconfigureerd met specifieke voorwaarden waaronder de **workflow** wordt geactiveerd. Het is het startpunt van de stroom.
- **Node**: Een node is een instructie-eenheid binnen een **workflow** die een specifieke actie uitvoert. Meerdere nodes in een **workflow** vormen een complete uitvoeringsstroom door middel van upstream- en downstream-relaties.
- **Uitvoering**: Een uitvoering is het specifieke uitvoeringsobject nadat een **workflow** is geactiveerd, ook wel een uitvoeringsrecord of uitvoeringsgeschiedenis genoemd. Het bevat informatie zoals de uitvoeringsstatus en triggercontextgegevens. Er zijn ook bijbehorende uitvoeringsresultaten voor elke node, die de uitvoeringsstatus en resultaatgegevens van de node bevatten.

Voor meer diepgaand gebruik kunt u de volgende inhoud raadplegen:

- [Triggers](./triggers/index)
- [Nodes](./nodes/index)
- [Variabelen gebruiken](./advanced/variables)
- [Uitvoeringen](./advanced/executions)
- [Versiebeheer](./advanced/revisions)
- [Geavanceerde opties](./advanced/options)