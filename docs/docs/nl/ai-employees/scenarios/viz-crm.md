:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

# AI Medewerker · Viz: CRM Scenario Configuratiegids


# AI Medewerker · Viz: CRM Scenario Configuratiegids

> Gebruik het CRM-voorbeeld om te leren hoe u uw AI-inzichtanalist echt uw bedrijf kunt laten begrijpen en zijn volledige potentieel kunt benutten.

## 1. Introductie: Hoe Viz van 'data zien' naar 'business begrijpen' gaat

In het NocoBase-systeem is **Viz** een ingebouwde AI-inzichtanalist.
Hij kan de paginacontext herkennen (zoals Leads, Opportunities, Accounts) en trendgrafieken, trechtergrafieken en KPI-kaarten genereren.
Standaard beschikt hij echter alleen over de meest basale zoekmogelijkheden:

| Tool                      | Functiebeschrijving       | Beveiliging |
| :------------------------ | :------------------------ | :---------- |
| Collectienamen ophalen    | Lijst met collecties ophalen | ✅ Veilig   |
| Collectiemetadata ophalen | Veldstructuur ophalen     | ✅ Veilig   |

Deze tools laten Viz alleen de 'structuur herkennen', maar nog niet echt de 'inhoud begrijpen'.
Om hem in staat te stellen inzichten te genereren, afwijkingen te detecteren en trends te analyseren, moet u hem **uitbreiden met geschiktere analysehulpmiddelen**.

In de officiële CRM Demo hebben we twee methoden gebruikt:

*   **Overall Analytics (Algemene analyse-engine)**: Een gestandaardiseerde, veilige en herbruikbare oplossing;
*   **SQL Execution (Gespecialiseerde analyse-engine)**: Biedt meer flexibiliteit, maar brengt grotere risico's met zich mee.

Dit zijn niet de enige opties; ze lijken meer op een **ontwerpparadigma**:

> U kunt de principes ervan volgen om een implementatie te creëren die beter aansluit bij uw eigen bedrijf.

---

## 2. De structuur van Viz: Stabiele persoonlijkheid + flexibele taken

Om te begrijpen hoe u Viz kunt uitbreiden, moet u eerst zijn gelaagde interne ontwerp begrijpen:

| Laag               | Beschrijving                                                              | Voorbeeld  |
| :----------------- | :------------------------------------------------------------------------ | :--------- |
| **Roldefinitie**   | De persoonlijkheid en analysemethode van Viz: Begrijpen → Zoeken → Analyseren → Visualiseren | Vast       |
| **Taakdefinitie**  | Aangepaste prompts en toolcombinaties voor een specifiek bedrijfsscenario             | Aanpasbaar |
| **Toolconfiguratie** | De brug voor Viz om externe gegevensbronnen of workflows aan te roepen              | Vrij vervangbaar |

Dit gelaagde ontwerp stelt Viz in staat een stabiele persoonlijkheid te behouden (consistente analyselogica),
en zich tegelijkertijd snel aan te passen aan verschillende bedrijfsscenario's (CRM, ziekenhuisbeheer, kanaalanalyse, productieactiviteiten...).

---

## 3. Patroon één: Gestandaardiseerde analyse-engine (aanbevolen)

### 3.1 Principeoverzicht

**Overall Analytics** is de kernanalyse-engine in de CRM Demo.
Het beheert alle SQL-zoekopdrachten via een **collectie voor data-analyse templates (data_analysis)**.
Viz schrijft niet direct SQL, maar **roept vooraf gedefinieerde templates aan** om resultaten te genereren.

De uitvoeringsstroom is als volgt:

```mermaid
flowchart TD
    A[Viz ontvangt taak] --> B[Roept Overall Analytics workflow aan]
    B --> C[Matcht template op basis van huidige pagina/taak]
    C --> D[Voert template SQL uit (alleen-lezen)]
    D --> E[Retourneert dataresultaat]
    E --> F[Viz genereert grafiek + korte interpretatie]
```

Op deze manier kan Viz binnen enkele seconden veilige en gestandaardiseerde analyseresultaten genereren,
en kunnen beheerders alle SQL-templates centraal beheren en beoordelen.

---

### 3.2 Structuur van de template collectie (data_analysis)

| Veldnaam                                          | Type       | Beschrijving            | Voorbeeld                                          |
| :------------------------------------------------ | :--------- | :---------------------- | :------------------------------------------------- |
| **id**                                            | Integer    | Primaire sleutel        | 1                                                  |
| **naam**                                          | Text       | Naam van analyse template | Leads Data Analysis                                |
| **collectie**                                     | Text       | Corresponderende collectie | Lead                                               |
| **sql**                                           | Code       | Analyse SQL-statement (alleen-lezen) | `SELECT stage, COUNT(*) FROM leads GROUP BY stage` |
| **beschrijving**                                  | Markdown   | Templatebeschrijving of definitie | "Aantal leads per fase"                                        |
| **createdAt / createdBy / updatedAt / updatedBy** | Systeemveld | Auditinformatie         | Automatisch gegenereerd                            |

#### Templatevoorbeelden in de CRM Demo

| Naam                             | Collectie   | Beschrijving                      |
| :------------------------------- | :---------- | :-------------------------------- |
| Account Data Analysis            | Account     | Account Data Analyse              |
| Contact Data Analysis            | Contact     | Contactpersoon Analyse            |
| Leads Data Analysis              | Lead        | Lead Trend Analyse                |
| Opportunity Data Analysis        | Opportunity | Opportunity Fase Trechter         |
| Task Data Analysis               | Todo Tasks  | Statistieken To-do Taken Status   |
| Users (Sales Reps) Data Analysis | Users       | Vergelijking Prestaties Verkoopvertegenwoordigers |

---

### 3.3 Voordelen van dit patroon

| Dimensie        | Voordeel                                        |
| :-------------- | :----------------------------------------------- |
| **Beveiliging** | Alle SQL wordt opgeslagen en beoordeeld, waardoor directe zoekopdrachtgeneratie wordt vermeden. |
| **Onderhoudbaarheid** | Templates worden centraal beheerd en uniform bijgewerkt. |
| **Herbruikbaarheid** | Dezelfde template kan door meerdere taken worden hergebruikt. |
| **Portabiliteit** | Kan eenvoudig naar andere systemen worden gemigreerd, vereist alleen dezelfde collectiestructuur. |
| **Gebruikerservaring** | Zakelijke gebruikers hoeven zich geen zorgen te maken over SQL; ze hoeven alleen een analyseaanvraag te initiëren. |

> 📘 Deze `data_analysis` collectie hoeft niet per se zo te heten.
> Het belangrijkste is: **analyse-logica gestandaardiseerd opslaan** en deze uniform laten aanroepen door een workflow.

---

### 3.4 Hoe Viz dit te laten gebruiken

In de taakdefinitie kunt u Viz expliciet vertellen:

```markdown
Hoi Viz,

Analyseer alstublieft de data van de huidige module.

**Prioriteit:** Gebruik de Overall Analytics tool om analyseresultaten uit de template collectie te halen.
**Indien geen overeenkomende template gevonden:** Geef aan dat een template ontbreekt en stel voor dat de beheerder deze toevoegt.

Outputvereisten:
- Genereer voor elk resultaat een afzonderlijke grafiek;
- Voeg onder de grafiek een korte beschrijving van 2-3 zinnen toe;
- Verzin geen data of aannames.
```

Op deze manier roept Viz automatisch de workflow aan, matcht de meest geschikte SQL uit de template collectie en genereert de grafiek.

---

## 4. Patroon twee: Gespecialiseerde SQL-executor (voorzichtig gebruiken)

### 4.1 Toepasselijke scenario's

Wanneer u verkennende analyses, ad-hoc zoekopdrachten of JOIN-aggregaties van meerdere collecties nodig heeft, kunt u Viz een **SQL Execution** tool laten aanroepen.

De kenmerken van deze tool zijn:

*   Viz kan direct `SELECT` zoekopdrachten genereren;
*   Het systeem voert deze uit en retourneert het resultaat;
*   Viz is verantwoordelijk voor analyse en visualisatie.

Voorbeeldtaak:

> "Analyseer alstublieft de trend van leadconversiepercentages per regio over de afgelopen 90 dagen."

In dit geval zou Viz het volgende kunnen genereren:

```sql
SELECT region, COUNT(id) AS leads, SUM(converted)::float/COUNT(id) AS rate
FROM leads
WHERE created_at > now() - interval '90 day'
GROUP BY region;
```

---

### 4.2 Risico's en beschermingsaanbevelingen

| Risicopunt                    | Beschermingsstrategie                  |
| :---------------------------- | :------------------------------------- |
| Genereren van schrijfbewerkingen | Dwingende beperking tot `SELECT`       |
| Toegang tot irrelevante collecties | Valideer of de collectienaam bestaat   |
| Prestatierisico bij grote collecties | Beperk tijdsbereik, gebruik LIMIT voor het aantal rijen |
| Traceerbaarheid van bewerkingen | Schakel zoekopdrachtlogging en auditing in |
| Gebruikersrechtenbeheer       | Alleen beheerders kunnen deze tool gebruiken |

> Algemene aanbevelingen:
>
> *   Reguliere gebruikers moeten alleen gestandaardiseerde analyse (Overall Analytics) ingeschakeld hebben;
> *   Alleen beheerders of senior analisten mogen SQL Execution gebruiken.

---

## 5. Als u uw eigen 'Overall Analytics' wilt bouwen

Hier is een eenvoudige, algemene benadering die u in elk systeem kunt repliceren (niet afhankelijk van NocoBase):

### Stap 1: Ontwerp de template collectie

De collectienaam kan willekeurig zijn (bijv. `analysis_templates`).
Het hoeft alleen de velden `name`, `sql`, `collection` en `description` te bevatten.

### Stap 2: Schrijf een 'Template ophalen → Uitvoeren' service of workflow

Logica:

1.  Ontvang de taak of paginacontext (bijv. de huidige collectie);
2.  Match een template;
3.  Voer de template SQL uit (alleen-lezen);
4.  Retourneer een gestandaardiseerde datastructuur (rijen + velden).

### Stap 3: Laat de AI deze interface aanroepen

De taakprompt kan als volgt worden geschreven:

```
Roep eerst de template-analysetool aan. Als er geen overeenkomende analyse in de templates wordt gevonden, gebruik dan de SQL-executor.
Zorg ervoor dat alle zoekopdrachten alleen-lezen zijn en genereer grafieken om de resultaten weer te geven.
```

> Op deze manier beschikt uw AI-medewerkersysteem over analysemogelijkheden die vergelijkbaar zijn met de CRM Demo, maar het is volledig onafhankelijk en aanpasbaar.

---

## 6. Best practices en ontwerpaanbevelingen

| Aanbeveling                       | Beschrijving                                     |
| :-------------------------------- | :----------------------------------------------- |
| **Geef prioriteit aan gestandaardiseerde analyse** | Veilig, stabiel en herbruikbaar                  |
| **Gebruik SQL Execution alleen als aanvulling** | Beperkt tot interne debugging of ad-hoc zoekopdrachten |
| **Eén grafiek, één kernpunt**     | Houd de output duidelijk en vermijd overmatige rommel |
| **Duidelijke templatenamen**      | Noem volgens de pagina/bedrijfsdomein, bijv. `Leads-Stage-Conversion` |
| **Beknopte en duidelijke uitleg** | Voorzie elke grafiek van een samenvatting van 2-3 zinnen |
| **Geef aan wanneer een template ontbreekt** | Informeer de gebruiker 'Geen corresponderende template gevonden' in plaats van een lege output |

---

## 7. Van de CRM Demo naar uw scenario

Of u nu werkt met een ziekenhuis-CRM, productie, magazijnlogistiek of onderwijsinschrijvingen,
zolang u de volgende drie vragen kunt beantwoorden, kan Viz waarde toevoegen aan uw systeem:

| Vraag                      | Voorbeeld                          |
| :------------------------- | :--------------------------------- |
| **1. Wat wilt u analyseren?** | Leadtrends / Dealstadia / Apparatuurgebruikspercentage |
| **2. Waar bevindt zich de data?** | Welke collectie, welke velden      |
| **3. Hoe wilt u het presenteren?** | Lijngrafiek, trechter, cirkeldiagram, vergelijkingstabel |

Zodra u dit hebt gedefinieerd, hoeft u alleen maar:

*   De analyse-logica in de template collectie te schrijven;
*   De taakprompt aan de pagina te koppelen;
*   Viz kan dan uw rapportanalyse 'overnemen'.

---

## 8. Conclusie: Neem het paradigma mee

'Overall Analytics' en 'SQL Execution' zijn slechts twee voorbeeldimplementaties.
Belangrijker is de gedachte erachter:

> **Laat de AI-medewerker uw bedrijfslogica begrijpen, in plaats van alleen prompts uit te voeren.**

Of u nu NocoBase, een privé-systeem of uw eigen aangepaste workflow gebruikt,
u kunt deze structuur repliceren:

*   Gecentraliseerde templates;
*   Workflow-aanroepen;
*   Alleen-lezen uitvoering;
*   AI-presentatie.

Op deze manier is Viz niet langer slechts een 'AI die grafieken kan genereren',
maar een echte analist die uw data, uw definities en uw bedrijf begrijpt.