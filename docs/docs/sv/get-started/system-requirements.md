:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/get-started/system-requirements).
:::

# Systemkrav

Systemkraven som beskrivs i detta dokument gäller **enbart för själva NocoBase-applikationstjänsten** och omfattar de beräknings- och minnesresurser som krävs för applikationsprocesserna. De **omfattar inte beroende tredjepartstjänster**, inklusive men inte begränsat till:

- API-gateways / omvända proxyservrar
- Databastjänster (t.ex. MySQL, PostgreSQL)
- Cachetjänster (t.ex. Redis)
- Mellanprogramvara (middleware) som meddelandeköer, objektlagring etc.

Förutom för funktionsvalidering eller rent experimentella scenarier, **rekommenderar vi starkt att ni distribuerar ovanstående tredjepartstjänster separat** på dedikerade servrar eller i containrar, eller använder motsvarande molntjänster.

Systemkonfiguration och kapacitetsplanering för dessa tjänster bör utvärderas och optimeras separat baserat på **faktisk datamängd, arbetsbelastning och samtidighetsnivå**.

## Enkelnods-distributionsläge

Enkelnods-distributionsläge innebär att NocoBase-applikationstjänsten körs på en enda server eller containerinstans.

### Lägsta hårdvarukrav

| Resurs | Krav |
|---|---|
| CPU | 1 kärna |
| Minne | 2 GB |

**Tillämpliga scenarier**:

- Mikroverksamheter
- Funktionsvalidering (POC)
- Utvecklings- / testmiljöer
- Scenarier med nästan ingen samtidig åtkomst

:::info{title=Tips}

- Denna konfiguration garanterar endast att systemet kan köras; den garanterar inte prestandaupplevelsen.
- När datamängden eller antalet samtidiga förfrågningar ökar kan systemresurserna snabbt bli en flaskhals.
- För scenarier som **källkodsutveckling, plugin-utveckling eller vid bygge och distribution från källkod**, rekommenderas att ni reserverar **minst 4 GB ledigt minne** för att säkerställa att installation av beroenden, kompilering och byggprocesser kan slutföras.

:::

### Rekommenderade hårdvarukrav

| Resurs | Rekommenderad konfiguration |
|---|---|
| CPU | 2 kärnor |
| Minne | ≥ 4 GB |

**Tillämpliga scenarier**:

Lämplig för små till medelstora verksamheter och produktionsmiljöer med begränsad samtidighet.

:::info{title=Tips}

- Med denna konfiguration kan systemet hantera vanliga administrativa åtgärder och lättare arbetsbelastningar.
- När affärskomplexiteten, den samtidiga åtkomsten eller bakgrundsuppgifter ökar, bör ni överväga att uppgradera hårdvaruspecifikationen eller migrera till klustermodell.

:::

## Klustermodell

Klustermodell är utformad för medelstora till stora verksamheter med högre samtidighet. Ni kan skala horisontellt för att förbättra systemets tillgänglighet och genomströmning (se [Klustermodell](/cluster-mode) för detaljer).

### Hårdvarukrav för noder

I klustermodell rekommenderas att hårdvarukonfigurationen för varje applikationsnod (Pod / instans) överensstämmer med enkelnods-distributionsläget.

**Lägsta konfiguration per nod:**

- CPU: 1 kärna
- Minne: 2 GB

**Rekommenderad konfiguration per nod:**

- CPU: 2 kärnor
- Minne: 4 GB

### Planering av antal noder

- Antalet noder i klustret kan utökas vid behov (2–N).
- Det faktiska antalet noder som krävs beror på:
  - Samtidig trafik
  - Affärslogikens komplexitet
  - Belastning från bakgrundsjobb och asynkron bearbetning
  - Svarsförmåga hos externa beroendetjänster

Rekommendationer för produktionsmiljöer:

- Justera antalet noder dynamiskt baserat på övervakningsmått (CPU, minne, svarstider etc.).
- Reservera en viss resursbuffert för att hantera trafiktoppar.