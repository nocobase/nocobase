---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/multi-app/multi-app/local).
:::

# Delat minnesläge

## Introduktion

När ni vill dela upp verksamheten på applikationsnivå utan att införa komplexa arkitekturer för driftsättning och underhåll, kan ni använda läget för flera applikationer med delat minne.

I detta läge kan flera applikationer köras samtidigt i en NocoBase-instans. Varje applikation är oberoende, kan ansluta till en egen databas, och kan skapas, startas och stoppas individuellt, men de delar samma process och minnesutrymme. Ni behöver fortfarande bara underhålla en NocoBase-instans.

## Användarmanual

### Konfiguration av miljövariabler

Innan ni använder funktionen för flera applikationer, se till att följande miljövariabler är inställda när NocoBase startas:

```bash
APP_DISCOVERY_ADAPTER=local
APP_PROCESS_ADAPTER=local
```

### Skapa applikation

Klicka på "App-övervakare" i systeminställningsmenyn för att komma till sidan för applikationshantering.

![](https://static-docs.nocobase.com/202512291056215.png)

Klicka på knappen "Lägg till" för att skapa en ny applikation.

![](https://static-docs.nocobase.com/202512291057696.png)

#### Beskrivning av konfigurationsalternativ

| Konfigurationsalternativ | Beskrivning |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Applikationsnamn**   | Namnet som visas för applikationen i gränssnittet |
| **Applikationsidentifierare**   | Applikationsidentifierare, globalt unik |
| **Startläge**   | - Starta vid första besök: Underapplikationen startar först när en användare besöker den via URL<br>- Starta med huvudapplikation: Underapplikationen startar samtidigt som huvudapplikationen (ökar huvudapplikationens starttid) |
| **Miljö**       | I delat minnesläge är endast den lokala miljön tillgänglig, det vill säga `local` |
| **Databasanslutning** | Används för att konfigurera applikationens huvuddatakälla, stöder följande tre metoder:<br>- Ny databas: Återanvänd aktuell databastjänst och skapa en oberoende databas<br>- Ny dataanslutning: Anslut till en annan databastjänst<br>- Schema-läge: När den aktuella huvuddatakällan är PostgreSQL, skapa ett oberoende schema för applikationen |
| **Uppgradering**       | Om den anslutna databasen innehåller NocoBase-applikationsdata av en lägre version, om automatisk uppgradering till den aktuella applikationsversionen ska tillåtas |
| **JWT-nyckel**   | Generera automatiskt en oberoende JWT-nyckel för applikationen för att säkerställa att applikationssessionen är oberoende av huvudapplikationen och andra applikationer |
| **Anpassat domännamn** | Konfigurera ett oberoende domännamn för åtkomst till applikationen |

### Starta applikation

Klicka på knappen **Starta** för att starta underapplikationen.

> Om ni markerade _"Starta vid första besök"_ vid skapandet, kommer den att startas automatiskt vid första besöket.

![](https://static-docs.nocobase.com/202512291121065.png)

### Besöka applikation

Klicka på knappen **Besök** för att öppna underapplikationen i en ny flik.

Som standard används `/apps/:appName/admin/` för att komma åt underapplikationen, till exempel:

```bash
http://localhost:13000/apps/a_7zkxoarusnx/admin/
```

Samtidigt kan ni även konfigurera ett oberoende domännamn för underapplikationen. Domännamnet måste peka på den aktuella IP-adressen. Om ni använder Nginx behöver domännamnet även läggas till i Nginx-konfigurationen.

### Stoppa applikation

Klicka på knappen **Stoppa** för att stoppa underapplikationen.

![](https://static-docs.nocobase.com/202512291122113.png)

### Applikationsstatus

Ni kan se den aktuella statusen för varje applikation i listan.

![](https://static-docs.nocobase.com/202512291122339.png)

### Ta bort applikation

Klicka på knappen **Ta bort** för att ta bort applikationen.

![](https://static-docs.nocobase.com/202512291122178.png)

## Vanliga frågor

### 1. Plugin-hantering

De plugins som är tillgängliga för andra applikationer är desamma som för huvudapplikationen (inklusive versioner), men plugins kan konfigureras och användas oberoende.

### 2. Databasisolering

Andra applikationer kan konfigurera oberoende databaser. Om ni vill dela data mellan applikationer kan detta göras via externa datakällor.

### 3. Säkerhetskopiering och migrering av data

För närvarande stöder säkerhetskopiering av data i huvudapplikationen inte data från andra applikationer (endast grundläggande applikationsinformation ingår). Säkerhetskopiering och migrering måste göras manuellt inifrån de andra applikationerna.

### 4. Driftsättning och uppdatering

I delat minnesläge kommer versionen av andra applikationer automatiskt att följa huvudapplikationens uppgradering, vilket automatiskt säkerställer att applikationsversionerna är konsekventa.

### 5. Applikationssessioner

- Om en applikation använder en oberoende JWT-nyckel är applikationssessionen oberoende av huvudapplikationen och andra applikationer. Om ni kommer åt olika applikationer via underkataloger på samma domännamn, behöver ni logga in igen när ni växlar mellan applikationer eftersom applikationens TOKEN lagras i LocalStorage. Det rekommenderas att konfigurera oberoende domännamn för olika applikationer för att uppnå bättre sessionsisolering.
- Om en applikation inte använder en oberoende JWT-nyckel kommer den att dela huvudapplikationens session. När ni har besökt en annan applikation i samma webbläsare och återvänder till huvudapplikationen behöver ni inte logga in igen. Detta innebär dock en säkerhetsrisk; om användar-ID:n är desamma i olika applikationer kan det leda till att användare får obehörig åtkomst till data i andra applikationer.