:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# NocoBase Beveiligingsgids

NocoBase legt de nadruk op de veiligheid van gegevens en applicaties, van functioneel ontwerp tot systeemimplementatie. Het platform beschikt over ingebouwde beveiligingsfuncties zoals gebruikersauthenticatie, toegangscontrole en gegevensversleuteling, en maakt tevens flexibele configuratie van beveiligingsbeleid mogelijk, afhankelijk van uw specifieke behoeften. Of het nu gaat om het beschermen van gebruikersgegevens, het beheren van toegangsrechten of het isoleren van ontwikkel- en productieomgevingen, NocoBase biedt praktische tools en oplossingen. Deze gids is bedoeld om u te begeleiden bij het veilig gebruiken van NocoBase, zodat u uw gegevens, applicaties en omgeving kunt beschermen en tegelijkertijd efficiënt gebruik kunt maken van de systeemfuncties.

## Gebruikersauthenticatie

Gebruikersauthenticatie wordt gebruikt om de identiteit van gebruikers te verifiëren, ongeautoriseerde toegang tot het systeem te voorkomen en misbruik van gebruikersidentiteiten te waarborgen.

### Token-sleutel

Standaard gebruikt NocoBase JWT (JSON Web Token) voor de authenticatie van server-side API's. U kunt de sleutel voor de Token instellen via de systeemomgevingsvariabele `APP_KEY`. Beheer de Token-sleutel van uw applicatie zorgvuldig om lekkage naar buiten toe te voorkomen. Houd er rekening mee dat als `APP_KEY` wordt gewijzigd, oude Tokens ook ongeldig worden.

### Token-beleid

NocoBase ondersteunt de volgende beveiligingsbeleidsregels voor gebruikers-Tokens:

| Configuratie-item              | Beschrijving                                                                                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sessie geldigheidsduur         | De maximale geldige tijd voor elke gebruikersaanmelding. Binnen de sessie geldigheidsduur wordt de Token automatisch bijgewerkt. Na de time-out moet de gebruiker opnieuw inloggen. |
| Token geldigheidsduur          | De geldigheidsduur van elke uitgegeven API Token. Nadat de Token is verlopen, zal de server, indien deze binnen de sessie geldigheidsduur valt en de vernieuwingslimiet niet is overschreden, automatisch een nieuwe Token uitgeven om de gebruikerssessie te behouden. Anders moet de gebruiker opnieuw inloggen. (Elke Token kan slechts één keer worden vernieuwd) |
| Vernieuwingslimiet voor verlopen Token | De maximale tijdslimiet waarbinnen een Token na het verlopen kan worden vernieuwd.                                                                                                                                                        |

Over het algemeen adviseren wij beheerders om:

- Een kortere Token geldigheidsduur in te stellen om de blootstellingstijd van de Token te beperken.
- Een redelijke sessie geldigheidsduur in te stellen, langer dan de Token geldigheidsduur, maar niet te lang, om een balans te vinden tussen gebruikerservaring en beveiliging. Gebruik het automatische Token-vernieuwingsmechanisme om actieve gebruikerssessies ononderbroken te houden en tegelijkertijd het risico op misbruik van langdurige sessies te verminderen.
- Een redelijke vernieuwingslimiet in te stellen voor verlopen Tokens, zodat de Token op natuurlijke wijze verloopt wanneer de gebruiker lange tijd inactief is, zonder een nieuwe Token uit te geven. Dit verlaagt het risico op misbruik van inactieve gebruikerssessies.

### Token-clientopslag

Standaard worden gebruikers-Tokens opgeslagen in de LocalStorage van de browser. Als u de browserpagina sluit en opnieuw opent, hoeft de gebruiker niet opnieuw in te loggen als de Token nog geldig is.

Als u wilt dat gebruikers elke keer opnieuw inloggen wanneer ze een pagina bezoeken, kunt u de omgevingsvariabele `API_CLIENT_STORAGE_TYPE=sessionStorage` instellen. Hiermee wordt de gebruikers-Token opgeslagen in de SessionStorage van de browser, zodat gebruikers elke keer dat ze een pagina openen opnieuw moeten inloggen.

### Wachtwoordbeleid

> Professionele editie en hoger

NocoBase ondersteunt het instellen van wachtwoordregels en beleidsregels voor het vergrendelen van aanmeldingspogingen voor alle gebruikers, om de beveiliging van NocoBase-applicaties met wachtwoordaanmelding te verbeteren. U kunt de [wachtwoordbeleidsregels](./password-policy/index.md) raadplegen voor meer informatie over elke configuratie-item.

#### Wachtwoordregels

| Configuratie-item                     | Beschrijving                                                                                                        |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Wachtwoordlengte**                   | De minimale vereiste wachtwoordlengte, met een maximum van 64 tekens.                                                 |
| **Wachtwoordcomplexiteit**             | Stel de complexiteitsvereisten voor het wachtwoord in, inclusief de verplichte tekens.                   |
| **Gebruikersnaam niet in wachtwoord**  | Stel in of het wachtwoord de gebruikersnaam van de huidige gebruiker mag bevatten.                                                  |
| **Wachtwoordgeschiedenis onthouden**   | Onthoud het aantal recent gebruikte wachtwoorden van de gebruiker; de gebruiker kan deze niet opnieuw gebruiken bij het wijzigen van het wachtwoord. |

#### Wachtwoordverloopconfiguratie

| Configuratie-item                                    | Beschrijving                                                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Wachtwoord geldigheidsduur**                        | De geldigheidsduur van gebruikerswachtwoorden. Gebruikers moeten hun wachtwoord wijzigen voordat het verloopt om de geldigheidsduur opnieuw te berekenen. Als het wachtwoord niet vóór de vervaldatum wordt gewijzigd, kan de gebruiker niet inloggen met het oude wachtwoord en is hulp van een beheerder nodig om het te resetten.<br>Als er andere aanmeldingsmethoden zijn geconfigureerd, kan de gebruiker deze gebruiken om in te loggen. |
| **Notificatiekanaal voor wachtwoordverloop**          | Binnen 10 dagen voordat het wachtwoord van de gebruiker verloopt, wordt bij elke aanmelding een herinnering gestuurd.                                                                                                                                                                                                                                                            |

#### Wachtwoordaanmeldingsbeveiliging

| Configuratie-item                                         | Beschrijving                                                                                                                                                                                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Maximaal aantal ongeldige aanmeldpogingen**              | Stel het maximale aantal aanmeldpogingen in dat een gebruiker binnen een opgegeven tijdsinterval kan doen.                                                                                                                                                                 |
| **Tijdsinterval voor ongeldige aanmeldpogingen (seconden)** | Stel het tijdsinterval in voor het berekenen van het maximale aantal ongeldige aanmeldpogingen van de gebruiker, in seconden.                                                                                                                                                              |
| **Vergrendeltijd (seconden)**                              | Stel de tijd in om de gebruiker te vergrendelen nadat deze de limiet voor ongeldige wachtwoordaanmeldingen heeft overschreden (0 betekent geen limiet). <br>Gedurende de periode dat de gebruiker is vergrendeld, is toegang tot het systeem via welke authenticatiemethode dan ook, inclusief API-sleutels, verboden. |

Over het algemeen adviseren wij:

- Stel sterke wachtwoordregels in om het risico op gerelateerde gissingen en brute-force aanvallen te verminderen.
- Stel een redelijke wachtwoord geldigheidsduur in om gebruikers te dwingen hun wachtwoord regelmatig te wijzigen.
- Combineer het aantal ongeldige wachtwoordaanmeldingen met de tijdconfiguratie om frequente aanmeldpogingen binnen korte tijd te beperken en brute-force aanvallen te voorkomen.
- In scenario's met strenge beveiligingseisen kunt u een redelijke vergrendeltijd instellen voor gebruikers die de aanmeldingslimiet overschrijden. Houd er echter rekening mee dat de instelling van de vergrendeltijd misbruikt kan worden; aanvallers kunnen opzettelijk meerdere keren een verkeerd wachtwoord invoeren voor doelaccounts, waardoor deze worden vergrendeld en niet normaal kunnen worden gebruikt. In de praktijk kunt u dit soort aanvallen voorkomen door middel van IP-beperkingen, API-frequentiebeperkingen en andere maatregelen.
- Wijzig de standaard root-gebruikersnaam, e-mail en wachtwoord van NocoBase om misbruik te voorkomen.
- Aangezien zowel een verlopen wachtwoord als een vergrendeld account toegang tot het systeem, inclusief beheerdersaccounts, onmogelijk maakt, is het raadzaam om meerdere accounts in het systeem in te stellen die bevoegd zijn om wachtwoorden te resetten en gebruikers te ontgrendelen.

![](https://static-docs.nocobase.com/202501031618900.png)

### Gebruikersvergrendeling

> Professionele editie en hoger, inbegrepen in de wachtwoordbeleid **plugin**

Beheer gebruikers die zijn vergrendeld omdat ze de limiet voor ongeldige wachtwoordaanmeldingen hebben overschreden. U kunt ze actief ontgrendelen of afwijkende gebruikers actief toevoegen aan de vergrendellijst. Nadat een gebruiker is vergrendeld, is toegang tot het systeem via welke authenticatiemethode dan ook, inclusief API-sleutels, verboden.

![](https://static-docs.nocobase.com/202501031618399.png)

### API-sleutels

NocoBase ondersteunt het aanroepen van systeem-API's via API-sleutels. U kunt API-sleutels toevoegen in de configuratie van de API-sleutel **plugin**.

- Koppel de juiste rol aan de API-sleutel en zorg ervoor dat de bijbehorende machtigingen correct zijn geconfigureerd.
- Voorkom dat API-sleutels lekken tijdens het gebruik.
- Over het algemeen adviseren wij gebruikers om een geldigheidsduur in te stellen voor API-sleutels en de optie "Nooit verlopen" niet te gebruiken.
- Als een API-sleutel abnormaal wordt gebruikt en er een risico op lekkage bestaat, kunt u de betreffende API-sleutel verwijderen om deze ongeldig te maken.

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

### Single Sign-On (SSO)

> Commerciële **plugin**

NocoBase biedt een uitgebreide reeks SSO-authenticatie **plugins** die verschillende gangbare protocollen ondersteunen, zoals OIDC, SAML 2.0, LDAP en CAS. Tegelijkertijd beschikt NocoBase over complete uitbreidingsinterfaces voor authenticatiemethoden, wat snelle ontwikkeling en integratie van andere authenticatietypen mogelijk maakt. U kunt eenvoudig uw bestaande IdP koppelen aan NocoBase om gebruikersidentiteiten centraal te beheren op de IdP en zo de beveiliging te verbeteren.

![](https://static-docs.nocobase.com/202501031619427.png)

### Twee-factor authenticatie

> Enterprise-editie

Twee-factor authenticatie vereist dat gebruikers bij het inloggen met een wachtwoord een tweede geldige identiteitsbewijs verstrekken, zoals het verzenden van een eenmalige dynamische verificatiecode naar het vertrouwde apparaat van de gebruiker, om de gebruikersidentiteit te verifiëren, misbruik van de gebruikersidentiteit te voorkomen en het risico op wachtwoordlekkage te verminderen.

### IP-toegangscontrole

> Enterprise-editie

NocoBase ondersteunt het instellen van zwarte lijsten of witte lijsten voor IP-adressen van gebruikers.

- In omgevingen met strenge beveiligingseisen kunt u een IP-witte lijst instellen, zodat alleen specifieke IP-adressen of IP-bereiken toegang hebben tot het systeem. Dit beperkt ongeautoriseerde externe netwerkverbindingen en vermindert beveiligingsrisico's aan de bron.
- Bij openbare netwerktoegang kan de beheerder, indien abnormale toegang wordt gedetecteerd, een IP-zwarte lijst instellen om bekende kwaadaardige IP-adressen of verdachte bronnen te blokkeren, waardoor beveiligingsbedreigingen zoals kwaadaardige scans en brute-force aanvallen worden verminderd.
- Logboeken worden bijgehouden voor geweigerde toegangspogingen.

## Toegangscontrole

Door verschillende rollen in het systeem in te stellen en de bijbehorende machtigingen aan deze rollen toe te wijzen, kunt u de toegang van gebruikers tot bronnen nauwkeurig beheren. Beheerders moeten de configuratie redelijk aanpassen aan de behoeften van de specifieke situatie om het risico op lekkage van systeembronnen te verminderen.

### Root-gebruiker

Bij de eerste installatie van NocoBase initialiseert de applicatie een root-gebruiker. Het wordt aanbevolen dat gebruikers de relevante informatie van de root-gebruiker wijzigen via systeemomgevingsvariabelen om misbruik te voorkomen.

- `INIT_ROOT_USERNAME` - root-gebruikersnaam
- `INIT_ROOT_EMAIL` - root-gebruikers-e-mail
- `INIT_ROOT_PASSWORD` - root-gebruikerswachtwoord, stel een sterk wachtwoord in.

Tijdens het verdere gebruik van het systeem wordt geadviseerd om andere beheerdersaccounts in te stellen en te gebruiken, en direct gebruik van de root-gebruiker voor applicatiebewerkingen zoveel mogelijk te vermijden.

### Rollen en machtigingen

NocoBase beheert de toegang van gebruikers tot bronnen door rollen in het systeem in te stellen, verschillende rollen te autoriseren en gebruikers aan de bijbehorende rollen te koppelen. Elke gebruiker kan meerdere rollen hebben en kan van rol wisselen om bronnen vanuit verschillende perspectieven te beheren. Als de afdelings **plugin** is geïnstalleerd, kunt u ook rollen en afdelingen koppelen, zodat gebruikers de rollen krijgen die aan hun afdeling zijn gekoppeld.

![](https://static-docs.nocobase.com/202501031620965.png)

### Systeemconfiguratiemachtigingen

De systeemconfiguratiemachtigingen omvatten de volgende instellingen:

- Toestaan van de configuratie-interface
- Toestaan van het installeren, inschakelen en uitschakelen van **plugins**
- Toestaan van het configureren van **plugins**
- Toestaan van het wissen van de cache en het herstarten van de applicatie
- Configuratiemachtigingen voor elke **plugin**

### Menumachtigingen

Menumachtigingen worden gebruikt om de toegang van gebruikers tot verschillende menupagina's te beheren, zowel op desktop als mobiel.

![](https://static-docs.nocobase.com/202501031620717.png)

### Gegevensmachtigingen

NocoBase biedt gedetailleerde controle over de toegangsmachtigingen van gebruikers tot gegevens binnen het systeem, zodat verschillende gebruikers alleen toegang hebben tot gegevens die relevant zijn voor hun verantwoordelijkheden, en ongeoorloofde toegang en gegevenslekkage worden voorkomen.

#### Globale controle

![](https://static-docs.nocobase.com/202501031620866.png)

#### Tabelniveau, veldniveau controle

![](https://static-docs.nocobase.com/202501031621047.png)

#### Gegevensbereikcontrole

Stel het **gegevensbereik** in dat gebruikers kunnen bewerken. Let op: het **gegevensbereik** hier verschilt van het **gegevensbereik** dat in blokken is geconfigureerd. Het **gegevensbereik** dat in blokken is geconfigureerd, wordt meestal alleen gebruikt voor front-end gegevensfiltering. Als u de toegang van gebruikers tot **gegevensbronnen** strikt wilt controleren, moet u dit hier configureren, waarbij de server de controle heeft.

![](https://static-docs.nocobase.com/202501031621712.png)

## Gegevensbeveiliging

Tijdens het opslaan en back-uppen van gegevens biedt NocoBase effectieve mechanismen om de gegevensbeveiliging te waarborgen.

### Wachtwoordopslag

Gebruikerswachtwoorden van NocoBase worden versleuteld en opgeslagen met het scrypt-algoritme, wat effectief is tegen grootschalige hardwareaanvallen.

### Omgevingsvariabelen en sleutels

Wanneer u diensten van derden gebruikt in NocoBase, raden wij u aan de sleutelinformatie van derden te configureren in omgevingsvariabelen en deze versleuteld op te slaan. Dit is handig voor configuratie en gebruik op verschillende plaatsen, en verhoogt tevens de beveiliging. U kunt de documentatie raadplegen voor gedetailleerde gebruiksmethoden.

:::warning
Standaard wordt de sleutel versleuteld met het AES-256-CBC-algoritme. NocoBase genereert automatisch een 32-bits versleutelingssleutel en slaat deze op in `storage/.data/environment/aes_key.dat`. U dient het sleutelbestand zorgvuldig te bewaren om diefstal te voorkomen. Als u gegevens moet migreren, moet het sleutelbestand mee worden gemigreerd.
:::

![](https://static-docs.nocobase.com/202501031622612.png)

### Bestandsopslag

Als u gevoelige bestanden moet opslaan, wordt aangeraden een cloudopslagservice te gebruiken die compatibel is met het S3-protocol, in combinatie met de commerciële **plugin** 'File storage: S3 (Pro)', om privé lezen en schrijven van bestanden mogelijk te maken. Als u het in een intern netwerk wilt gebruiken, wordt aangeraden opslagapplicaties zoals MinIO te gebruiken die privé-implementatie ondersteunen en compatibel zijn met het S3-protocol.

![](https://static-docs.nocobase.com/202501031623549.png)

### Applicatieback-up

Om de veiligheid van applicatiegegevens te waarborgen en gegevensverlies te voorkomen, raden wij u aan de database regelmatig te back-uppen.

Gebruikers van de open-source editie kunnen https://www.nocobase.com/en/blog/nocobase-backup-restore raadplegen om back-ups te maken met databasetools. Wij adviseren u tevens om back-upbestanden zorgvuldig te bewaren om gegevenslekkage te voorkomen.

Gebruikers van de professionele editie en hoger kunnen de back-upmanager gebruiken voor back-ups. De back-upmanager biedt de volgende functies:

- Geplande automatische back-up: Periodieke automatische back-ups besparen tijd en handmatige handelingen, en bieden meer gegevensbeveiliging.
- Back-upbestanden synchroniseren met cloudopslag: Isoleer back-upbestanden van de applicatieservice zelf om te voorkomen dat back-upbestanden verloren gaan wanneer de service niet beschikbaar is door een serverstoring.
- Versleuteling van back-upbestanden: Stel een wachtwoord in voor back-upbestanden om het risico op gegevenslekkage door gelekte back-upbestanden te verminderen.

![](https://static-docs.nocobase.com/202501031623107.png)

## Runtime-omgevingsbeveiliging

Het correct implementeren van NocoBase en het waarborgen van de veiligheid van de runtime-omgeving is een van de sleutels tot het garanderen van de veiligheid van NocoBase-applicaties.

### HTTPS-implementatie

Om man-in-the-middle-aanvallen te voorkomen, raden wij u aan een SSL/TLS-certificaat toe te voegen aan uw NocoBase-applicatiesite om de veiligheid van gegevens tijdens netwerkoverdracht te waarborgen.

### API-transportversleuteling

> Enterprise-editie

In omgevingen met strengere gegevensbeveiligingseisen ondersteunt NocoBase het inschakelen van API-transportversleuteling, waarbij de inhoud van API-verzoeken en -antwoorden wordt versleuteld om overdracht in platte tekst te voorkomen en de drempel voor gegevenskraken te verhogen.

### Privé-implementatie

Standaard hoeft NocoBase niet te communiceren met diensten van derden, en het NocoBase-team verzamelt geen gebruikersinformatie. Alleen bij de volgende twee bewerkingen is een verbinding met de NocoBase-server vereist:

1. Automatisch downloaden van commerciële **plugins** via het NocoBase Service-platform.
2. Online verificatie en activering van commerciële applicaties.

Als u bereid bent enige functionaliteit op te offeren, kunnen beide bewerkingen ook offline worden uitgevoerd, zonder directe verbinding met de NocoBase-server.

NocoBase ondersteunt volledige intranetimplementatie, zie

- https://www.nocobase.com/en/blog/load-docker-image
- [**Plugins** uploaden naar de **plugin**-map voor installatie en upgrade](/get-started/install-upgrade-plugins#third-party-plugins)

### Meerdere omgevingsisolatie

> Professionele editie en hoger

In de praktijk adviseren wij zakelijke gebruikers om test- en productieomgevingen te isoleren, om zo de veiligheid van applicatiegegevens en de runtime-omgeving in de productieomgeving te waarborgen. Met behulp van de migratiebeheer **plugin** kunnen applicatiegegevens tussen verschillende omgevingen worden gemigreerd.

![](https://static-docs.nocobase.com/202501031627729.png)

## Auditing en monitoring

### Auditlogboeken

> Enterprise-editie

De auditlogfunctie van NocoBase registreert de activiteiten van gebruikers binnen het systeem. Door belangrijke gebruikershandelingen en toegangsgedrag vast te leggen, kunnen beheerders:

- Informatie over gebruikersaanvragen, zoals IP-adres, apparaat en tijdstip van handeling, controleren om afwijkend gedrag tijdig te detecteren.
- De bewerkingsgeschiedenis van **gegevensbronnen** binnen het systeem traceren.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

### Applicatielogboeken

NocoBase biedt verschillende logtypen om gebruikers te helpen de systeemstatus en gedragsregistraties te begrijpen, systeemproblemen tijdig te detecteren en te lokaliseren, en de veiligheid en controleerbaarheid van het systeem vanuit verschillende dimensies te waarborgen. De belangrijkste logtypen zijn:

- Verzoeklogboeken: API-verzoeklogboeken, inclusief informatie zoals de bezochte URL, HTTP-methode, verzoekparameters, responstijd en statuscode.
- Systeemlogboeken: Registreert applicatiegebeurtenissen, inclusief servicestart, configuratiewijzigingen, foutmeldingen en belangrijke bewerkingen.
- SQL-logboeken: Registreert databasebewerkingen en hun uitvoeringstijden, inclusief query's, updates, invoegingen en verwijderingen.
- **Workflow**-logboeken: Uitvoeringslogboeken van de **workflow**, inclusief uitvoeringstijd, runtime-informatie en foutmeldingen.