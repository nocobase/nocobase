:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Collectie-gebeurtenissen

## Introductie

Triggers van het collectie-gebeurtenis type luisteren naar aanmaak-, update- en verwijdergebeurtenissen op een collectie. Wanneer een data-operatie op die collectie plaatsvindt en voldoet aan de geconfigureerde voorwaarden, wordt de bijbehorende workflow geactiveerd. Denk bijvoorbeeld aan scenario's zoals het aftrekken van productvoorraad na het aanmaken van een nieuwe bestelling, of het wachten op handmatige beoordeling na het toevoegen van een nieuwe opmerking.

## Basisgebruik

Er zijn verschillende soorten collectiewijzigingen:

1. Na het aanmaken van data.
2. Na het bijwerken van data.
3. Na het aanmaken of bijwerken van data.
4. Na het verwijderen van data.

![数据表事件_触发时机选择](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

U kunt het triggermoment kiezen op basis van verschillende bedrijfsbehoeften. Wanneer de geselecteerde wijziging het bijwerken van de collectie omvat, kunt u ook de gewijzigde velden specificeren. De triggerconditie wordt alleen voldaan wanneer de geselecteerde velden wijzigen. Als er geen velden zijn geselecteerd, betekent dit dat een wijziging in elk veld de workflow kan activeren.

![数据表事件_发生变动的字段选择](https://static-docs.nocobase.com/874a1475f01298b3c00267b2b4674611.png)

Meer specifiek kunt u conditieregels configureren voor elk veld van de triggerende datarow. De trigger wordt alleen geactiveerd wanneer de velden aan de overeenkomstige voorwaarden voldoen.

![数据表事件_配置数据满足的条件](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Nadat een collectie-gebeurtenis is geactiveerd, wordt de datarow die de gebeurtenis heeft gegenereerd, geïnjecteerd in het uitvoeringsplan als triggercontextdata, om door volgende knooppunten in de workflow als variabelen te worden gebruikt. Wanneer volgende knooppunten echter de relatievelden van deze data willen gebruiken, moet u eerst het voorladen van de relatiegegevens configureren. De geselecteerde relatiegegevens worden samen met de trigger in de context geïnjecteerd en kunnen hiërarchisch worden geselecteerd en gebruikt.

## Gerelateerde tips

### Triggeren door bulkdata-operaties wordt momenteel niet ondersteund

Collectie-gebeurtenissen ondersteunen momenteel geen triggering door bulkdata-operaties. Wanneer u bijvoorbeeld een artikel aanmaakt en tegelijkertijd meerdere tags voor dat artikel toevoegt (een-op-veel relatiegegevens), wordt alleen de workflow voor het aanmaken van het artikel geactiveerd. De gelijktijdig aangemaakte meerdere tags zullen de workflow voor het aanmaken van tags niet activeren. Bij het koppelen of toevoegen van veel-op-veel relatiegegevens wordt de workflow voor de tussenliggende collectie ook niet geactiveerd.

### Data-operaties buiten de applicatie activeren geen gebeurtenissen

Operaties op collecties via HTTP API-aanroepen naar de interface van de applicatie kunnen ook overeenkomstige gebeurtenissen activeren. Echter, als datamutaties rechtstreeks via database-operaties worden uitgevoerd in plaats van via de NocoBase-applicatie, kunnen de overeenkomstige gebeurtenissen niet worden geactiveerd. Native databasetriggers worden bijvoorbeeld niet gekoppeld aan workflows in de applicatie.

Bovendien is het gebruik van de SQL-actieknoop om de database te bewerken gelijk aan directe database-operaties en zal dit geen collectie-gebeurtenissen activeren.

### Externe gegevensbronnen

Workflows ondersteunen externe gegevensbronnen sinds versie `0.20`. Als u een externe gegevensbron plugin gebruikt en de collectie-gebeurtenis is geconfigureerd voor een externe gegevensbron, kunnen de overeenkomstige collectie-gebeurtenissen worden geactiveerd, zolang de data-operaties op die gegevensbron binnen de applicatie worden uitgevoerd (zoals aanmaak door gebruikers, updates en workflow data-operaties). Echter, als de datamutaties via andere systemen of rechtstreeks in de externe database worden aangebracht, kunnen collectie-gebeurtenissen niet worden geactiveerd.

## Voorbeeld

Laten we als voorbeeld het scenario nemen van het berekenen van de totaalprijs en het aftrekken van de voorraad nadat een nieuwe bestelling is aangemaakt.

Eerst maken we een producten-collectie en een bestellingen-collectie aan, met de volgende datamodellen:

| Veldnaam | Veldtype |
| -------- | -------- |
| Productnaam | Enkele regel tekst |
| Prijs | Getal |
| Voorraad | Heel getal |

| Veldnaam | Veldtype |
| -------- | -------------- |
| Bestelnummer | Volgnummer |
| Besteld product | Veel-op-een (Producten) |
| Totaalprijs bestelling | Getal |

En voeg enkele basis productdata toe:

| Productnaam | Prijs | Voorraad |
| ------------- | ---- | ---- |
| iPhone 14 Pro | 7999 | 10 |
| iPhone 13 Pro | 5999 | 0 |

Maak vervolgens een workflow aan op basis van de bestellingen-collectie-gebeurtenis:

![数据表事件_示例_新增订单触发](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Hier zijn enkele van de configuratie-opties:

- Collectie: Selecteer de collectie "Bestellingen".
- Triggermoment: Selecteer "Na het aanmaken van data".
- Triggercondities: Leeg laten.
- Relatiegegevens voorladen: Vink "Producten" aan.

Configureer vervolgens andere knooppunten volgens de workflowlogica: controleer of de productvoorraad groter is dan 0. Als dit het geval is, trek de voorraad af; anders is de bestelling ongeldig en moet deze worden verwijderd:

![数据表事件_示例_新增订单流程编排](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

De configuratie van knooppunten wordt gedetailleerd uitgelegd in de documentatie voor specifieke knooppunttypen.

Schakel deze workflow in en test deze door een nieuwe bestelling aan te maken via de interface. Nadat u een bestelling voor "iPhone 14 Pro" heeft geplaatst, wordt de voorraad van het corresponderende product verminderd tot 9. Als een bestelling voor "iPhone 13 Pro" wordt geplaatst, wordt de bestelling verwijderd vanwege onvoldoende voorraad.

![数据表事件_示例_新增订单执行结果](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)