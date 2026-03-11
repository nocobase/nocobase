:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/solution/crm/index).
:::

# NocoBase CRM 2.0-lösning

> Ett modulärt försäljningsledningssystem baserat på lågkods-plattformen NocoBase, med AI-medarbetare som stöd för beslutsfattande.

## 1. Bakgrund

### Utmaningar som försäljningsteam står inför

Företagens försäljningsteam stöter ofta på dessa problem i den dagliga verksamheten: ojämn kvalitet på leads gör det svårt att snabbt filtrera dem, uppföljning av affärsmöjligheter glöms lätt bort, kundinformation är spridd i e-post och olika system, försäljningsprognoser bygger helt på erfarenhet och godkännandeprocesser för offerter är oorganiserade.

**Typiska scenarier:** Snabb utvärdering och tilldelning av leads, övervakning av affärsmöjligheters hälsa, varningar för kundtapp, flerstegsgodkännande av offerter, samt koppling mellan e-post och kunder/affärsmöjligheter.

### Målanvändare

Försäljningsteam inom B2B, projektbaserad försäljning och utrikeshandel i små till medelstora samt stora företag. Dessa företag uppgraderar från Excel/e-posthantering till systematisk hantering och har höga krav på kunddatasäkerhet.

### Brister i befintliga lösningar

- **Hög kostnad**: Salesforce/HubSpot tar betalt per användare, vilket är svårt för små och medelstora företag att bära.
- **Funktionsöverbelastning**: Stora CRM-system har för många funktioner och hög inlärningströskel; mindre än 20 % av funktionerna används faktiskt.
- **Svårt att anpassa**: SaaS-system är svåra att anpassa till företagets egna affärsprocesser; till och med att ändra ett fält kräver en formell process.
- **Datasäkerhet**: Kunddata lagras på tredjepartsservrar, vilket innebär risker för efterlevnad och säkerhet.
- **Hög kostnad för egenutveckling**: Traditionell egenutveckling har långa cykler och höga underhållskostnader, vilket gör det svårt att snabbt anpassa sig när verksamheten förändras.

---

## 2. Differentierade fördelar

**Huvudsakliga produkter på marknaden:** Salesforce, HubSpot, Zoho CRM, Fxiaoke, Odoo CRM, SuiteCRM, etc.

**Fördelar på plattformsnivå:**

- **Konfiguration först**: Datamodeller, sidlayouter och affärsprocesser kan alla konfigureras via UI, utan att skriva kod.
- **Snabb uppbyggnad med lågkod**: Snabbare än egenutveckling och mer flexibelt än SaaS.
- **Modulär och nedbrytbar**: Varje modul är självständigt utformad och kan anpassas efter behov; den minsta användbara konfigurationen kräver endast modulerna Kund + Affärsmöjlighet.

**Vad traditionella CRM inte kan göra eller där kostnaden är extremt hög:**

- **Datasuveränitet**: Självhostad driftsättning, kunddata lagras på egna servrar för att uppfylla säkerhetskrav.
- **Inbyggd integration av AI-medarbetare**: AI-medarbetare är djupt inbäddade i affärssidorna och känner automatiskt av datakontexten, snarare än att bara vara "en AI-knapp".
- **All design kan kopieras**: Användare kan själva utöka lösningen baserat på mallar utan att vara beroende av leverantören.

---

## 3. Designprinciper

- **Låg kognitiv kostnad**: Enkelt gränssnitt, kärnfunktioner är tydliga vid en första anblick.
- **Affärsnytta före teknik**: Fokus på försäljningsscenarier snarare än teknisk uppvisning.
- **Utvecklingsbar**: Stöder stegvis lansering och gradvis förbättring.
- **Konfiguration prioriteras**: Det som kan konfigureras ska inte kodas.
- **Samarbete mellan människa och AI**: AI-medarbetare stöder beslutsfattande snarare än att ersätta säljarnas omdöme.

---

## 4. Översikt av lösningen

### Kärnkapacitet

- **Hantering av hela processen**: Lead → Affärsmöjlighet → Offert → Order → Kundframgång.
- **Modulär och anpassningsbar**: Fullständig version har 7 moduler, minsta användbara kräver endast 2 kärnmoduler.
- **Stöd för flera valutor**: Automatisk omvandling mellan CNY/USD/EUR/GBP/JPY.
- **AI-stöd**: Lead-poängsättning, prognos för vinstsannolikhet, förslag på nästa steg.

### Kärnmoduler

| Modul | Obligatorisk | Beskrivning | AI-stöd |
|------|:----:|------|--------|
| Kundhantering | ✅ | Kundprofiler, kontakter, kundhierarki | Hälsoutvärdering, varning för kundtapp |
| Hantering av affärsmöjligheter | ✅ | Försäljningstratt, stegförflyttning, aktivitetslogg | Vinstprognos, förslag på nästa steg |
| Lead-hantering | - | Lead-registrering, statusflöde, konverteringsspårning | Smart poängsättning |
| Offertshantering | - | Flera valutor, versionshantering, godkännandeprocesser | - |
| Orderhantering | - | Ordergenerering, betalningsspårning | - |
| Produkthantering | - | Produktkatalog, kategorier, trappstegsprissättning | - |
| E-postintegration | - | Skicka/ta emot e-post, CRM-koppling | Sentimentanalys, sammanfattningsgenerering |

### Anpassning av lösningen

- **Fullständig version** (alla 7 moduler): För B2B-försäljningsteam med kompletta processer.
- **Standardversion** (Kund + Affärsmöjlighet + Offert + Order + Produkt): För försäljningsledning i små och medelstora företag.
- **Lättviktsversion** (Kund + Affärsmöjlighet): För enkel spårning av kunder och affärsmöjligheter.
- **Utrikeshandelsversion** (Kund + Affärsmöjlighet + Offert + E-post): För företag inom utrikeshandel.

---

## 5. AI-medarbetare

CRM-systemet är förinställt med 5 AI-medarbetare som är djupt inbäddade i affärssidorna. Till skillnad från vanliga AI-chattverktyg kan de automatiskt identifiera den data Ni för närvarande tittar på – oavsett om det är en lead-lista, detaljer om en affärsmöjlighet eller e-posthistorik – utan att Ni behöver kopiera och klistra in manuellt.

**Användning**: Klicka på den flytande AI-bollen i nedre högra hörnet av sidan, eller klicka direkt på AI-ikonen bredvid ett block för att anropa motsvarande medarbetare. Ni kan också förinställa vanliga uppgifter för varje medarbetare så att de kan aktiveras med ett klick nästa gång.

| Medarbetare | Ansvar | Typisk användning i CRM |
|------|------|-----------------|
| **Viz** | Insiktsanalytiker | Analys av lead-kanaler, försäljningstrender, pipelinens hälsa |
| **Ellis** | E-postexpert | Utkast till uppföljningsmejl, generera sammanfattningar av kommunikation |
| **Lexi** | Översättningsassistent | Flerspråkig e-post, kommunikation med utländska kunder |
| **Dara** | Visualiseringsexpert | Konfiguration av rapporter och diagram, uppbyggnad av instrumentpaneler |
| **Orin** | Uppgiftsplanerare | Dagliga prioriteringar, förslag på nästa steg |

### Affärsvärde av AI-medarbetare

| Värdedimension | Specifik effekt |
|----------|----------|
| Ökad effektivitet | Lead-poängsättning sker automatiskt, vilket sparar manuell granskning; uppföljningsmejl skrivs med ett klick. |
| Empowerment | Analys av försäljningsdata är alltid tillgänglig utan att behöva vänta på rapporter från datateamet. |
| Kvalitetsförbättring | Professionell e-post + AI-polering, flerspråkig kommunikation utan hinder för utrikeshandelsteam. |
| Beslutsstöd | Realtidsbedömning av vinstchans och förslag på nästa steg minskar risken att affärsmöjligheter går förlorade på grund av missad uppföljning. |

---

## 6. Höjdpunkter

**Modulär och nedbrytbar** — Varje modul är självständigt utformad och kan slås på eller av individuellt. Minsta konfiguration kräver endast kärnmodulerna Kund + Affärsmöjlighet; använd det som behövs, inget tvång att använda allt.

**Komplett försäljningsloop** — Lead → Affärsmöjlighet → Offert → Order → Betalning → Kundframgång. Data är sammanlänkad genom hela kedjan utan behov av att byta mellan flera system.

**Inbyggd integration av AI-medarbetare** — Inte bara "en AI-knapp", utan 5 AI-medarbetare integrerade i varje affärssida som automatiskt hämtar aktuell datakontext för att aktivera analys och förslag med ett klick.

**Djup e-postintegration** — E-post kopplas automatiskt till kunder, kontakter och affärsmöjligheter. Stöder Gmail och Outlook, med flera engelska e-postmallar som täcker vanliga försäljningsscenarier.

**Stöd för utrikeshandel med flera valutor** — Stöder CNY/USD/EUR/GBP/JPY, konfigurerbar växelkursomvandling, lämplig för utrikeshandel och internationella försäljningsteam.

---

## 7. Installation och användning

Använd migreringsfunktionen i NocoBase för att migrera CRM-applikationspaketet till målmiljön med ett klick.

**Redo att användas direkt:** Förkonfigurerade samlingar, arbetsflöden, instrumentpaneler och vyer för flera roller (försäljningschef/säljare/ledningsgrupp). 37 e-postmallar täcker vanliga försäljningsscenarier.

---

## 8. Framtida planering

- **Automatisering av affärsmöjligheter**: Aviseringar triggas vid stegförflyttning, automatiska varningar för stillastående affärsmöjligheter för att minska manuell övervakning.
- **Godkännandeprocesser**: Flerstegs arbetsflöde för godkännande av offerter med stöd för godkännande i mobilen.
- **AI-automatisering**: AI-medarbetare bäddas in i arbetsflöden för att stödja automatisk körning i bakgrunden, vilket möjliggör obemannad lead-poängsättning och analys av affärsmöjligheter.
- **Mobilanpassning**: Mobilvänligt gränssnitt för att följa upp kunder när som helst och var som helst.
- **Stöd för flera klienter (Multi-tenant)**: Horisontell expansion med flera utrymmen/applikationer för att distribuera till olika försäljningsteam för oberoende drift.

---

*Dokumentversion: v2.0 | Uppdateringsdatum: 2026-02-06*