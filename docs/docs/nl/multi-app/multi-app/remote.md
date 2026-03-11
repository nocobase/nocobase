---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI-vertaalmelding"}
Dit document is vertaald door AI. Raadpleeg de [Engelse versie](/multi-app/multi-app/remote) voor nauwkeurige informatie.
:::

# Multi-omgevingsmodus

## Introductie

De gedeelde geheugenmodus voor meerdere applicaties biedt duidelijke voordelen bij implementatie en beheer, maar naarmate het aantal applicaties en de complexiteit van de bedrijfsvoering toenemen, kan een enkele instantie te maken krijgen met problemen zoals resource-concurrentie en verminderde stabiliteit. Voor dergelijke scenario's kunnen gebruikers kiezen voor een hybride implementatieoplossing met meerdere omgevingen om aan complexere zakelijke behoeften te voldoen.

In deze modus implementeert het systeem één ingangsapplicatie als een centraal beheer- en planningscentrum, terwijl meerdere NocoBase-instanties worden ingezet als onafhankelijke runtime-omgevingen die de eigenlijke bedrijfsapplicaties hosten. De omgevingen zijn van elkaar geïsoleerd en werken samen, waardoor de druk op een enkele instantie effectief wordt verdeeld en de stabiliteit, schaalbaarheid en foutisolatie van het systeem aanzienlijk worden verbeterd.

Op implementatieniveau kunnen verschillende omgevingen in afzonderlijke processen draaien, worden geïmplementeerd als verschillende Docker-containers, of bestaan in de vorm van meerdere Kubernetes Deployments, waardoor ze flexibel kunnen worden aangepast aan infrastructuuromgevingen van verschillende schaalgroottes en architecturen.

## Implementatie

In de hybride implementatiemodus met meerdere omgevingen:

- De ingangsapplicatie (Supervisor) is verantwoordelijk voor het centrale beheer van applicatie- en omgevingsinformatie.
- Werkapplicaties (Worker) dienen als de eigenlijke runtime-omgevingen voor de bedrijfsvoering.
- Applicatie- en omgevingsconfiguraties worden gecacht via Redis.
- De synchronisatie van instructies en status tussen de ingangsapplicatie en werkapplicaties is afhankelijk van Redis-communicatie.

Momenteel is er nog geen functie voor het maken van omgevingen beschikbaar; elke werkapplicatie moet handmatig worden geïmplementeerd en geconfigureerd met de bijbehorende omgevingsinformatie voordat deze door de ingangsapplicatie kan worden herkend.

### Architectuurafhankelijkheden

Bereid de volgende services voor voordat u met de implementatie begint:

- Redis
  - Cachen van applicatie- en omgevingsconfiguraties
  - Dient als communicatiekanaal voor commando's tussen de ingangsapplicatie en werkapplicaties

- Database
  - Databaseservices waarmee de ingangsapplicatie en werkapplicaties verbinding moeten maken

### Ingangsapplicatie (Supervisor)

De ingangsapplicatie fungeert als het centrale beheercentrum en is verantwoordelijk voor het maken, starten en stoppen van applicaties, de planning van omgevingen en de toegangsproxy voor applicaties.

Toelichting op de omgevingsvariabelen van de ingangsapplicatie:

```bash
# Applicatiemodus
APP_MODE=supervisor
# Methode voor applicatie-ontdekking
APP_DISCOVERY_ADAPTER=remote
# Methode voor applicatieprocesbeheer
APP_PROCESS_ADAPTER=remote
# Redis voor cache van applicatie- en omgevingsconfiguratie
APP_SUPERVISOR_REDIS_URL=
# Methode voor applicatie-commandocommunicatie
APP_COMMAND_ADPATER=redis
# Redis voor applicatie-commandocommunicatie
APP_COMMAND_REDIS_URL=
```

### Werkapplicatie (Worker)

De werkapplicatie dient als de eigenlijke runtime-omgeving voor de bedrijfsvoering en is verantwoordelijk voor het hosten en uitvoeren van specifieke NocoBase-applicatie-instanties.

Toelichting op de omgevingsvariabelen van de werkapplicatie:

```bash
# Applicatiemodus
APP_MODE=worker
# Methode voor applicatie-ontdekking
APP_DISCOVERY_ADAPTER=remote
# Methode voor applicatieprocesbeheer
APP_PROCESS_ADAPTER=local
# Redis voor cache van applicatie- en omgevingsconfiguratie
APP_SUPERVISOR_REDIS_URL=
# Methode voor applicatie-commandocommunicatie
APP_COMMAND_ADPATER=redis
# Redis voor applicatie-commandocommunicatie
APP_COMMAND_REDIS_URL=
# Omgevingsidentificatie
ENVIRONMENT_NAME=
# Toegangs-URL van de omgeving
ENVIRONMENT_URL=
# Proxy-toegangs-URL van de omgeving
ENVIRONMENT_PROXY_URL=
```

### Docker Compose Voorbeeld

Het volgende voorbeeld toont een hybride implementatieoplossing met meerdere omgevingen waarbij Docker-containers als runtime-eenheden worden gebruikt. Via Docker Compose worden gelijktijdig één ingangsapplicatie en twee werkapplicaties geïmplementeerd.

```yaml
networks:
  nocobase:
    driver: bridge

services:
  redis:
    networks:
      - nocobase
    image: redis/redis-stack-server:latest
  supervisor:
    container_name: nocobase-supervisor
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_supervisor
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=supervisor
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=remote
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-supervisor:/app/nocobase/storage
    ports:
      - '14000:80'
  worker_a:
    container_name: nocobase-worker-a
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_a
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_a
      - ENVIRONMENT_URL=http://localhost:15000
      - ENVIRONMENT_PROXY_URL=http://worker_a
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-a:/app/nocobase/storage
    ports:
      - '15000:80'
  worker_b:
    container_name: nocobase-worker-b
    image: nocobase/nocobase:alpha
    restart: always
    platform: linux/amd64
    networks:
      - nocobase
    depends_on:
      - redis
    environment:
      - DB_DIALECT=postgres
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nocobase_worker_b
      - DB_USER=postgres
      - DB_PASSWORD=postgres
      - TZ=Asia/Shanghai
      - APP_MODE=worker
      - APP_DISCOVERY_ADAPTER=remote
      - APP_PROCESS_ADAPTER=local
      - APP_SUPERVISOR_REDIS_URL=redis://redis:6379/0
      - APP_COMMAND_ADAPTER=redis
      - APP_COMMAND_REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT_NAME=env_b
      - ENVIRONMENT_URL=http://localhost:16000
      - ENVIRONMENT_PROXY_URL=http://worker_b
      - APPEND_PRESET_BUILT_IN_PLUGINS=@nocobase/plugin-app-supervisor
    volumes:
      - ./storage-worker-b:/app/nocobase/storage
    ports:
      - '16000:80'
```

## Gebruikershandleiding

De basisbeheerbewerkingen voor applicaties zijn hetzelfde als in de gedeelde geheugenmodus; raadpleeg hiervoor [Gedeelde geheugenmodus](./local.md). Dit gedeelte introduceert voornamelijk de inhoud die verband houdt met de configuratie van meerdere omgevingen.

### Omgevingslijst

Ga na de implementatie naar de pagina "App Supervisor" van de ingangsapplicatie. Op het tabblad "Omgevingen" kunt u de lijst met geregistreerde werkomgevingen bekijken. Dit omvat informatie zoals de omgevingsidentificatie, de versie van de werkapplicatie, de toegangs-URL en de status. Werkapplicaties rapporteren elke 2 minuten een heartbeat om de beschikbaarheid van de omgeving te garanderen.

![](https://static-docs.nocobase.com/202512291830371.png)

### Applicatie maken

Bij het maken van een applicatie kunt u één of meerdere runtime-omgevingen selecteren om aan te geven op welke werkapplicaties deze applicatie zal worden geïmplementeerd. In de meeste gevallen wordt aanbevolen om slechts één omgeving te selecteren. Kies alleen meerdere omgevingen wanneer er [service-splitting](/cluster-mode/services-splitting) is toegepast op de werkapplicatie en dezelfde applicatie in meerdere runtime-omgevingen moet worden geïmplementeerd voor lastverdeling of isolatie van functionaliteiten.

![](https://static-docs.nocobase.com/202512291835086.png)

### Applicatielijst

De applicatielijstpagina toont de huidige runtime-omgeving en statusinformatie voor elke applicatie. Als een applicatie in meerdere omgevingen is geïmplementeerd, worden er meerdere runtime-statussen weergegeven. Onder normale omstandigheden behoudt dezelfde applicatie in meerdere omgevingen een uniforme status en moet het starten en stoppen centraal worden beheerd.

![](https://static-docs.nocobase.com/202512291842216.png)

### Applicatie starten

Omdat er bij het starten van een applicatie initialisatiegegevens naar de database kunnen worden geschreven, worden applicaties die in meerdere omgevingen zijn geïmplementeerd na elkaar (in een wachtrij) gestart om race-conditions te voorkomen.

![](https://static-docs.nocobase.com/202512291841727.png)

### Applicatie toegangsproxy

Werkapplicaties kunnen via een proxy worden benaderd via het subpad `/apps/:appName/admin` van de ingangsapplicatie.

![](https://static-docs.nocobase.com/202601082154230.png)

Als een applicatie in meerdere omgevingen is geïmplementeerd, moet u een doelomgeving voor de proxy-toegang opgeven.

![](https://static-docs.nocobase.com/202601082155146.png)

Standaard gebruikt het proxy-toegangsadres het toegangsadres van de werkapplicatie, wat overeenkomt met de omgevingsvariabele `ENVIRONMENT_URL`. U moet ervoor zorgen dat dit adres toegankelijk is binnen de netwerkomgeving waar de ingangsapplicatie zich bevindt. Als u een ander proxy-toegangsadres wilt gebruiken, kunt u dit overschrijven via de omgevingsvariabele `ENVIRONMENT_PROXY_URL`.