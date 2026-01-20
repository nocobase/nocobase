:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Koppelingsregels

## Introductie

In NocoBase zijn koppelingsregels een mechanisme om het interactieve gedrag van frontend-interface-elementen te beheren. Ze stellen u in staat om de weergave en gedragslogica van blokken, velden en acties in de interface aan te passen op basis van verschillende voorwaarden, wat resulteert in een flexibele, low-code interactieve ervaring. Deze functionaliteit wordt continu verder ontwikkeld en geoptimaliseerd.

Door koppelingsregels te configureren, kunt u onder andere het volgende bereiken:

-   Het verbergen/tonen van bepaalde blokken op basis van de huidige gebruikersrol. Verschillende rollen zien blokken met verschillende gegevensbereiken; zo zien beheerders blokken met volledige informatie, terwijl gewone gebruikers alleen blokken met basisinformatie kunnen zien.
-   Automatisch andere veldwaarden invullen of resetten wanneer een optie in een formulier wordt geselecteerd.
-   Bepaalde invoervelden uitschakelen wanneer een optie in een formulier wordt geselecteerd.
-   Bepaalde invoervelden als verplicht instellen wanneer een optie in een formulier wordt geselecteerd.
-   Beteren of actieknoppen onder bepaalde voorwaarden zichtbaar of klikbaar zijn.

## Voorwaardeconfiguratie

![20251029114532](https://static-docs.nocobase.com/20251029114532.png)

### Variabele aan de linkerkant

De variabele aan de linkerkant in een voorwaarde wordt gebruikt om het "oordeelobject" in de koppelingsregel te definiëren. De voorwaarde wordt geëvalueerd op basis van de waarde van deze variabele om te bepalen of de koppelingsactie moet worden geactiveerd.

Selecteerbare variabelen zijn onder andere:

-   Velden in de context, zoals `Huidig Formulier/xxx`, `Huidige Record/xxx`, `Huidige Pop-up Record/xxx`, enz.
-   Globale systeemvariabelen, zoals `Huidige Gebruiker`, `Huidige Rol`, enz., geschikt voor dynamische controle op basis van gebruikersidentiteit, rechten en andere informatie.
    > ✅ De beschikbare opties voor de variabele aan de linkerkant worden bepaald door de context van het blok. Gebruik de variabele aan de linkerkant op een zinvolle manier, afhankelijk van uw bedrijfsbehoeften:
    >
    > -   `Huidige Gebruiker` vertegenwoordigt de informatie van de momenteel ingelogde gebruiker.
    > -   `Huidig Formulier` vertegenwoordigt de realtime ingevoerde waarden in het formulier.
    > -   `Huidige Record` vertegenwoordigt de opgeslagen recordwaarde, zoals een rijrecord in een tabel.

### Operator

De operator wordt gebruikt om de logica voor de voorwaardelijke beoordeling in te stellen, d.w.z. hoe de variabele aan de linkerkant wordt vergeleken met de waarde aan de rechterkant. Verschillende typen variabelen aan de linkerkant ondersteunen verschillende operators. Veelvoorkomende typen operators zijn als volgt:

-   **Teksttype**: `$includes`, `$eq`, `$ne`, `$empty`, `$notEmpty`, enz.
-   **Numeriek type**: `$eq`, `$gt`, `$lt`, `$gte`, `$lte`, enz.
-   **Booleaans type**: `$isTruly`, `$isFalsy`
-   **Arraytype**: `$match`, `$anyOf`, `$empty`, `$notEmpty`, enz.

> ✅ Het systeem zal automatisch een lijst met beschikbare operators aanbevelen op basis van het type variabele aan de linkerkant, om zo een logische configuratie te garanderen.

### Waarde aan de rechterkant

Wordt gebruikt voor vergelijking met de variabele aan de linkerkant en is de referentiewaarde voor het bepalen of aan de voorwaarde is voldaan.

Ondersteunde inhoud omvat:

-   Constante waarden: Voer vaste getallen, tekst, datums, enz. in;
-   Contextvariabelen: zoals andere velden in het huidige formulier, de huidige record, enz.;
-   Systeemvariabelen: zoals de huidige gebruiker, huidige tijd, huidige rol, enz.

> ✅ Het systeem past automatisch de invoermethode voor de rechterwaarde aan op basis van het type variabele aan de linkerkant, bijvoorbeeld:
>
> -   Wanneer de linkerkant een "Keuzeveld" is, wordt de bijbehorende keuzeselector weergegeven;
> -   Wanneer de linkerkant een "Datumveld" is, wordt een datumkiezer weergegeven;
> -   Wanneer de linkerkant een "Tekstveld" is, wordt een tekstinvoerveld weergegeven.

> 💡 Door flexibel gebruik te maken van de rechterwaarden (vooral dynamische variabelen), kunt u koppelingslogica opbouwen die gebaseerd is op de huidige gebruiker, de huidige gegevensstatus en de context, wat resulteert in een krachtigere interactieve ervaring.

## Logica voor regeluitvoering

### Voorwaardelijke activering

Wanneer aan de voorwaarde in een regel is voldaan (optioneel), wordt de onderstaande eigenschapswijzigingsactie automatisch uitgevoerd. Als er geen voorwaarde is ingesteld, wordt de regel standaard als altijd voldaan beschouwd en wordt de eigenschapswijzigingsactie automatisch uitgevoerd.

### Meerdere regels

U kunt meerdere koppelingsregels voor een formulier configureren. Wanneer aan de voorwaarden van meerdere regels tegelijkertijd wordt voldaan, zal het systeem de resultaten uitvoeren in de volgorde van de regels, van de eerste naar de laatste, wat betekent dat het laatste resultaat de uiteindelijke standaard zal zijn.
Voorbeeld: Regel 1 stelt een veld in op "Uitgeschakeld" en Regel 2 stelt het veld in op "Bewerkbaar". Als aan de voorwaarden van beide regels is voldaan, wordt het veld "Bewerkbaar".

> De uitvoeringsvolgorde van meerdere regels is cruciaal. Zorg ervoor dat u bij het ontwerpen van regels hun prioriteiten en onderlinge relaties duidelijk definieert om conflicten te voorkomen.

## Regelbeheer

De volgende bewerkingen kunnen op elke regel worden uitgevoerd:

-   Aangepaste naamgeving: Geef de regel een gemakkelijk te begrijpen naam voor beheer en identificatie.
-   Sorteren: Pas de volgorde aan op basis van de uitvoeringsprioriteit van de regels, om ervoor te zorgen dat het systeem ze in de juiste volgorde verwerkt.
-   Verwijderen: Verwijder regels die niet langer nodig zijn.
-   Inschakelen/Uitschakelen: Schakel een regel tijdelijk uit zonder deze te verwijderen. Dit is handig in scenario's waarin een regel tijdelijk gedeactiveerd moet worden.
-   Regel dupliceren: Maak een nieuwe regel door een bestaande te kopiëren, om herhaalde configuratie te voorkomen.

## Over variabelen

Bij het toewijzen van veldwaarden en het configureren van voorwaarden worden zowel constanten als variabelen ondersteund. De lijst met variabelen varieert afhankelijk van de locatie van het blok. Door variabelen verstandig te kiezen en te gebruiken, kunt u flexibeler voldoen aan de bedrijfsbehoeften. Voor meer informatie over variabelen, zie [Variabelen](/interface-builder/variables).

## Blokkoppelingsregels

Blokkoppelingsregels maken dynamische controle van de weergave van een blok mogelijk op basis van systeemvariabelen (zoals de huidige gebruiker, rol) of contextvariabelen (zoals de huidige pop-up record). Een beheerder kan bijvoorbeeld volledige orderinformatie bekijken, terwijl een klantenservicemedewerker alleen specifieke ordergegevens kan zien. Via blokkoppelingsregels kunt u corresponderende blokken configureren op basis van rollen, en binnen die blokken verschillende velden, actieknoppen en gegevensbereiken instellen. Wanneer de ingelogde rol de doelrol is, zal het systeem het corresponderende blok weergeven. Het is belangrijk op te merken dat blokken standaard worden weergegeven, dus u moet meestal de logica definiëren voor het verbergen van het blok.

👉 Voor details, zie: [Blok/Blokkoppelingsregels](/interface-builder/blocks/block-settings/block-linkage-rule)

## Veldkoppelingsregels

Veldkoppelingsregels worden gebruikt om de status van velden in een formulier of detailblok dynamisch aan te passen op basis van gebruikersacties, voornamelijk inclusief:

-   Het beheren van de **weergave/verbergen** status van een veld
-   Instellen of een veld **verplicht** is
-   Een **waarde toewijzen**
-   Het uitvoeren van JavaScript om aangepaste bedrijfslogica af te handelen

👉 Voor details, zie: [Blok/Veldkoppelingsregels](/interface-builder/blocks/block-settings/field-linkage-rule)

## Actiekoppelingsregels

Actiekoppelingsregels ondersteunen momenteel het beheren van actiegedrag, zoals verbergen/uitschakelen, op basis van contextvariabelen zoals de huidige recordwaarde en het huidige formulier, evenals globale variabelen.

👉 Voor details, zie: [Actie/Koppelingsregels](/interface-builder/actions/action-settings/linkage-rule)