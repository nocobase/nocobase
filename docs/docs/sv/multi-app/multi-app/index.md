---
pkg: '@nocobase/plugin-app-supervisor'
---

:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/multi-app/multi-app/index).
:::

# Hantering av flera applikationer

## Funktionsöversikt

Hantering av flera applikationer är NocoBase enhetliga lösning för applikationshantering, som används för att skapa och hantera flera fysiskt isolerade NocoBase-applikationsinstanser i en eller flera körningsmiljöer. Genom applikationsövervakaren (AppSupervisor) kan Ni skapa och underhålla flera applikationer från en enhetlig ingång för att möta behoven i olika verksamheter och skalningsstadier.

## Enskild applikation

I början av ett projekt börjar de flesta användare med en enskild applikation.

I detta läge behöver endast en NocoBase-instans distribueras, och alla affärsfunktioner, data och användare körs i samma applikation. Distributionen är enkel, konfigurationskostnaden är låg och den är mycket lämplig för prototypverifiering, små projekt eller interna verktyg.

Men i takt med att verksamheten gradvis blir mer komplex kommer en enskild applikation att möta vissa naturliga begränsningar:

- Funktioner läggs ständigt till, vilket gör systemet uppsvällt
- Svårt att isolera olika verksamheter från varandra
- Kostnaden för expansion och underhåll av applikationen fortsätter att stiga

Vid denna tidpunkt vill användare dela upp olika verksamheter i flera applikationer för att förbättra systemets underhållsmässighet och skalbarhet.

## Flera applikationer med delat minne

När Ni vill dela upp verksamheten men inte vill införa komplexa arkitekturer för distribution och drift, kan Ni uppgradera till läget för flera applikationer med delat minne.

I detta läge kan flera applikationer köras samtidigt i en NocoBase-instans. Varje applikation är oberoende, kan ansluta till en oberoende databas, och kan skapas, startas och stoppas individuellt, men de delar samma process och minnesutrymme. Ni behöver fortfarande bara underhålla en NocoBase-instans.

![](https://static-docs.nocobase.com/202512231055907.png)

Detta tillvägagångssätt medför tydliga förbättringar:

- Verksamheten kan delas upp per applikationsdimension
- Funktioner och konfigurationer mellan applikationer blir tydligare
- Lägre resursförbrukning jämfört med lösningar med flera processer eller behållare

Men eftersom alla applikationer körs i samma process delar de resurser som CPU och minne. En anomali eller hög belastning i en enskild applikation kan påverka stabiliteten hos andra applikationer.

När antalet applikationer fortsätter att öka, eller när högre krav ställs på isolering och stabilitet, behöver arkitekturen uppgraderas ytterligare.

## Hybrid distribution i flera miljöer

När verksamhetens omfattning och komplexitet når en viss nivå och antalet applikationer behöver expandera i stor skala, kommer läget för flera applikationer med delat minne att möta utmaningar som resurskonkurrens, stabilitet och säkerhet. I skalningsfasen kan Ni överväga att använda en hybrid distribution i flera miljöer för att stödja mer komplexa affärsscenarier.

Kärnan i denna arkitektur är införandet av en ingångsapplikation, det vill säga att distribuera en NocoBase som ett enhetligt hanteringscenter, samtidigt som flera NocoBase-instanser distribueras som körningsmiljöer för att faktiskt köra affärsapplikationer.

Ingångsapplikationen ansvarar för:

- Skapande, konfiguration och livscykelhantering av applikationer
- Utfärdande av hanteringskommandon och sammanställning av status

Miljön för applikationsinstanser ansvarar för:

- Att faktiskt bära och köra affärsapplikationer genom läget för flera applikationer med delat minne

För Er som användare kan flera applikationer fortfarande skapas och hanteras via en ingång, men internt:

- Olika applikationer kan köras på olika noder eller kluster
- Varje applikation kan använda oberoende databaser och middleware
- Högbelastade applikationer kan expanderas eller isoleras efter behov

![](https://static-docs.nocobase.com/202512231215186.png)

Detta tillvägagångssätt är lämpligt för SaaS-plattformar, ett stort antal demo-miljöer eller scenarier med flera hyresgäster, vilket förbättrar systemets stabilitet och underhållsmässighet samtidigt som flexibiliteten säkerställs.