:::tip{title="AI-översättningsmeddelande"}
Detta dokument har översatts av AI. För korrekt information, se [den engelska versionen](/solution/ticket-system/index).
:::

# Introduktion till ärendehanteringslösning

> **Observera**: Detta är en tidig förhandsversion. Funktionerna är ännu inte fullständiga och vi arbetar kontinuerligt med förbättringar. Feedback är välkommen!

## 1. Bakgrund (Varför)

### Vilka bransch- / roll- / hanteringsproblem som löses

Företag möter olika typer av tjänstebegäranden i den dagliga verksamheten: utrustningsreparationer, IT-support, kundklagomål, konsultationer etc. Dessa förfrågningar kommer från spridda källor (CRM-system, fälttjänstingenjörer, e-post, offentliga formulär etc.), har olika bearbetningsflöden och saknar enhetliga spårnings- och hanteringsmekanismer.

**Exempel på typiska affärsscenarier:**

- **Utrustningsreparation**: Eftermarknadsteam hanterar reparationsbegäranden och behöver registrera enhetsspecifik information som serienummer, felkoder och reservdelar.
- **IT-support**: IT-avdelningen hanterar interna anställdas förfrågningar om lösenordsåterställning, programvaruinstallation och nätverksproblem.
- **Kundklagomål**: Kundtjänstteam hanterar klagomål från flera kanaler; vissa emotionellt laddade ärenden behöver prioriteras.
- **Kundsjälvbetjäning**: Slutkunder vill enkelt kunna skicka in tjänstebegäranden och följa handläggningsprocessen.

### Målgruppsprofil

| Dimension | Beskrivning |
|-----------|-------------|
| Företagsstorlek | Små till medelstora företag samt stora företag med betydande kundtjänstbehov |
| Rollstruktur | Kundtjänstteam, IT-support, eftermarknadsteam, verksamhetschefer |
| Digital mognad | Nybörjare till medelnivå, som söker att uppgradera från Excel/e-posthantering till systematisk hantering |

### Problem med nuvarande dominerande lösningar

- **Hög kostnad / Långsam anpassning**: SaaS-ärendesystem är dyra och anpassade utvecklingscykler är långa.
- **Systemfragmentering, datasilor**: Verksamhetsdata är spridd över olika system, vilket gör det svårt att förena analys och beslutsfattande.
- **Snabba affärsförändringar, svårt att utveckla**: När affärskraven ändras är systemen svåra att justera snabbt.
- **Långsam responstid**: Förfrågningar som flödar mellan olika system kan inte tilldelas omedelbart.
- **Otydlig process**: Kunder kan inte spåra ärendets framsteg; frekventa förfrågningar ökar trycket på kundtjänst.
- **Svårt att garantera kvalitet**: Brist på SLA-övervakning; tidsöverskridanden och negativ feedback kan inte larmas i tid.

---

## 2. Referensprodukter och jämförelse (Benchmark)

### Dominerande produkter på marknaden

- **SaaS**: Till exempel Salesforce, Zendesk, Odoo etc.
- **Anpassade system / Interna system**

### Jämförelsedimensioner

- Funktionsomfång
- Flexibilitet
- Utbyggbarhet
- AI-användning

### Skillnader med NocoBase-lösningen

**Fördelar på plattformsnivå:**

- **Konfigurationsprioritet**: Från underliggande datatabeller till affärstyper, SLA och kompetensbaserad dirigering – allt hanteras via konfiguration.
- **Snabb utveckling med lågkod**: Snabbare än egenutveckling och mer flexibelt än SaaS.

**Vad traditionella system inte kan göra eller där kostnaden är extremt hög:**

- **AI-nativ integration**: Med hjälp av NocoBase AI-plugins möjliggörs intelligent klassificering, hjälp vid ifyllnad och kunskapsrekommendationer.
- **All design kan kopieras av användare**: Användare kan själva bygga vidare på mallar.
- **T-formad dataarkitektur**: Huvudtabell + affärsspecifika undertabeller; att lägga till nya affärstyper kräver endast tillägg av en undertabell.

---

## 3. Designprinciper (Principles)

- **Låg kognitiv kostnad**
- **Verksamhet före teknik**
- **Utvecklingsbar snarare än engångsprojekt**
- **Konfiguration först, kod som reserv**
- **Samarbete mellan människa och AI, inte AI som ersätter människan**
- **All design ska kunna kopieras av användaren**

---

## 4. Lösningsöversikt (Solution Overview)

### Sammanfattning

En universell plattform för ärendehantering byggd på NocoBase lågkodsplattform, som uppnår:

- **Enhetlig ingång**: Integration av flera källor, standardiserad bearbetning.
- **Intelligent distribution**: AI-assisterad klassificering, belastningsutjämnad tilldelning.
- **Polymorf verksamhet**: Kärntabell + affärsspecifika undertabeller, flexibel utbyggnad.
- **Sluten feedbackloop**: SLA-övervakning, kundutvärdering, hantering av negativ feedback.

### Bearbetningsflöde för ärenden

```
Inmatning från flera källor → Förbearbetning/AI-analys → Intelligent tilldelning → Manuellt utförande → Feedbackloop
          ↓                          ↓                          ↓                    ↓                ↓
   Dubblettkontroll           Avsiktsigenkänning          Kompetensmatchning      Statusflöde      Nöjdhetsbetyg
                              Sentimentanalys             Belastningsutjämning    SLA-övervakning  Uppföljning negativ feedback
                              Autosvar                    Köhantering             Kommunikation    Dataarkivering
```

### Lista över kärnmoduler

| Modul | Beskrivning |
|-------|-------------|
| Ärendeintag | Offentliga formulär, kundportal, registrering via agent, API/Webhook, e-postanalys |
| Ärendehantering | CRUD för ärenden, statusflöde, tilldelning/överlämning, kommunikation via kommentarer, loggar |
| Verksamhetsutbyggnad | Undertabeller för utrustningsreparation, IT-support, kundklagomål etc. |
| SLA-hantering | SLA-konfiguration, varningar vid tidsöverskridande, eskalering |
| Kundhantering | Huvudtabell för kunder, kontakthantering, kundportal |
| Utvärderingssystem | Multidimensionell poängsättning, snabbetiketter, NPS, varningar för negativ feedback |
| AI-stöd | Avsiktsklassificering, sentimentanalys, kunskapsrekommendationer, svarshjälp, språkputsning |

### Visning av kärngränssnitt

![ticketing-imgs-2026-01-01-00-46-12](https://static-docs.nocobase.com/ticketing-imgs-2026-01-01-00-46-12.jpg)

---

## 5. AI-anställda (AI Employee)

### Typer av AI-anställda och scenarier

- **Kundtjänstassistent**, **Säljassistent**, **Dataanalytiker**, **Granskare**
- Assisterar människor, ersätter dem inte

### Kvantifiering av AI-anställdas värde

I denna lösning kan AI-anställda:

| Värdedimension | Specifik effekt |
|----------------|-----------------|
| Ökad effektivitet | Automatisk klassificering minskar manuell sorteringstid med 50%+; kunskapsrekommendationer påskyndar problemlösning |
| Minskade kostnader | Enkla frågor besvaras automatiskt, vilket minskar arbetsbelastningen för mänsklig kundtjänst |
| Stärka mänskliga anställda | Sentimentvarningar hjälper kundtjänst att förbereda sig; språkputsning av svar förbättrar kommunikationskvaliteten |
| Ökad kundnöjdhet | Snabbare respons, mer exakt tilldelning, mer professionella svar |

---

## 6. Höjdpunkter (Highlights)

### 1. T-formad dataarkitektur

- Alla ärenden delar huvudtabell med enhetlig flödeslogik.
- Affärsspecifika undertabeller innehåller unika fält för flexibel utbyggnad.
- Att lägga till nya affärstyper kräver endast tillägg av en undertabell, utan att påverka huvudflödet.

### 2. Komplett livscykel för ärenden

- Nytt → Tilldelat → Bearbetas → Vilande → Löst → Stängt.
- Stöd för komplexa scenarier som överlämning, retur och återöppning.
- SLA-tidtagning är exakt ner till paus i viloläge.

### 3. Enhetlig integration av flera kanaler

- Offentliga formulär, kundportal, API, e-post, registrering via agent.
- Idempotenskontroll förhindrar att dubbletter skapas.

### 4. AI-nativ integration

- Inte bara "en AI-knapp", utan integrerat i varje steg.
- Avsiktsigenkänning, sentimentanalys, kunskapsrekommendationer och språkputsning av svar.

---

## 7. Roadmap (Uppdateras löpande)

- **Systeminbäddning**: Stöd för att bädda in ärendemodulen i olika affärssystem som ERP, CRM etc.
- **Ärendesammankoppling**: Integration av ärenden och statusåterkoppling mellan uppströms- och nedströmssystem för samarbete över systemgränser.
- **AI-automatisering**: AI-anställda inbäddade i arbetsflöden med stöd för automatisk körning i bakgrunden för obemannad hantering.
- **Stöd för flera klienter (Multi-tenancy)**: Horisontell skalning via flera utrymmen/appar, vilket möjliggör oberoende drift för olika kundtjänstteam.
- **Kunskapsbas RAG**: Automatisk vektorisering av all data (ärenden, kunder, produkter etc.) för intelligent sökning och kunskapsrekommendationer.
- **Flerspråkigt stöd**: Gränssnitt och innehåll stöder flera språk för att möta behoven hos internationella team.