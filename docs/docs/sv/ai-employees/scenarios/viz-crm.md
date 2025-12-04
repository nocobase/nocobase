
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# AI-agent · Viz: Konfigurationsguide för CRM-scenarier

> Använd CRM-exemplet för att lära dig hur du får din AI-insiktsanalytiker att verkligen förstå din verksamhet och utnyttja dess fulla potential.

## 1. Introduktion: Låt Viz gå från att "se data" till att "förstå verksamheten"

I NocoBase-systemet är **Viz** en förkonfigurerad AI-insiktsanalytiker.
Den kan känna igen sidkontext (som Leads, Opportunities, Accounts) och generera trenddiagram, trattdiagram och KPI-kort.
Men som standard har den bara de mest grundläggande frågefunktionerna:

| Verktyg | Funktionsbeskrivning | Säkerhet |
| --- | --- | --- |
| Get Collection Names | Hämta lista över samlingar | ✅ Säker |
| Get Collection Metadata | Hämta fältstruktur | ✅ Säker |

Dessa verktyg låter Viz bara "känna igen struktur", men inte verkligen "förstå innehåll".
För att den ska kunna generera insikter, upptäcka avvikelser och analysera trender behöver ni **utöka den med mer lämpliga analysverktyg**.

I den officiella CRM-demon använde vi två metoder:

*   **Overall Analytics (Allmän analysmotor)**: En mallbaserad, säker och återanvändbar lösning;
*   **SQL Execution (Specialiserad analysmotor)**: Erbjuder större flexibilitet men medför större risker.

Dessa två är inte de enda alternativen; de är snarare ett **designparadigm**:

> Ni kan följa dess principer för att skapa en implementering som är bättre anpassad till er egen verksamhet.

---

## 2. Viz struktur: Stabil personlighet + flexibla uppgifter

För att förstå hur ni utökar Viz måste ni först förstå dess interna lagerdesign:

| Lager | Beskrivning | Exempel |
| --- | --- | --- |
| **Rolldefinition** | Viz personlighet och analysmetod: Förstå → Fråga → Analysera → Visualisera | Fast |
| **Uppgiftsdefinition** | Anpassade instruktioner och verktygskombinationer för ett specifikt affärsscenario | Modifierbar |
| **Verktygskonfiguration** | Bryggan för Viz att anropa externa datakällor eller arbetsflöden | Fritt utbytbar |

Denna lagerdesign gör att Viz kan bibehålla en stabil personlighet (konsekvent analyslogik) samtidigt som den snabbt kan anpassas till olika affärsscenarier (CRM, sjukhushantering, kanalanalys, produktionsdrift...).

## 3. Mönster ett: Mallbaserad analysmotor (rekommenderas)

### 3.1 Principöversikt

**Overall Analytics** är den centrala analysmotorn i CRM-demon.
Den hanterar alla SQL-frågor via en **samling för dataanalysmallar (data_analysis)**.
Viz skriver inte SQL direkt, utan **anropar fördefinierade mallar** för att generera resultat.

Arbetsflödet är följande:

```mermaid
flowchart TD
    A[Viz tar emot uppgift] --> B[Anropar arbetsflödet Overall Analytics]
    B --> C[Matchar mall baserat på aktuell sida/uppgift]
    C --> D[Exekverar mallens SQL (skrivskyddad)]
    D --> E[Returnerar dataresultat]
    E --> F[Viz genererar diagram + kort tolkning]
```

På så sätt kan Viz generera säkra och standardiserade analysresultat på några sekunder,
och administratörer kan centralt hantera och granska alla SQL-mallar.

---

### 3.2 Mallens samlingsstruktur (data_analysis)

| Fältnamn | Typ | Beskrivning | Exempel |
| --- | --- | --- | --- |
| **id** | Integer | Primärnyckel | 1 |
| **name** | Text | Namn på analysmall | Leads Data Analysis |
| **collection** | Text | Motsvarande samling | Lead |
| **sql** | Code | SQL-sats för analys (skrivskyddad) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **description** | Markdown | Mallbeskrivning eller definition | "Räkna leads per steg" |
| **createdAt / createdBy / updatedAt / updatedBy** | Systemfält | Revisionsinformation | Autogenererad |

#### Mallexempel i CRM-demon

| Namn | Samling | Beskrivning |
| --- | --- | --- |
| Account Data Analysis | Account | Kontodataanalys |
| Contact Data Analysis | Contact | Kontaktdataanalys |
| Leads Data Analysis | Lead | Leads-trendanalys |
| Opportunity Data Analysis | Opportunity | Tratt för affärsmöjlighetssteg |
| Task Data Analysis | Todo Tasks | Statistik över status för att-göra-uppgifter |
| Users (Sales Reps) Data Analysis | Users | Prestandajämförelse för säljare |

---

### 3.3 Fördelar med detta mönster

| Dimension | Fördel |
| --- | --- |
| **Säkerhet** | All SQL lagras och granskas, vilket undviker direkt generering av frågor. |
| **Underhållbarhet** | Mallar hanteras centralt och uppdateras enhetligt. |
| **Återanvändbarhet** | Samma mall kan återanvändas av flera uppgifter. |
| **Portabilitet** | Kan enkelt migreras till andra system, kräver bara samma samlingsstruktur. |
| **Användarupplevelse** | Affärsanvändare behöver inte bekymra sig om SQL; de behöver bara initiera en analysförfrågan. |

> 📘 Denna `data_analysis`-samling behöver inte heta just så.
> Nyckeln är: **att lagra analyslogiken på ett mallbaserat sätt**, och att den anropas enhetligt av ett arbetsflöde.

---

### 3.4 Hur ni får Viz att använda det

I uppgiftsdefinitionen kan ni tydligt instruera Viz:

```markdown
Hej Viz,

Vänligen analysera data för den aktuella modulen.

**Prioritet:** Använd verktyget Overall Analytics för att hämta analysresultat från mallsamlingen.
**Om ingen matchande mall hittas:** Ange att en mall saknas och föreslå att administratören lägger till en.

Krav på utdata:
- Generera ett separat diagram för varje resultat;
- Inkludera en kort beskrivning på 2–3 meningar under diagrammet;
- Fabricera inte data eller gör antaganden.
```

På så sätt kommer Viz automatiskt att anropa arbetsflödet, matcha den mest lämpliga SQL-satsen från mallsamlingen och generera diagrammet.

---

## 4. Mönster två: Specialiserad SQL-exekverare (använd med försiktighet)

### 4.1 Tillämpliga scenarier

När ni behöver utforskande analyser, ad hoc-frågor eller JOIN-aggregeringar över flera samlingar, kan ni låta Viz anropa ett verktyg för **SQL Execution**.

Detta verktygs funktioner är:

*   Viz kan direkt generera `SELECT`-frågor;
*   Systemet exekverar dem och returnerar resultatet;
*   Viz ansvarar för analys och visualisering.

Exempeluppgift:

> "Vänligen analysera trenden för konverteringsfrekvenser för leads per region under de senaste 90 dagarna."

I detta fall kan Viz generera:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Risker och skyddsrekommendationer

| Riskpunkt | Skyddsstrategi |
| --- | --- |
| Generera skrivoperationer | Tvingande begränsning till `SELECT` |
| Åtkomst till orelaterade samlingar | Validera om samlingsnamnet finns |
| Prestandarisk med stora samlingar | Begränsa tidsintervall, använd LIMIT för antal rader |
| Spårbarhet för operationer | Aktivera frågeloggning och revision |
| Användarbehörighetskontroll | Endast administratörer får använda detta verktyg |

> Allmänna rekommendationer:
>
> *   Vanliga användare bör endast ha mallbaserad analys (Overall Analytics) aktiverad;
> *   Endast administratörer eller seniora analytiker bör tillåtas använda SQL Execution.

---

## 5. Om ni vill bygga er egen "Overall Analytics"

Här är en enkel, generell metod som ni helt kan replikera i vilket system som helst (oberoende av NocoBase):

### Steg 1: Designa mallsamlingen

Samlingsnamnet kan vara vad som helst (t.ex. `analysis_templates`).
Den behöver bara inkludera fälten: `name`, `sql`, `collection` och `description`.

### Steg 2: Skriv en tjänst eller ett arbetsflöde för "Hämta mall → Exekvera"

Logik:

1.  Ta emot uppgiften eller sidkontexten (t.ex. den aktuella samlingen);
2.  Matcha en mall;
3.  Exekvera mallens SQL (skrivskyddad);
4.  Returnera en standardiserad datastruktur (rader + fält).

### Steg 3: Låt AI:n anropa detta gränssnitt

Uppgiftsinstruktionen kan skrivas så här:

```
Försök först att anropa mallanalysverktyget. Om ingen matchande analys hittas i mallarna, använd då SQL-exekveraren.
Se till att alla frågor är skrivskyddade och generera diagram för att visa resultaten.
```

> På så sätt kommer ert AI-agentsystem att ha analysfunktioner som liknar CRM-demon, men det kommer att vara helt oberoende och anpassningsbart.

---

## 6. Bästa praxis och designrekommendationer

| Rekommendation | Beskrivning |
| --- | --- |
| **Prioritera mallbaserad analys** | Säker, stabil och återanvändbar |
| **Använd SQL Execution endast som ett komplement** | Begränsat till intern felsökning eller ad hoc-frågor |
| **Ett diagram, en huvudpunkt** | Håll utdata tydlig och undvik överdriven rörighet |
| **Tydlig mallnamngivning** | Namnge enligt sida/verksamhetsområde, t.ex. `Leads-Stage-Conversion` |
| **Korta och tydliga förklaringar** | Komplettera varje diagram med en sammanfattning på 2–3 meningar |
| **Ange när en mall saknas** | Informera användaren "Ingen motsvarande mall hittades" istället för att ge en tom utdata |

---

## 7. Från CRM-demon till ert scenario

Oavsett om ni arbetar med sjukhus-CRM, tillverkning, lagerlogistik eller utbildningsrekrytering,
så länge ni kan svara på följande tre frågor kan Viz tillföra värde till ert system:

| Fråga | Exempel |
| --- | --- |
| **1. Vad vill ni analysera?** | Leads-trender / Affärsfaser / Utrustningsutnyttjandegrad |
| **2. Var finns datan?** | Vilken samling, vilka fält |
| **3. Hur vill ni presentera det?** | Linjediagram, tratt, cirkeldiagram, jämförelsetabell |

När ni har definierat detta behöver ni bara:

*   Skriva analyslogiken i mallsamlingen;
*   Fästa uppgiftsinstruktionen på sidan;
*   Viz kan då "ta över" er rapportanalys.

---

## 8. Slutsats: Ta med er paradigmet

"Overall Analytics" och "SQL Execution" är bara två exempel på implementeringar.
Viktigare är tanken bakom dem:

> **Få AI-agenten att förstå er affärslogik, inte bara att exekvera instruktioner.**

Oavsett om ni använder NocoBase, ett privat system eller ert eget anpassade arbetsflöde,
kan ni replikera denna struktur:

*   Centraliserade mallar;
*   Anrop via arbetsflöden;
*   Skrivskyddad exekvering;
*   AI-presentation.

På så sätt är Viz inte längre bara en "AI som kan generera diagram",
utan en sann analytiker som förstår er data, era definitioner och er verksamhet.