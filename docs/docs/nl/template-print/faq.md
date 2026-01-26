:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

## Veelvoorkomende problemen en oplossingen

### 1. Lege kolommen en cellen in Excel-sjablonen verdwijnen in de gerenderde resultaten

**Probleembeschrijving**: Als een cel in een Excel-sjabloon geen inhoud of opmaak heeft, kan deze tijdens het renderen worden verwijderd, waardoor de cel ontbreekt in het uiteindelijke document.

**Oplossingen**:

- **Vul een achtergrondkleur in**: Geef lege cellen in het doelgebied een achtergrondkleur. Zo blijven de cellen zichtbaar tijdens het renderproces.
- **Voeg spaties toe**: Voeg een spatie toe in lege cellen. Zelfs zonder inhoud blijft de celstructuur dan behouden.
- **Voeg randen toe**: Voeg randstijlen toe aan de tabel om de celgrenzen te versterken en te voorkomen dat cellen verdwijnen tijdens het renderen.

**Voorbeeld**:

Stel in het Excel-sjabloon een lichtgrijze achtergrond in voor alle doelcellen en voeg spaties toe in lege cellen.

### 2. Samengevoegde cellen werken niet correct in de uitvoer

**Probleembeschrijving**: Wanneer u de lusfunctionaliteit gebruikt om tabellen uit te voeren, kunnen samengevoegde cellen in het sjabloon leiden tot afwijkende renderresultaten, zoals verloren samenvoegeffecten of verkeerde uitlijning van gegevens.

**Oplossingen**:

- **Vermijd het gebruik van samengevoegde cellen**: Probeer het gebruik van samengevoegde cellen in tabellen die met een lus worden uitgevoerd te vermijden, om een correcte weergave van de gegevens te garanderen.
- **Gebruik 'Centreren over selectie'**: Als u tekst horizontaal wilt centreren over meerdere cellen, gebruik dan de functie 'Centreren over selectie' in plaats van cellen samen te voegen.
- **Beperk de posities van samengevoegde cellen**: Als samengevoegde cellen noodzakelijk zijn, voeg dan alleen cellen boven of rechts van de tabel samen. Vermijd het samenvoegen van cellen onder of links van de tabel om te voorkomen dat het samenvoegeffect verloren gaat tijdens het renderen.

### 3. Inhoud onder een lusrendergebied zorgt voor opmaakfouten

**Probleembeschrijving**: Als in Excel-sjablonen andere inhoud (bijv. een ordersamenvatting, notities) zich onder een lusgebied bevindt dat dynamisch groeit op basis van gegevensitems (bijv. orderdetails), zullen de door de lus gegenereerde gegevensrijen tijdens het renderen naar beneden uitbreiden. Dit overschrijft of verschuift de statische inhoud eronder, wat leidt tot opmaakfouten en overlappende inhoud in het uiteindelijke document.

**Oplossingen**:

  * **Pas de lay-out aan: plaats het lusgebied onderaan**: Dit is de meest aanbevolen methode. Plaats het tabelgebied dat met een lus moet worden gerenderd onderaan het hele werkblad. Verplaats alle informatie die oorspronkelijk eronder stond (samenvatting, handtekeningen, etc.) naar boven het lusgebied. Op deze manier kunnen lusgegevens vrij naar beneden uitbreiden zonder andere elementen te beïnvloeden.
  * **Reserveer voldoende lege rijen**: Als inhoud onder het lusgebied moet worden geplaatst, schat dan het maximale aantal rijen dat de lus kan genereren en voeg handmatig voldoende lege rijen in als buffer tussen het lusgebied en de inhoud eronder. Deze methode brengt echter risico's met zich mee: als de werkelijke gegevens het geschatte aantal rijen overschrijden, zal het probleem opnieuw optreden.
  * **Gebruik Word-sjablonen**: Als de lay-outvereisten complex zijn en niet kunnen worden opgelost door de Excel-structuur aan te passen, overweeg dan om Word-documenten als sjabloon te gebruiken. Tabellen in Word verschuiven de inhoud eronder automatisch wanneer het aantal rijen toeneemt, zonder problemen met overlappende inhoud. Dit maakt Word geschikter voor het genereren van dergelijke dynamische documenten.

**Voorbeeld**:

**Verkeerde aanpak**: De 'Ordersamenvatting' direct onder de 'Orderdetails'-tabel plaatsen die met een lus wordt gegenereerd.
![20250820080712](https://static-docs.nocobase.com/20250820080712.png)

**Juiste aanpak 1 (Lay-out aanpassen)**: Verplaats de 'Ordersamenvatting' boven de 'Orderdetails'-tabel, zodat het lusgebied het onderste element van de pagina wordt.
![20250820082226](https://static-docs.nocobase.com/20250820082226.png)

**Juiste aanpak 2 (Lege rijen reserveren)**: Reserveer veel lege rijen tussen 'Orderdetails' en 'Ordersamenvatting' om ervoor te zorgen dat de lusinhoud voldoende uitbreidingsruimte heeft.
![20250820081510](https://static-docs.nocobase.com/20250820081510.png)

**Juiste aanpak 3**: Gebruik Word-sjablonen.

### 4. Foutmeldingen bij het renderen van sjablonen

**Probleembeschrijving**: Tijdens het renderen van een sjabloon geeft het systeem foutmeldingen weer, wat leidt tot een mislukte rendering.

**Mogelijke oorzaken**:

- **Fouten in de plaatshouder**: Plaatshoudernamen komen niet overeen met gegevenssetvelden of bevatten syntaxisfouten.
- **Ontbrekende gegevens**: De gegevensset mist velden waarnaar in het sjabloon wordt verwezen.
- **Onjuist gebruik van de formatter**: Formatter-parameters zijn onjuist of de opmaaktypen worden niet ondersteund.

**Oplossingen**:

- **Controleer de plaatshouders**: Zorg ervoor dat de namen van de plaatshouders in het sjabloon overeenkomen met de veldnamen in de gegevensset en dat de syntaxis correct is.
- **Valideer de gegevensset**: Controleer of de gegevensset alle velden bevat waarnaar in het sjabloon wordt verwezen, en of de gegevensindelingen correct zijn.
- **Pas de formatters aan**: Controleer de gebruiksmethoden van de formatter, zorg ervoor dat de parameters correct zijn en gebruik ondersteunde opmaaktypen.

**Voorbeeld**:

**Onjuist sjabloon**:
```
Order ID: {d.orderId}
Order Date: {d.orderDate:format('YYYY/MM/DD')}
Total Amount: {d.totalAmount:format('0.00')}
```

**Gegevensset**:
```json
{
  "orderId": "A123456789",
  "orderDate": "2025-01-01T10:00:00Z"
  // Missing totalAmount field
}
```

**Oplossing**: Voeg het veld `totalAmount` toe aan de gegevensset of verwijder de verwijzing naar `totalAmount` uit het sjabloon.