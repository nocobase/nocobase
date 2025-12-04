:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Expressiecollectie

## Een "expressiecollectie"-sjabloon aanmaken

Voordat u dynamische expressie-operatieknooppunten binnen een workflow kunt gebruiken, is het essentieel om eerst een "expressie"-sjablooncollectie aan te maken via de collectiebeheertool. Deze collectie dient als opslagplaats voor verschillende expressies.

![Een expressiecollectie aanmaken](https://static-docs.nocobase.com/33afe3369a1ea7943f12a04d9d4443ce.png)

## Expressiegegevens invoeren

Vervolgens kunt u een tabelblok instellen en hierin verschillende formule-items invoeren in de sjablooncollectie. Elke rij in de "expressie"-sjablooncollectie kan worden beschouwd als een rekenregel die is ontworpen voor een specifiek datamodel binnen de collectie. U kunt verschillende velden uit de datamodellen van diverse collecties gebruiken als variabelen, waarbij u unieke expressies opstelt als rekenregels. Bovendien kunt u, indien nodig, verschillende reken-engines benutten.

![Expressiegegevens invoeren](https://static-docs.nocobase.com/761047f8daabacccbc6a924a73564093.png)

:::info{title=Tip}
Zodra de formules zijn opgesteld, moeten ze worden gekoppeld aan de bedrijfsgegevens. Het direct koppelen van elke rij bedrijfsgegevens aan formulegegevens kan omslachtig zijn, daarom is een veelgebruikte aanpak om een metadatacollectie, vergelijkbaar met een classificatiecollectie, te gebruiken om een veel-op-één (of één-op-één) relatie te creëren met de formulecollectie. Vervolgens worden de bedrijfsgegevens gekoppeld aan de geclassificeerde metadata in een veel-op-één relatie. Deze aanpak stelt u in staat om eenvoudig de relevante geclassificeerde metadata te specificeren bij het aanmaken van bedrijfsgegevens, waardoor het gemakkelijk wordt om de corresponderende formulegegevens te vinden en te gebruiken via het vastgestelde associatiepad.
:::

## Relevante gegevens laden in het proces

Neem als voorbeeld het aanmaken van een workflow die wordt geactiveerd door een collectiegebeurtenis. Wanneer een order wordt aangemaakt, moet de trigger de bijbehorende productgegevens samen met de productgerelateerde expressiegegevens vooraf laden:

![Collectiegebeurtenis_Triggerconfiguratie](https://static-docs.nocobase.com/f181f75b10007afd5de068f3458d2e04.png)