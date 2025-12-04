:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Geplande taak

## Introductie

Een geplande taak is een gebeurtenis die wordt geactiveerd door een tijdsvoorwaarde, en kent twee modi:

- Aangepaste tijd: Regelmatige, cron-achtige activering op basis van de systeemtijd.
- Tijdveld van een collectie: Activering wanneer de waarde van een tijdveld in een collectie wordt bereikt.

Wanneer het systeem het tijdstip (tot op de seconde nauwkeurig) bereikt dat voldoet aan de geconfigureerde activeringsvoorwaarden, wordt de bijbehorende workflow geactiveerd.

## Basisgebruik

### Een geplande taak aanmaken

Wanneer u een workflow aanmaakt in de workflowlijst, kiest u het type "Geplande taak":

![Een geplande taak aanmaken](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Aangepaste tijdmodus

Voor de reguliere modus moet u eerst de starttijd instellen op een willekeurig tijdstip (tot op de seconde nauwkeurig). De starttijd kan in de toekomst of in het verleden liggen. Wanneer de starttijd in het verleden ligt, wordt gecontroleerd of de tijd is verstreken op basis van de geconfigureerde herhalingsvoorwaarde. Als er geen herhalingsvoorwaarde is ingesteld en de starttijd in het verleden ligt, wordt de workflow niet langer geactiveerd.

Er zijn twee manieren om de herhalingsregel te configureren:

- Op interval: Activeert met een vast interval na de starttijd, zoals elk uur, elke 30 minuten, enz.
- Geavanceerde modus: Dit is volgens cron-regels, configureerbaar voor een cyclus die een vaste, regelgebaseerde datum en tijd bereikt.

Nadat u de herhalingsregel heeft geconfigureerd, kunt u ook een eindvoorwaarde instellen. Deze kan eindigen op een vast tijdstip of worden beperkt door het aantal keren dat de taak is uitgevoerd.

### Tijdveld van een collectie modus

Het gebruik van een tijdveld van een collectie om de starttijd te bepalen, is een activeringsmodus die reguliere geplande taken combineert met tijdvelden van collecties. Het gebruik van deze modus kan knooppunten in bepaalde processen vereenvoudigen en is ook intuïtiever qua configuratie. Als u bijvoorbeeld de status van achterstallige, onbetaalde bestellingen wilt wijzigen naar 'geannuleerd', kunt u eenvoudig een geplande taak in de modus 'Tijdveld van een collectie' configureren, waarbij u de starttijd instelt op 30 minuten na het aanmaken van de bestelling.

## Gerelateerde tips

### Geplande taken in een inactieve of uitgeschakelde status

Als aan de geconfigureerde tijdsvoorwaarde wordt voldaan, maar de gehele NocoBase-applicatieservice is inactief of uitgeschakeld, dan wordt de geplande taak die op dat tijdstip had moeten worden geactiveerd, gemist. Bovendien worden gemiste taken na het opnieuw opstarten van de service niet opnieuw geactiveerd. Daarom moet u bij gebruik mogelijk rekening houden met de afhandeling van dergelijke situaties of met alternatieve maatregelen.

### Aantal herhalingen

Wanneer de eindvoorwaarde 'op herhalingen' is geconfigureerd, wordt het totale aantal uitvoeringen van alle versies van dezelfde workflow berekend. Als een geplande taak bijvoorbeeld 10 keer is uitgevoerd in versie 1 en het aantal herhalingen is ook ingesteld op 10, dan wordt de workflow niet langer geactiveerd. Zelfs als deze naar een nieuwe versie wordt gekopieerd, wordt deze niet geactiveerd, tenzij het aantal herhalingen wordt gewijzigd naar een getal groter dan 10. Als de workflow echter als een nieuwe workflow wordt gekopieerd, wordt het aantal uitvoeringen opnieuw vanaf 0 geteld. Zonder de relevante configuratie te wijzigen, kan de nieuwe workflow nog 10 keer worden geactiveerd.

### Verschil tussen interval en geavanceerde modus in herhalingsregels

Het interval in de herhalingsregel is relatief ten opzichte van het tijdstip van de laatste activering (of de starttijd), terwijl de geavanceerde modus activeert op vaste tijdstippen. Als u bijvoorbeeld configureert dat de taak elke 30 minuten wordt geactiveerd, en de laatste activering was op 2021-09-01 12:01:23, dan zal de volgende activering plaatsvinden op 2021-09-01 12:31:23. De geavanceerde modus, oftewel cron-modus, is geconfigureerd om op vaste tijdstippen te activeren. U kunt bijvoorbeeld instellen dat de taak op minuut 01 en 31 van elk uur wordt geactiveerd.

## Voorbeeld

Stel dat we elke minuut willen controleren op bestellingen die meer dan 30 minuten na aanmaak nog niet betaald zijn, en hun status automatisch willen wijzigen naar 'geannuleerd'. We zullen dit met beide modi implementeren.

### Aangepaste tijdmodus

Maak een workflow aan op basis van een geplande taak. In de triggerconfiguratie kiest u de modus "Aangepaste tijd". Stel de starttijd in op een willekeurig tijdstip dat niet later is dan de huidige tijd. Kies "Elke minuut" voor de herhalingsregel en laat de eindvoorwaarde leeg:

![Geplande taak_Triggerconfiguratie_Aangepaste tijdmodus](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Configureer vervolgens andere knooppunten volgens de proceslogica. Bereken de tijd van 30 minuten geleden en wijzig de status van onbetaalde bestellingen die vóór dat tijdstip zijn aangemaakt naar 'geannuleerd':

![Geplande taak_Triggerconfiguratie_Aangepaste tijdmodus](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Nadat de workflow is ingeschakeld, wordt deze elke minuut geactiveerd vanaf de starttijd. De workflow berekent de tijd van 30 minuten geleden en gebruikt deze om de status van bestellingen die vóór dat tijdstip zijn aangemaakt, bij te werken naar 'geannuleerd'.

### Tijdveld van een collectie modus

Maak een workflow aan op basis van een geplande taak. In de triggerconfiguratie kiest u de modus "Tijdveld van een collectie". Selecteer de collectie "Bestellingen". Stel de starttijd in op 30 minuten na de aanmaaktijd van de bestelling en kies "Niet herhalen" voor de herhalingsregel:

![Geplande taak_Triggerconfiguratie_Tijdveld van een collectie modus_Trigger](https://static-docs.nocobase.com/d40b5aef57f42799d31cc5882dd94246.png)

Configureer vervolgens andere knooppunten volgens de proceslogica. Werk de status van de bestelling met de triggerdata-ID en de status "onbetaald" bij naar 'geannuleerd':

![Geplande taak_Triggerconfiguratie_Tijdveld van een collectie modus_Update knooppunt](https://static-docs.nocobase.com/491dde9df8f773f5b14a4fd8ceac9d3e.png)

In tegenstelling tot de aangepaste tijdmodus hoeft u hier de tijd van 30 minuten geleden niet te berekenen, omdat de triggerdata-context de corresponderende gegevensrij bevat die voldoet aan de tijdsvoorwaarde. U kunt dus direct de status van de betreffende bestelling bijwerken.