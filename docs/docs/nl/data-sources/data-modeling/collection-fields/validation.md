:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# Veldvalidatie
Om de nauwkeurigheid, veiligheid en consistentie van uw collecties te waarborgen, biedt NocoBase de functionaliteit voor veldvalidatie. Deze functionaliteit bestaat uit twee hoofdonderdelen: het configureren van regels en het toepassen van validatieregels.

## Regelconfiguratie
![20250819181342](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819181342.png)

NocoBase systeemvelden integreren [Joi](https://joi.dev/api/)-regels, met ondersteuning als volgt:

### Teksttype (String)
Joi teksttypen komen overeen met de volgende NocoBase veldtypen: Tekst (één regel), Tekst (meerdere regels), Telefoonnummer, E-mailadres, URL, Wachtwoord en UUID.
#### Algemene regels
- Minimale lengte
- Maximale lengte
- Lengte
- Reguliere expressie
- Verplicht

#### E-mailadres
![20250819192011](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192011.png)
[Bekijk meer opties](https://joi.dev/api/?v=17.13.3#stringemailoptions)

#### URL
![20250819192409](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192409.png)
[Bekijk meer opties](https://joi.dev/api/?v=17.13.3#stringurioptions)

#### UUID
![20250819192731](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819192731.png)
[Bekijk meer opties](https://joi.dev/api/?v=17.13.3#stringguid---aliases-uuid)

### Getaltype (Number)
Joi getaltypen komen overeen met de volgende NocoBase veldtypen: Geheel getal, Getal en Percentage.
#### Algemene regels
- Groter dan
- Kleiner dan
- Maximale waarde
- Minimale waarde
- Meervoud van

#### Geheel getal
Naast de algemene regels ondersteunen velden voor gehele getallen aanvullend [validatie van gehele getallen](https://joi.dev/api/?v=17.13.3#numberinteger) en [validatie van onveilige gehele getallen](https://joi.dev/api/?v=17.13.3#numberunsafeenabled).
![20250819193758](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193758.png)

#### Getal & Percentage
Naast de algemene regels ondersteunen velden voor getallen en percentages aanvullend [precisievalidatie](https://joi.dev/api/?v=17.13.3#numberinteger).
![20250819193954](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819193954.png)

### Datumtype
Joi datumtypen komen overeen met de volgende NocoBase veldtypen: Datum (met tijdzone), Datum (zonder tijdzone), Alleen datum en Unix-tijdstempel.

Ondersteunde validatieregels:
- Groter dan
- Kleiner dan
- Maximale waarde
- Minimale waarde
- Tijdstempelformaat validatie
- Verplicht

### Relatievelden
Relatievelden ondersteunen alleen 'verplicht'-validatie. Houd er rekening mee dat de 'verplicht'-validatie voor relatievelden momenteel niet wordt ondersteund in scenario's met subformulieren of subtabellen.
![20250819184344](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819184344.png)

## Toepassing van validatieregels
Nadat u veldregels hebt geconfigureerd, worden de bijbehorende validatieregels geactiveerd wanneer u gegevens toevoegt of wijzigt.
![20250819201027](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819201027.png)

Validatieregels zijn ook van toepassing op subtabellen en subformuliercomponenten:
![20250819202514](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202514.png)

![20250819202357](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819202357.png)

Houd er rekening mee dat in scenario's met subformulieren of subtabellen de 'verplicht'-validatie voor relatievelden niet van kracht is.
![20250819203016](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203016.png)

## Verschillen met client-side veldvalidatie
Client-side en server-side veldvalidatie zijn van toepassing in verschillende scenario's. Beide vertonen aanzienlijke verschillen in implementatie en het moment waarop regels worden geactiveerd, en moeten daarom afzonderlijk worden beheerd.

### Verschillen in configuratiemethode
- **Client-side validatie**: Configureer regels in bewerkingsformulieren (zoals weergegeven in de onderstaande afbeelding)
- **Server-side veldvalidatie**: Stel veldregels in via Gegevensbron → Collectieconfiguratie
![20250819203836](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203836.png)

![20250819203845](https://nocobase-docs.oss-cn-beijing.aliyuncs.com/20250819203845.png)

### Verschillen in het moment van validatieactivering
- **Client-side validatie**: Activeert de validatie in realtime terwijl gebruikers velden invullen, en toont onmiddellijk foutmeldingen.
- **Server-side veldvalidatie**: Valideert aan de serverzijde vóórdat de gegevens worden opgeslagen, nadat de gegevens zijn ingediend. Foutmeldingen worden via API-responses teruggestuurd.
- **Toepassingsbereik**: Server-side veldvalidatie is niet alleen van kracht bij het indienen van formulieren, maar wordt ook geactiveerd in alle scenario's die betrekking hebben op het toevoegen of wijzigen van gegevens, zoals workflows en gegevensimport.
- **Foutmeldingen**: Client-side validatie ondersteunt aangepaste foutmeldingen, terwijl server-side validatie momenteel geen aangepaste foutmeldingen ondersteunt.