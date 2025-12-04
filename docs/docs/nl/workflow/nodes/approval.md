---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Goedkeuring

## Introductie

Binnen een goedkeuringsworkflow gebruikt u een speciaal 'Goedkeuring'-knooppunt om de operationele logica te configureren waarmee goedkeurders een ingediende aanvraag kunnen verwerken (goedkeuren, afwijzen of terugsturen). Het 'Goedkeuring'-knooppunt is uitsluitend bedoeld voor goedkeuringsprocessen.

:::info{title=Tip}
Het verschil met een regulier 'Handmatig'-knooppunt: Een regulier 'Handmatig'-knooppunt is bedoeld voor meer algemene scenario's, zoals handmatige gegevensinvoer of handmatige beslissingen over het al dan niet voortzetten van het proces in diverse soorten workflows. Het 'Goedkeuring'-knooppunt is een gespecialiseerd verwerkingsknooppunt dat exclusief is ontworpen voor goedkeuringsprocessen. Het verwerkt alleen de gegevens van de ingediende goedkeuring en kan niet in andere workflows worden gebruikt.
:::

## Knooppunt aanmaken

Klik op de plusknop ('+') in de workflow om een 'Goedkeuring'-knooppunt toe te voegen. Kies vervolgens een van de doorvoermodi om het goedkeuringsknooppunt aan te maken:

![Goedkeuringsknooppunt aanmaken](https://static-docs.nocobase.com/20251107000938.png)

## Knooppuntconfiguratie

### Doorvoermodus

Er zijn twee doorvoermodi:

1.  **Directe doorvoer (Pass-through modus)**: Meestal gebruikt voor eenvoudigere processen. Of het goedkeuringsknooppunt wordt goedgekeurd of niet, bepaalt alleen of het proces eindigt. Bij afwijzing wordt het proces direct beëindigd.

    ![Doorvoermodus - Directe doorvoer](https://static-docs.nocobase.com/20251107001043.png)

2.  **Vertakkingsmodus (Branch modus)**: Meestal gebruikt voor complexere datalogica. Nadat het goedkeuringsknooppunt een resultaat heeft opgeleverd, kunnen andere knooppunten verder worden uitgevoerd binnen de resulterende vertakking.

    ![Doorvoermodus - Vertakkingsmodus](https://static-docs.nocobase.com/20251107001234.png)

    Nadat dit knooppunt is 'Goedgekeurd', wordt naast de goedkeuringsvertakking ook het verdere proces voortgezet. Na een 'Afwijzen'-actie kan het verdere proces standaard ook worden voortgezet, of u kunt het knooppunt zo configureren dat het proces eindigt na het uitvoeren van de vertakking.

:::info{title=Tip}
De doorvoermodus kan niet meer worden gewijzigd nadat het knooppunt is aangemaakt.
:::

### Goedkeurder

De goedkeurder is de verzameling gebruikers die verantwoordelijk is voor de goedkeuringsactie van dit knooppunt. Dit kan één of meerdere gebruikers zijn. De bron kan een statische waarde zijn, geselecteerd uit een gebruikerslijst, of een dynamische waarde, gespecificeerd door een variabele:

![Goedkeurder configuratie](https://static-docs.nocobase.com/20251107001433.png)

Bij het selecteren van een variabele kunt u alleen de primaire sleutel of de externe sleutel van gebruikersgegevens uit de context en knooppuntresultaten kiezen. Als de geselecteerde variabele tijdens de uitvoering een array is (een één-op-veel-relatie), wordt elke gebruiker in de array samengevoegd tot de gehele verzameling goedkeurders.

Naast het direct selecteren van gebruikers of variabelen, kunt u ook dynamisch gebruikers filteren op basis van zoekcriteria in de gebruikerstabel om als goedkeurders te fungeren:

![Dynamische goedkeurders selectie](https://static-docs.nocobase.com/20251107001703.png)

### Overlegmodus

Als er bij de uiteindelijke uitvoering slechts één goedkeurder is (ook na het dedupliceren van meerdere variabelen), zal die gebruiker, ongeacht de gekozen overlegmodus, als enige de goedkeuringsactie uitvoeren en het resultaat bepalen.

Wanneer er meerdere gebruikers in de goedkeurdersverzameling zijn, vertegenwoordigen verschillende overlegmodi verschillende verwerkingsmethoden:

1.  **Of-tekenen**: Als slechts één persoon goedkeurt, wordt het knooppunt goedgekeurd. Het knooppunt wordt alleen afgewezen als iedereen afwijst.
2.  **Contrasigneren**: Iedereen moet goedkeuren voordat het knooppunt wordt goedgekeurd. Als slechts één persoon afwijst, wordt het knooppunt afgewezen.
3.  **Stemmen**: Het aantal personen dat goedkeurt, moet een ingestelde verhouding overschrijden om het knooppunt goed te keuren; anders wordt het knooppunt afgewezen.

Voor de 'Terugsturen'-actie geldt dat in elke modus, als een gebruiker in de goedkeurdersverzameling de aanvraag als 'terugsturen' verwerkt, het knooppunt direct de workflow verlaat.

### Verwerkingsvolgorde

Evenzo, wanneer er meerdere gebruikers in de goedkeurdersverzameling zijn, vertegenwoordigen verschillende verwerkingsvolgordes verschillende verwerkingsmethoden:

1.  **Parallel**: Alle goedkeurders kunnen in willekeurige volgorde verwerken; de volgorde van verwerking is niet van belang.
2.  **Sequentieel**: Goedkeurders verwerken opeenvolgend volgens de volgorde in de goedkeurdersverzameling. De volgende goedkeurder kan pas verwerken nadat de vorige heeft ingediend.

Ongeacht of de verwerking is ingesteld op 'Sequentieel', volgt het resultaat dat wordt geproduceerd op basis van de feitelijke verwerkingsvolgorde ook de regels in de bovengenoemde 'Overlegmodus'. Het knooppunt voltooit de uitvoering zodra aan de corresponderende voorwaarden is voldaan.

### Workflow verlaten na afloop van de afwijsvertakking

Wanneer de 'Doorvoermodus' is ingesteld op 'Vertakkingsmodus', kunt u ervoor kiezen om de workflow te verlaten nadat de afwijsvertakking is voltooid. Na het aanvinken van deze optie verschijnt er een '✗' aan het einde van de afwijsvertakking, wat aangeeft dat verdere knooppunten niet worden voortgezet na het einde van deze vertakking:

![Workflow verlaten na afwijzing](https://static-docs.nocobase.com/20251107001839.png)

### Configuratie goedkeurdersinterface

De configuratie van de goedkeurdersinterface wordt gebruikt om de goedkeurder een bedieningsinterface te bieden wanneer de goedkeuringsworkflow dit knooppunt bereikt. Klik op de configuratieknop om het pop-upvenster te openen:

![Pop-up configuratie goedkeurdersinterface](https://static-docs.nocobase.com/20251107001958.png)

In het configuratievenster kunt u blokken toevoegen zoals de oorspronkelijke indieningsinhoud, goedkeuringsinformatie, een verwerkingsformulier en aangepaste meldingstekst:

![Blokken toevoegen aan goedkeurdersinterface](https://static-docs.nocobase.com/20251107002604.png)

#### Oorspronkelijke indieningsinhoud

Het detailblok voor de goedkeuringsinhoud is het datablok dat door de initiator is ingediend. Net als bij een regulier datablok kunt u willekeurig veldcomponenten uit de collectie toevoegen en deze vrij rangschikken om de inhoud te organiseren die de goedkeurder moet bekijken:

![Configuratie detailblok](https://static-docs.nocobase.com/20251107002925.png)

#### Verwerkingsformulier

In het actieformulierblok kunt u actieknoppen toevoegen die door dit knooppunt worden ondersteund, waaronder 'Goedkeuren', 'Afwijzen', 'Terugsturen', 'Doorsturen' en 'Extra ondertekenaar toevoegen':

![Actieformulierblok](https://static-docs.nocobase.com/20251107003015.png)

Bovendien kunnen in het actieformulier ook velden worden toegevoegd die door de goedkeurder kunnen worden gewijzigd. Deze velden worden weergegeven in het actieformulier wanneer de goedkeurder de aanvraag verwerkt. De goedkeurder kan de waarden van deze velden wijzigen, en na indiening worden zowel de gegevens voor goedkeuring als de momentopname van de corresponderende gegevens in het goedkeuringsproces gelijktijdig bijgewerkt.

![Goedkeuringsinhoudsvelden wijzigen](https://static-docs.nocobase.com/20251107003206.png)

#### 'Goedkeuren' en 'Afwijzen'

Binnen de goedkeuringsactieknoppen zijn 'Goedkeuren' en 'Afwijzen' beslissende acties. Na indiening is de verwerking van dit knooppunt door de goedkeurder voltooid. Extra velden die bij indiening moeten worden ingevuld, zoals 'Opmerking', kunnen worden toegevoegd in het pop-upvenster 'Verwerkingsconfiguratie' van de actieknop.

![Verwerkingsconfiguratie](https://static-docs.nocobase.com/20251107003314.png)

#### 'Terugsturen'

'Terugsturen' is ook een beslissende actie. Naast het configureren van opmerkingen, kunt u ook de knooppunten configureren waarnaar kan worden teruggestuurd:

![Configureer terug te sturen knooppunten](https://static-docs.nocobase.com/20251107003555.png)

#### 'Doorsturen' en 'Extra ondertekenaar toevoegen'

'Doorsturen' en 'Extra ondertekenaar toevoegen' zijn niet-beslissende acties die worden gebruikt om de goedkeurders in het goedkeuringsproces dynamisch aan te passen. 'Doorsturen' houdt in dat de goedkeuringstaak van de huidige gebruiker wordt overgedragen aan een andere gebruiker voor verwerking. 'Extra ondertekenaar toevoegen' betekent dat er een goedkeurder wordt toegevoegd vóór of na de huidige goedkeurder, en de nieuw toegevoegde goedkeurder zal samen met de anderen de goedkeuring voortzetten.

Nadat u de actieknoppen 'Doorsturen' of 'Extra ondertekenaar toevoegen' hebt ingeschakeld, moet u in het configuratiemenu van de knop de 'Toewijzingsbereik' selecteren om het bereik van gebruikers in te stellen die als nieuwe goedkeurders kunnen worden toegewezen:

![Toewijzingsbereik](https://static-docs.nocobase.com/20241226232321.png)

Net als bij de oorspronkelijke goedkeurdersconfiguratie van het knooppunt, kan het toewijzingsbereik ook bestaan uit direct geselecteerde goedkeurders of gebaseerd zijn op zoekcriteria van de gebruikerscollectie. Dit wordt uiteindelijk samengevoegd tot één verzameling, waarbij gebruikers die al in de goedkeurdersverzameling zitten, worden uitgesloten.

:::warning{title=Belangrijk}
Als u een actieknop in- of uitschakelt, of het toewijzingsbereik wijzigt, moet u de configuratie van dit knooppunt opslaan nadat u het pop-upvenster voor de configuratie van de actie-interface hebt gesloten. Anders worden de wijzigingen aan de actieknop niet van kracht.
:::

## Knooppuntresultaat

Nadat de goedkeuring is voltooid, worden de relevante status en gegevens vastgelegd in het knooppuntresultaat en kunnen deze als variabelen worden gebruikt door volgende knooppunten.

![Knooppuntresultaat](https://static-docs.nocobase.com/20250614095052.png)

### Goedkeuringsstatus knooppunt

Vertegenwoordigt de verwerkingsstatus van het huidige goedkeuringsknooppunt. Het resultaat is een opsommingswaarde.

### Gegevens na goedkeuring

Als de goedkeurder de goedkeuringsinhoud in het actieformulier wijzigt, worden de gewijzigde gegevens vastgelegd in het knooppuntresultaat voor gebruik door volgende knooppunten. Om relatievelden te gebruiken, moet u preloading voor deze relatievelden configureren in de trigger.

### Goedkeuringslogboek

> v1.8.0+

Het goedkeuringsverwerkingslogboek is een array die de verwerkingsrecords van alle goedkeurders in dit knooppunt bevat. Elk verwerkingsrecord bevat de volgende velden:

| Veld | Type | Beschrijving |
| --- | --- | --- |
| id | number | Unieke identificatie van het verwerkingsrecord |
| userId | number | Gebruikers-ID van degene die dit record heeft verwerkt |
| status | number | Verwerkingsstatus |
| comment | string | Opmerking tijdens de verwerking |
| updatedAt | string | Bijwerkingstijd van het verwerkingsrecord |

U kunt deze velden naar behoefte als variabelen gebruiken in volgende knooppunten.