---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::



# IP-beperkingen

## Introductie

NocoBase stelt beheerders in staat om IP-adressen van gebruikers op een witte of zwarte lijst te plaatsen. Hiermee kunt u ongeautoriseerde externe netwerkverbindingen beperken of bekende kwaadaardige IP-adressen blokkeren, wat de beveiligingsrisico's verlaagt. Daarnaast kunt u als beheerder de logboeken van geweigerde toegang raadplegen om risicovolle IP-adressen te identificeren.

## Configuratieregels

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### IP-filtermodi

- **Zwarte lijst**: Wanneer het IP-adres van een gebruiker overeenkomt met een IP-adres in de lijst, zal het systeem de toegang **weigeren**; niet-overeenkomende IP-adressen worden standaard **toegestaan**.
- **Witte lijst**: Wanneer het IP-adres van een gebruiker overeenkomt met een IP-adres in de lijst, zal het systeem de toegang **toestaan**; niet-overeenkomende IP-adressen worden standaard **geweigerd**.

### IP-lijst

Hier definieert u de IP-adressen die toegang tot het systeem mogen hebben of juist geweigerd worden. De specifieke werking hiervan hangt af van de gekozen IP-filtermodus. U kunt IP-adressen of CIDR-netwerksegmenten invoeren; meerdere adressen scheidt u met een komma of een regeleinde.

## Logboeken raadplegen

Nadat een gebruiker de toegang is geweigerd, wordt het IP-adres van de toegang weggeschreven naar de systeemlogboeken. U kunt het bijbehorende logbestand downloaden voor analyse.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Voorbeeld van een logboek:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Configuratieaanbevelingen

### Aanbevelingen voor de zwarte lijstmodus

- Voeg bekende kwaadaardige IP-adressen toe om potentiële netwerkaanvallen te voorkomen.
- Controleer en update de zwarte lijst regelmatig. Verwijder hierbij ongeldige of niet langer te blokkeren IP-adressen.

### Aanbevelingen voor de witte lijstmodus

- Voeg vertrouwde interne netwerk-IP-adressen toe (zoals kantoornetwerksegmenten) om veilige toegang tot kernsystemen te garanderen.
- Vermijd het opnemen van dynamisch toegewezen IP-adressen in de witte lijst, om onderbrekingen van de toegang te voorkomen.

### Algemene aanbevelingen

- Gebruik CIDR-netwerksegmenten om de configuratie te vereenvoudigen. Voeg bijvoorbeeld `192.168.0.0/24` toe in plaats van individuele IP-adressen.
- Maak regelmatig een back-up van de IP-lijstconfiguraties, zodat u bij foutieve handelingen of systeemstoringen snel kunt herstellen.
- Controleer regelmatig de toegangslogboeken om afwijkende IP-adressen te identificeren en pas de zwarte of witte lijst tijdig aan.