:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# AI-medarbetare · Guide för prompt-engineering

> Från "hur man skriver" till "att skriva bra" – den här guiden lär dig att skriva högkvalitativa prompter på ett enkelt, stabilt och återanvändbart sätt.

## 1. Varför prompter är avgörande

En prompt är AI-medarbetarens "jobbeskrivning" och avgör direkt dess stil, gränser och kvalitet på utdata.

**Jämförelseexempel:**

❌ Otydlig prompt:

```
Du är en dataanalysassistent som hjälper användare att analysera data.
```

✅ Tydlig och kontrollerbar prompt:

```
Ni är Viz, en dataanalys-expert.

Rolldefinition
- Stil: Insiktsfull, tydlig och visualiseringsfokuserad
- Uppdrag: Att förvandla komplex data till förståeliga "diagramberättelser"

Arbetsflöde
1) Förstå krav
2) Generera säker SQL (använder endast SELECT)
3) Extrahera insikter
4) Presentera med diagram

Hårda regler
- MÅSTE: Använd endast SELECT, modifiera aldrig data
- ALLTID: Producera diagramvisualiseringar som standard
- ALDRIG: Fabricera eller gissa data

Utdataformat
Kort slutsats (2-3 meningar) + ECharts diagram JSON
```

**Slutsats**: En bra prompt förklarar tydligt "vem den är, vad den ska göra, hur den ska göra det och vilken standard den ska uppnå", vilket gör AI:ns prestanda stabil och kontrollerbar.

## 2. Promptens "nio element" – den gyllene formeln

En struktur som visat sig vara effektiv i praktiken:

```
Namngivning + Dubbla instruktioner + Simulerad bekräftelse + Upprepning + Hårda regler
+ Bakgrundsinformation + Positiv förstärkning + Referensexempel + Negativa exempel (valfritt)
```

### 2.1 Elementbeskrivningar

| Element              | Vad det löser                          | Varför det är effektivt               |
| -------------------- | -------------------------------------- | ------------------------------------ |
| Namngivning          | Förtydligar identitet och stil         | Hjälper AI:n att etablera en "rollkänsla" |
| Dubbla instruktioner | Skiljer "vem jag är" från "vad jag behöver göra" | Minskar rollförvirring               |
| Simulerad bekräftelse | Upprepar förståelsen före utförande    | Förhindrar avvikelser                |
| Upprepning           | Nyckelpunkter återkommer upprepade gånger | Ökar prioritet                       |
| Hårda regler         | MÅSTE/ALLTID/ALDRIG                    | Etablerar en grundlinje              |
| Bakgrundsinformation | Nödvändig kunskap och begränsningar    | Minskar missförstånd                 |
| Positiv förstärkning | Vägleder förväntningar och stil        | Stabilare ton och prestanda          |
| Referensexempel      | Ger en direkt modell att imitera       | Utdata är närmare förväntningarna    |
| Negativa exempel    | Undviker vanliga fallgropar            | Korrigerar misstag, blir mer exakt med användning |

### 2.2 Snabbstartsmall

```yaml
# 1) Namngivning
Ni är [Namn], en utmärkt [Roll/Specialist].

# 2) Dubbla instruktioner
## Roll
Stil: [Adjektiv x2-3]
Uppdrag: [En mening som sammanfattar huvudansvaret]

## Arbetsflöde för uppgift
1) Förstå: [Nyckelpunkt]
2) Utför: [Nyckelpunkt]
3) Verifiera: [Nyckelpunkt]
4) Presentera: [Nyckelpunkt]

# 3) Simulerad bekräftelse
Före utförande, upprepa din förståelse: "Jag förstår att ni behöver... Jag kommer att uppnå detta genom att..."

# 4) Upprepning
Kärnkrav: [1-2 mest kritiska punkter] (ska förekomma minst två gånger i början/arbetsflödet/slutet)

# 5) Hårda regler
MÅSTE: [Obrutbar regel]
ALLTID: [Princip att alltid följa]
ALDRIG: [Uttryckligen förbjuden åtgärd]

# 6) Bakgrundsinformation
[Nödvändig domänkunskap/kontext/vanliga fallgropar]

# 7) Positiv förstärkning
Ni utmärker er inom [Förmåga] och är skicklig på [Specialitet]. Vänligen bibehåll denna stil för att slutföra uppgiften.

# 8) Referensexempel
[Ge ett kortfattat exempel på den "ideala utdatan"]

# 9) Negativa exempel (valfritt)
- [Felaktigt sätt] → [Korrekt sätt]
```

## 3. Praktiskt exempel: Viz (Dataanalys)

Låt oss kombinera de nio elementen för att skapa ett komplett, "färdigt att använda" exempel.

```text
# Namngivning
Ni är Viz, en dataanalys-expert.

# Dubbla instruktioner
【Roll】
Stil: Insiktsfull, tydlig och visuellt orienterad
Uppdrag: Att förvandla komplex data till "diagramberättelser"

【Arbetsflöde för uppgift】
1) Förstå: Analysera användarens datakrav och omfång för mätvärden
2) Fråga: Generera säker SQL (fråga endast verklig data, endast SELECT)
3) Analysera: Extrahera nyckelinsikter (trender/jämförelser/andelar)
4) Presentera: Välj ett lämpligt diagram för tydlig presentation

# Simulerad bekräftelse
Före utförande, upprepa: "Jag förstår att ni vill analysera [objekt/omfång], och jag kommer att presentera resultaten via [fråge- och visualiseringsmetod]."

# Upprepning
Upprepa: Dataautenticitet är prioritet, kvalitet framför kvantitet; om ingen data finns tillgänglig, ange det sanningsenligt.

# Hårda regler
MÅSTE: Använd endast SELECT-frågor, modifiera ingen data
ALLTID: Producera ett visuellt diagram som standard
ALDRIG: Fabricera eller gissa data

# Bakgrundsinformation
- ECharts kräver "ren JSON"-konfiguration, utan kommentarer/funktioner
- Varje diagram bör fokusera på ett tema, undvik att stapla flera mätvärden

# Positiv förstärkning
Ni är skicklig på att extrahera handlingsbara slutsatser från verklig data och uttrycka dem med de enklaste diagrammen.

# Referensexempel
Beskrivning (2-3 meningar) + Diagram JSON

Exempelbeskrivning:
Denna månad tillkom 127 nya leads, en ökning med 23% jämfört med föregående månad, främst från tredjepartskanaler.

Exempeldiagram:
{
  "title": {"text": "Månadens leadstrend"},
  "tooltip": {"trigger": "axis"},
  "xAxis": {"type": "category", "data": ["Vecka1","Vecka2","Vecka3","Vecka4"]},
  "yAxis": {"type": "value"},
  "series": [{"type": "line", "data": [28,31,35,33]}]
}

# Negativa exempel (valfritt)
- Blanda språk → Bibehåll språkkonsistens
- Överbelastade diagram → Varje diagram bör endast uttrycka ett tema
- Ofullständig data → Ange sanningsenligt "Ingen data tillgänglig"
```

**Designpunkter**

* "Autenticitet" förekommer flera gånger i arbetsflödet, upprepningar och regler (stark påminnelse)
* Välj en tvådelad "beskrivning + JSON"-utdata för enkel integration med frontend
* Specificera "skrivskyddad SQL" för att minska risker

## 4. Hur man förbättrar prompter över tid

### 4.1 Femstegsiteration

```
Börja med en fungerande version → Testa i liten skala → Logga problem → Lägg till regler/exempel för att åtgärda problem → Testa igen
```

<img src="https://static-docs.nocobase.com/prompt-engineering-guide-2025-11-02-20-19-54.png" alt="Optimeringsprocess" width="50%">

Vi rekommenderar att ni testar 5–10 typiska uppgifter på en gång och slutför en omgång inom 30 minuter.

### 4.2 Principer och förhållanden

*   **Prioritera positiv vägledning**: Berätta först för AI:n vad den ska göra
*   **Problemdriven förbättring**: Lägg till begränsningar först när problem uppstår
*   **Måttliga begränsningar**: Stapla inte "förbud" från början

Erfarenhetsbaserat förhållande: **80% positivt : 20% negativt**.

### 4.3 En typisk optimering

**Problem**: Överbelastade diagram, dålig läsbarhet
**Optimering**:

1.  I "Bakgrundsinformation", lägg till: ett tema per diagram
2.  I "Referensexempel", ge ett "diagram med enskilt mätvärde"
3.  Om problemet kvarstår, lägg till en hård begränsning i "Hårda regler/Upprepning"

## 5. Avancerade tekniker

### 5.1 Använd XML/taggar för tydligare struktur (rekommenderas för långa prompter)

När innehållet överstiger 1000 tecken eller kan vara förvirrande, är det stabilare att använda taggar för partitionering:

```xml
<Roll>Ni är Dex, en dataorganiserings-expert.</Roll>
<Stil>Noggrann, exakt och organiserad.</Stil>

<Uppgift>
Måste slutföras i följande steg:
1. Identifiera nyckelfält
2. Extrahera fältvärden
3. Standardisera format (Datum ÅÅÅÅ-MM-DD)
4. Mata ut JSON
</Uppgift>

<Regler>
MÅSTE: Bibehålla noggrannheten i fältvärden
ALDRIG: Gissa saknad information
ALLTID: Markera osäkra poster
</Regler>

<Exempel>
{"Namn":"John Doe","Datum":"2024-01-15","Belopp":5000,"Status":"Bekräftad"}
</Exempel>
```

### 5.2 "Bakgrund + Uppgift" – skiktad metod (ett mer intuitivt sätt)

*   **Bakgrund** (långsiktig stabilitet): Vem denna medarbetare är, dess stil och vilka förmågor den har
*   **Uppgift** (vid behov): Vad som ska göras nu, vilka mätvärden som ska fokuseras på och vad standardomfånget är

Detta matchar naturligt NocoBases "medarbetare + uppgift"-modell: **en fast bakgrund med flexibla uppgifter**.

### 5.3 Modulär återanvändning

Bryt ner vanliga regler i moduler för att mixa och matcha efter behov:

**Datasäkerhetsmodul**

```
MÅSTE: Använd endast SELECT
ALDRIG: Utför INSERT/UPDATE/DELETE
```

**Utdata-strukturmodul**

```
Utdata måste inkludera:
1) Kort beskrivning (2-3 meningar)
2) Kärninnehåll (diagram/data/kod)
3) Valfria förslag (om några)
```

## 6. Gyllene regler (praktiska slutsatser)

1.  En AI för en typ av jobb; specialisering är stabilare
2.  Exempel är effektivare än slagord; ge positiva modeller först
3.  Använd MÅSTE/ALLTID/ALDRIG för att sätta gränser
4.  Använd ett processorienterat tillvägagångssätt för att minska osäkerhet
5.  Börja i liten skala, testa mer, modifiera mindre och iterera kontinuerligt
6.  Överbegränsa inte; undvik att "hårdkoda" beteende
7.  Logga problem och ändringar för att skapa versioner
8.  80/20: Förklara först "hur man gör rätt", begränsa sedan "vad man inte ska göra fel"

## 7. Vanliga frågor

**F1: Vad är den ideala längden?**

*   Grundläggande medarbetare: 500–800 tecken
*   Komplex medarbetare: 800–1500 tecken
*   Rekommenderas inte >2000 tecken (kan vara långsamt och redundant)
    Standard: Täck alla nio element, men utan överflödigt innehåll.

**F2: Vad händer om AI:n inte följer instruktionerna?**

1.  Använd MÅSTE/ALLTID/ALDRIG för att förtydliga gränser
2.  Upprepa nyckelkrav 2–3 gånger
3.  Använd taggar/partitioner för att förbättra strukturen
4.  Ge fler positiva exempel, färre abstrakta principer
5.  Utvärdera om en kraftfullare modell behövs

**F3: Hur balanserar man positiv och negativ vägledning?**
Skriv först de positiva delarna (roll, arbetsflöde, exempel), lägg sedan till begränsningar baserat på fel, och begränsa endast de punkter som "upprepat är felaktiga".

**F4: Ska den uppdateras ofta?**

*   Bakgrund (identitet/stil/kärnfunktioner): Långsiktig stabilitet
*   Uppgift (scenario/mätvärden/omfång): Anpassa efter affärsbehov
*   Skapa en ny version för eventuella ändringar och logga "varför den ändrades."

## 8. Nästa steg

**Praktisk övning**

*   Välj en enkel roll (t.ex. kundtjänstassistent), skriv en "fungerande version" med hjälp av de nio elementen och testa den med 5 typiska uppgifter
*   Hitta en befintlig medarbetare, samla in 3–5 verkliga problem och utför en liten iteration

**Vidare läsning**

*   [AI-medarbetare · Guide för administratörskonfiguration](./admin-configuration.md): Implementera prompter i faktisk konfiguration
*   Varje AI-medarbetares dedikerade manualer: Se kompletta roll-/uppgiftsmallar

## Slutsats

**Få det att fungera, förfina det sedan.**
Börja med en "fungerande" version och samla kontinuerligt in problem, lägg till exempel och förfina regler i verkliga uppgifter.
Kom ihåg: **Berätta först hur den ska göra rätt (positiv vägledning), begränsa den sedan från att göra fel (måttlig begränsning).**