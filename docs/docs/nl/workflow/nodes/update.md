:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gegevens bijwerken

Gebruikt voor het bijwerken van gegevens in een collectie die voldoen aan specifieke voorwaarden.

De configuratie voor de collectie en de veldtoewijzing is hetzelfde als bij de 'Record aanmaken' node. Het belangrijkste verschil van de 'Gegevens bijwerken' node is de toevoeging van filtervoorwaarden en de verplichting om een bijwerkmodus te kiezen. Bovendien geeft de 'Gegevens bijwerken' node het aantal succesvol bijgewerkte rijen terug. Dit resultaat is alleen zichtbaar in de uitvoeringsgeschiedenis en kan niet als variabele in latere nodes worden gebruikt.

## Node aanmaken

In de workflow configuratie-interface klikt u op de plusknop ('+') in de workflow om een 'Gegevens bijwerken' node toe te voegen:

![更新数据_添加](https://static-docs.nocobase.com/9ff24d7bc173b3a71decc1f70ca9fb66.png)

## Node configuratie

![更新节点_节点配置](https://static-docs.nocobase.com/98e0f941c7275fc835f08260d0b2e86.png)

### Collectie

Selecteer de collectie waarvan u de gegevens wilt bijwerken.

### Bijwerkmodus

Er zijn twee bijwerkmodi:

*   **Bulk bijwerken**: Deze modus activeert geen collectie-events voor elk afzonderlijk bijgewerkt record. Dit resulteert in betere prestaties en is ideaal voor het bijwerken van grote hoeveelheden gegevens.
*   **Eén voor één bijwerken**: Deze modus activeert wel collectie-events voor elk afzonderlijk bijgewerkt record. Houd er echter rekening mee dat dit prestatieproblemen kan veroorzaken bij grote hoeveelheden gegevens, dus gebruik deze modus met voorzichtigheid.

De keuze van de bijwerkmodus hangt doorgaans af van de doelgegevens en of er andere workflow-events geactiveerd moeten worden. Als u één record bijwerkt op basis van de primaire sleutel, raden we 'Eén voor één bijwerken' aan. Voor het bijwerken van meerdere records op basis van specifieke voorwaarden is 'Bulk bijwerken' de aanbevolen optie.

### Filtervoorwaarden

Net als bij de filtervoorwaarden in een reguliere collectiequery, kunt u hier de contextvariabelen van de workflow gebruiken.

### Veldwaarden

Net als bij de veldtoewijzing in de 'Record aanmaken' node, kunt u hier contextvariabelen uit de workflow gebruiken of handmatig statische waarden invoeren.

Let op: Gegevens die door de 'Gegevens bijwerken' node in een workflow worden bijgewerkt, verwerken de informatie van 'Laatst gewijzigd door' niet automatisch. U dient de waarde van dit veld zelf te configureren, afhankelijk van uw behoeften.

## Voorbeeld

Stel bijvoorbeeld dat u bij het aanmaken van een nieuw 'Artikel' automatisch het veld 'Aantal artikelen' in de 'Artikelcategorie' collectie wilt bijwerken. Dit kunt u realiseren met de 'Gegevens bijwerken' node:

![更新节点_示例_节点配置](https://static-docs.nocobase.com/98e0f941c7275fc835f08260d0b2e86.png)

Nadat de workflow is geactiveerd, wordt het veld 'Aantal artikelen' in de 'Artikelcategorie' collectie automatisch bijgewerkt naar het huidige aantal artikelen + 1.