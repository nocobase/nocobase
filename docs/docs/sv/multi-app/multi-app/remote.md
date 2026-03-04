---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/multi-app/multi-app/remote).
:::

# Fler-miljöläge

## Introduktion

Fler-applikationsläget med delat minne har tydliga fördelar vid driftsättning och underhåll, men i takt med att antalet applikationer och verksamhetens komplexitet ökar kan en enskild instans gradvis ställas inför problem som resurskonflikter och försämrad stabilitet. För sådana scenarier kan ni använda en hybridlösning med flera miljöer för att stödja mer komplexa affärskrav.

I detta läge distribuerar systemet en ingångsapplikation som ett enhetligt hanterings- och schemaläggningscenter, samtidigt som flera NocoBase-instanser distribueras som oberoende körtidsmiljöer som faktiskt bär affärsapplikationerna. Varje miljö är isolerad från de andra men samarbetar, vilket effektivt sprider belastningen från en enskild instans och avsevärt förbättrar systemets stabilitet, skalbarhet och felisolering.

På distributionsnivå kan olika miljöer köras i oberoende processer, distribueras som olika Docker-containrar eller existera i form av flera Kubernetes-distributioner, vilket gör det möjligt att flexibelt anpassa sig till infrastrukturmiljöer av olika storlekar och arkitekturer.

## Distribution

I hybridläget med flera miljöer:

- Ingångsapplikationen (Supervisor) ansvarar för enhetlig hantering av applikations- och miljöinformation.
- Arbetsapplikationer (Worker) fungerar som de faktiska körtidsmiljöerna för verksamheten.
- Applikations- och miljökonfigurationer cachas via Redis.
- Synkronisering av instruktioner och status mellan ingångsapplikationen och arbetsapplikationerna är beroende av Redis-kommunikation.

För närvarande tillhandahålls ingen funktion för att skapa miljöer; varje arbetsapplikation måste distribueras manuellt och konfigureras med motsvarande miljöinformation innan den kan identifieras av ingångsapplikationen.

### Arkitekturberoenden

Förbered följande tjänster före distribution:

- Redis
  - Cachar applikations- och miljökonfigurationer.
  - Fungerar som kommunikationskanal för kommandon mellan ingångsapplikationen och arbetsapplikationerna.

- Databas
  - Databastjänster som både ingångsapplikationen och arbetsapplikationerna behöver ansluta till.

### Ingångsapplikation (Supervisor)

Ingångsapplikationen fungerar som ett enhetligt hanteringscenter och ansvarar för att skapa, starta och stoppa applikationer, schemalägga miljöer samt agera åtkomstproxy för applikationer.

Förklaring av miljövariabler för ingångsapplikationen:

```bash
# Applikationsläge
APP_MODE=supervisor
# Metod för att upptäcka applikationer
APP_DISCOVERY_ADAPTER=remote
# Metod för hantering av applikationsprocesser
APP_PROCESS_ADAPTER=remote
# Redis för cache av applikations- och miljökonfiguration
APP_SUPERVISOR_REDIS_URL=
# Kommunikationsmetod för applikationskommandon
APP_COMMAND_ADPATER=redis
# Redis för applikationskommandon
APP_COMMAND_REDIS_URL=
```

### Arbetsapplikation (Worker)

Arbetsapplikationen fungerar som den faktiska körtidsmiljön för verksamheten och ansvarar för att bära och köra specifika NocoBase-applikationsinstanser.

Förklaring av miljövariabler för arbetsapplikationen:

```bash
# Applikationsläge
APP_MODE=worker
# Metod för att upptäcka applikationer
APP_DISCOVERY_ADAPTER=remote
# Metod för hantering av applikationsprocesser
APP_PROCESS_ADAPTER=local
# Redis för cache av applikations- och miljökonfiguration
APP_SUPERVISOR_REDIS_URL=
# Kommunikationsmetod för applikationskommandon
APP_COMMAND_ADPATER=redis
# Redis för applikationskommandon
APP_COMMAND_REDIS_URL=
# Miljöidentifierare
ENVIRONMENT_NAME=
# Åtkomst-URL för miljön
ENVIRONMENT_URL=
# Proxy-URL för miljön
ENVIRONMENT_PROXY_URL=
```

### Docker Compose-exempel

Följande exempel visar en hybridlösning för distribution i flera miljöer med Docker-containrar som körenheter, där en ingångsapplikation och två arbetsapplikationer distribueras samtidigt via Docker Compose.

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

## Användarmanual

De grundläggande hanteringsåtgärderna för applikationer skiljer sig inte från läget med delat minne, se [Läget med delat minne](./local.md). Detta avsnitt introducerar främst innehåll relaterat till konfiguration av flera miljöer.

### Miljölista

Efter distributionen går ni till sidan "Applikationsövervakare" i ingångsapplikationen. Under fliken "Miljöer" kan ni se listan över registrerade arbetsmiljöer. Detta inkluderar miljöidentifierare, version av arbetsapplikationen, åtkomst-URL och status. Arbetsapplikationen rapporterar en pulssignal varannan minut för att säkerställa miljöns tillgänglighet.

![](https://static-docs.nocobase.com/202512291830371.png)

### Skapa applikation

När ni skapar en applikation kan ni välja en eller flera körtidsmiljöer för att ange i vilka arbetsapplikationer applikationen ska distribueras. I normala fall rekommenderas att ni väljer en miljö. Välj flera miljöer endast om arbetsapplikationen har genomgått [tjänsteuppdelning](/cluster-mode/services-splitting) och ni behöver distribuera samma applikation i flera körtidsmiljöer för att uppnå lastbalansering eller funktionsisolering.

![](https://static-docs.nocobase.com/202512291835086.png)

### Applikationslista

Applikationslistan visar varje applikations nuvarande körtidsmiljö och statusinformation. Om en applikation är distribuerad i flera miljöer visas flera körstatusar. Samma applikation i flera miljöer kommer under normala omständigheter att bibehålla en enhetlig status och behöver styras gemensamt för start och stopp.

![](https://static-docs.nocobase.com/202512291842216.png)

### Starta applikation

Eftersom applikationen kan skriva initialiseringsdata till databasen vid start, kommer applikationer som distribueras i flera miljöer att startas i kö för att undvika kapplöpningsproblem (race conditions) i miljöer med flera instanser.

![](https://static-docs.nocobase.com/202512291841727.png)

### Proxyåtkomst för applikationer

Arbetsapplikationer kan nås via proxy genom ingångsapplikationens undersökväg `/apps/:appName/admin`.

![](https://static-docs.nocobase.com/202601082154230.png)

Om applikationen är distribuerad i flera miljöer måste ni ange en målmiljö för proxyåtkomst.

![](https://static-docs.nocobase.com/202601082155146.png)

Som standard använder proxyadressen arbetsapplikationens åtkomstadress, vilket motsvarar miljövariabeln `ENVIRONMENT_URL`. Se till att denna adress är tillgänglig i det nätverk där ingångsapplikationen befinner sig. Om ni behöver använda en annan proxyadress kan den skrivas över via miljövariabeln `ENVIRONMENT_PROXY_URL`.