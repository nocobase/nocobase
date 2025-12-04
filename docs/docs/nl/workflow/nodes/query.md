:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Gegevens opvragen

Dit wordt gebruikt om gegevensrecords op te vragen en op te halen uit een `collectie` die aan specifieke voorwaarden voldoen. U kunt configureren om één record of meerdere records op te vragen. Het `query`-resultaat kan als variabele worden gebruikt in volgende `workflow`-stappen (nodes). Bij het opvragen van meerdere records is het resultaat een array. Als het `query`-resultaat leeg is, kunt u kiezen of de volgende stappen wel of niet worden uitgevoerd.

## Node aanmaken

In de `workflow`-configuratie-interface klikt u op de plusknop ("+") in de flow om een "Gegevens opvragen"-node toe te voegen:

![Add Query Data Node](https://static-docs.nocobase.com/c1ef2b851b437806faf7a39c6ab9d33a.png)

## Node-configuratie

![Query Node Configuration](https://static-docs.nocobase.com/20240520131324.png)

### Collectie

Selecteer de `collectie` waaruit u gegevens wilt opvragen.

### Resultaattype

Het resultaattype is onderverdeeld in "Enkel record" en "Meerdere records":

-   Enkel record: Het resultaat is een object, dit is alleen het eerst overeenkomende record, of `null`.
-   Meerdere records: Het resultaat is een array met records die aan de voorwaarden voldoen. Als er geen records overeenkomen, is het een lege array. U kunt deze één voor één verwerken met behulp van een lus-node (Loop node).

### Filtervoorwaarden

Vergelijkbaar met de filtervoorwaarden bij een reguliere `collectie`-query, kunt u de contextvariabelen van de `workflow` gebruiken.

### Sorteren

Bij het opvragen van één of meerdere records kunt u sorteerregels gebruiken om het gewenste resultaat te bepalen. Om bijvoorbeeld het meest recente record op te vragen, kunt u sorteren op het veld "Aanmaaktijd" in aflopende volgorde.

### Paginering

Wanneer de resultatenset erg groot kan zijn, kunt u paginering gebruiken om het aantal `query`-resultaten te beheren. Om bijvoorbeeld de 10 meest recente records op te vragen, kunt u sorteren op het veld "Aanmaaktijd" in aflopende volgorde en vervolgens de paginering instellen op 1 pagina met 10 records.

### Omgaan met lege resultaten

In de modus voor één record, als er geen gegevens aan de voorwaarden voldoen, is het `query`-resultaat `null`. In de modus voor meerdere records is het een lege array (`[]`). U kunt naar wens aanvinken "Workflow afsluiten wanneer `query`-resultaat leeg is". Indien aangevinkt en het `query`-resultaat is leeg, worden volgende `workflow`-stappen niet uitgevoerd en wordt de `workflow` voortijdig afgesloten met een mislukte status.