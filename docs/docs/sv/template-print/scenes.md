
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Använda funktionen "Mallutskrift" för att generera exempel på leverans- och inköpsavtal

I scenarier inom leveranskedjan eller handel är det ofta nödvändigt att snabbt generera ett standardiserat "Leverans- och inköpsavtal" och dynamiskt fylla i innehåll baserat på information från datakällor som köpare, säljare och produktdetaljer. Nedan kommer vi att använda ett förenklat "Avtal"-användningsfall som exempel för att visa er hur ni konfigurerar och använder funktionen "Mallutskrift" för att mappa datainformation till platshållare i avtalsmallar, och därmed automatiskt generera det slutliga avtalsdokumentet.

---

## 1. Bakgrund och översikt över datastruktur

I vårt exempel finns det i stort sett följande huvudsakliga samlingar (andra irrelevanta fält utelämnas):

- **parties**: Lagrar information om enheter eller individer för Part A/Part B, inklusive namn, adress, kontaktperson, telefonnummer, etc.
- **contracts**: Lagrar specifika avtalsposter, inklusive avtalsnummer, externa nycklar för köpare/säljare, information om undertecknare, start-/slutdatum, bankkonto, etc.
- **contract_line_items**: Används för att spara flera artiklar under avtalet (produktnamn, specifikation, kvantitet, enhetspris, leveransdatum, etc.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Eftersom det nuvarande systemet endast stöder utskrift av enskilda poster, kommer vi att klicka på "Skriv ut" på sidan "Avtalsdetaljer". Systemet kommer då automatiskt att hämta den motsvarande `contracts`-posten, samt relaterad `parties`-information och annan data, och fylla i dem i Word- eller PDF-dokument.

## 2. Förberedelser

### 2.1 Förberedelse av plugin

Observera att vår "Mallutskrift" är en kommersiell plugin som måste köpas och aktiveras innan utskriftsåtgärder kan utföras.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Bekräfta aktivering av plugin:**

På valfri sida, skapa ett detaljblock (till exempel för användare) och kontrollera om det finns ett motsvarande alternativ för mallkonfiguration i åtgärdskonfigurationen:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Skapa samlingar

Skapa de huvudsakliga samlingarna för parter, kontrakt och kontraktsradsposter som designats ovan (välj endast kärnfält).

#### Samlingen Kontrakt (Contracts)

| Field Category | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| | Köpar-ID | buyer_id | Integer |
| | Säljar-ID | seller_id | Integer |
| **Association Fields** | | | |
| | Kontraktsartiklar | contract_items | One to many |
| | Köpare (Part A) | buyer | Many to one |
| | Säljare (Part B) | seller | Many to one |
| **General Fields** | | | |
| | Kontraktsnummer | contract_no | Single line text |
| | Leverans startdatum | start_date | Datetime (with time zone) |
| | Leverans slutdatum | end_date | Datetime (with time zone) |
| | Depositionskvot (%) | deposit_ratio | Percent |
| | Betalningsdagar efter leverans | payment_days_after | Integer |
| | Bankkontonamn (Mottagare) | bank_account_name | Single line text |
| | Banknamn | bank_name | Single line text |
| | Bankkontonummer (Mottagare) | bank_account_number | Single line text |
| | Totalt belopp | total_amount | Number |
| | Valutakoder | currency_codes | Single select |
| | Saldokvot (%) | balance_ratio | Percent |
| | Saldodagar efter leverans | balance_days_after | Integer |
| | Leveransplats | delivery_place | Long text |
| | Part A Undertecknares namn | party_a_signatory_name | Single line text |
| | Part A Undertecknares titel | party_a_signatory_title | Single line text |
| | Part B Undertecknares namn | party_b_signatory_name | Single line text |
    | | Part B Undertecknares titel | party_b_signatory_title | Single line text |
| **System Fields** | | | |
| | Skapad den | createdAt | Created at |
| | Skapad av | createdBy | Created by |
| | Senast uppdaterad den | updatedAt | Last updated at |
| | Senast uppdaterad av | updatedBy | Last updated by |

#### Samlingen Parter (Parties)

| Field Category | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| **General Fields** | | | |
| | Partens namn | party_name | Single line text |
| | Adress | address | Single line text |
| | Kontaktperson | contact_person | Single line text |
| | Kontakttelefon | contact_phone | Phone |
| | Position | position | Single line text |
| | E-post | email | Email |
| | Webbplats | website | URL |
| **System Fields** | | | |
| | Skapad den | createdAt | Created at |
| | Skapad av | createdBy | Created by |
| | Senast uppdaterad den | updatedAt | Last updated at |
| | Senast uppdaterad av | updatedBy | Last updated by |

#### Samlingen Kontraktsradsposter (Contract Line Items)

| Field Category | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Fields** | | | |
| | ID | id | Integer |
| | Kontrakts-ID | contract_id | Integer |
| **Association Fields** | | | |
| | Kontrakt | contract | Many to one |
| **General Fields** | | | |
| | Produktnamn | product_name | Single line text |
| | Specifikation / Modell | spec | Single line text |
| | Kvantitet | quantity | Integer |
| | Enhetspris | unit_price | Number |
| | Totalt belopp | total_amount | Number |
| | Leveransdatum | delivery_date | Datetime (with time zone) |
| | Anmärkning | remark | Long text |
| **System Fields** | | | |
| | Skapad den | createdAt | Created at |
| | Skapad av | createdBy | Created by |
| | Senast uppdaterad den | updatedAt | Last updated at |
| | Senast uppdaterad av | updatedBy | Last updated by |

### 2.3 Gränssnittskonfiguration

**Ange exempeldata:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Konfigurera kopplingsregler enligt följande för att automatiskt beräkna totalpris och återstående betalning:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Skapa ett visningsblock, bekräfta data och aktivera åtgärden "Mallutskrift":**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Konfiguration av plugin för mallutskrift

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Lägg till en mallkonfiguration, till exempel "Leverans- och inköpsavtal":

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Därefter går vi till fliken Fältlista, där vi kan se alla fält för det aktuella objektet. När ni har klickat på "Kopiera" kan ni börja fylla i mallen.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Förberedelse av avtalsfil

**Word-mallfil för avtal**

Förbered avtalsmallen (.docx-fil) i förväg, till exempel: `SUPPLY AND PURCHASE CONTRACT.docx`

I detta exempel ger vi en förenklad version av "Leverans- och inköpsavtal", som innehåller exempelplatshållare:

- `{d.contract_no}`: Avtalsnummer
- `{d.buyer.party_name}`、`{d.seller.party_name}`: Köparens och säljarens namn
- `{d.total_amount}`: Totala avtalssumman
- Samt andra platshållare som "kontaktperson", "adress", "telefon", etc.

Därefter kan ni kopiera och klistra in fälten från er samling i Word.

---

## 3. Handledning för mallvariabler

### 3.1 Fyllning av grundläggande variabler och associerade objektsattribut

**Fyllning av grundläggande fält:**

Till exempel avtalsnumret högst upp, eller objektet för den avtalstecknande parten. Ni klickar på kopiera och klistrar sedan in det direkt i det motsvarande tomma utrymmet i avtalet.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Dataformatering

#### Datumformatering

I mallar behöver vi ofta formatera fält, särskilt datumfält. Datumformatet som kopieras direkt är vanligtvis långt (som Wed Jan 01 2025 00:00:00 GMT) och behöver formateras för att visa den stil vi önskar.

För datumfält kan ni använda funktionen `formatD()` för att ange utdataformatet:

```
{fältnamn:formatD(formateringsstil)}
```

**Exempel:**

Om det ursprungliga fältet ni kopierade är `{d.created_at}` och ni behöver formatera datumet till formatet `2025-01-01`, ändrar ni fältet till:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Utdata: 2025-01-01
```

**Vanliga formateringsstilar för datum:**

- `YYYY` - År (fyra siffror)
- `MM` - Månad (två siffror)
- `DD` - Dag (två siffror)
- `HH` - Timme (24-timmarsformat)
- `mm` - Minuter
- `ss` - Sekunder

**Exempel 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Utdata: 2025-01-01 14:30:00
```

#### Beloppsformatering

Anta att det finns ett beloppsfält, till exempel `{d.total_amount}` i avtalet. Vi kan använda funktionen `formatN()` för att formatera siffror, genom att ange antal decimaler och tusenavgränsare.

**Syntax:**

```
{fältnamn:formatN(decimaler, tusenavgränsare)}
```

- **decimaler**: Ni kan ange hur många decimaler som ska behållas. Till exempel betyder `2` att två decimaler behålls.
- **tusenavgränsare**: Ange om tusenavgränsare ska användas, vanligtvis `true` eller `false`.

**Exempel 1: Formatera belopp med tusenavgränsare och två decimaler**

```
{d.amount:formatN(2, true)}  // Utdata: 1,234.56
```

Detta kommer att formatera `d.amount` till två decimaler och lägga till en tusenavgränsare.

**Exempel 2: Formatera belopp till heltal utan decimaler**

```
{d.amount:formatN(0, true)}  // Utdata: 1,235
```

Detta kommer att formatera `d.amount` till ett heltal och lägga till en tusenavgränsare.

**Exempel 3: Formatera belopp med två decimaler men utan tusenavgränsare**

```
{d.amount:formatN(2, false)}  // Utdata: 1234.56
```

Här inaktiveras tusenavgränsaren och endast två decimaler behålls.

**Andra behov för beloppsformatering:**

- **Valutasymbol**: Carbone i sig tillhandahåller inte direkt funktioner för valutasymbolsformatering, men ni kan lägga till valutasymboler direkt i data eller mallar. Till exempel:
  ```
  {d.amount:formatN(2, true)} kr  // Utdata: 1,234.56 kr
  ```

#### Strängformatering

För strängfält kan ni använda `:upperCase` för att ange textens format, till exempel konvertering av gemener/versaler.

**Syntax:**

```
{fältnamn:upperCase:andra_kommandon}
```

**Vanliga konverteringsmetoder:**

- `upperCase` - Konvertera till enbart stora bokstäver
- `lowerCase` - Konvertera till enbart små bokstäver
- `upperCase:ucFirst` - Versal första bokstav

**Exempel:**

```
{d.party_a_signatory_name:upperCase}  // Utdata: JOHN DOE
```

### 3.3 Loop-utskrift

#### Hur man skriver ut listor med underordnade objekt (t.ex. produktdetaljer)

När vi behöver skriva ut en tabell som innehåller flera underordnade poster (till exempel produktdetaljer), behöver vi vanligtvis använda loop-utskrift. På så sätt genererar systemet en rad innehåll för varje post i listan tills alla poster har gått igenom.

Anta att vi har en produktlista (till exempel `contract_items`), som innehåller flera produktobjekt. Varje produktobjekt har flera attribut, såsom produktnamn, specifikation, kvantitet, enhetspris, totalt belopp och anmärkningar.

**Steg 1: Fyll i fält i tabellens första rad**

Först, i tabellens första rad (inte rubrikraden), kopierar och fyller vi direkt i mallvariablerna. Dessa variabler kommer att ersättas av motsvarande data och visas i utdata.

Till exempel ser tabellens första rad ut så här:

| Produktnamn | Specifikation / Modell | Kvantitet | Enhetspris | Totalt belopp | Anmärkning |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Här representerar `d.contract_items[i]` den i-te posten i produktlistan, och `i` är ett index som representerar den aktuella produktens ordning.

**Steg 2: Ändra indexet i den andra raden**

Därefter, i tabellens andra rad, ändrar vi fältets index till `i+1` och fyller endast i det första attributet. Detta beror på att vi vid loop-utskrift behöver hämta nästa datapost från listan och visa den på nästa rad.

Till exempel fylls den andra raden i så här:
| Produktnamn | Specifikation / Modell | Kvantitet | Enhetspris | Totalt belopp | Anmärkning |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |

I detta exempel ändrade vi `[i]` till `[i+1]`, vilket gör att vi kan hämta nästa produktdata i listan.

**Steg 3: Automatisk loop-utskrift vid mallrendering**

När systemet bearbetar denna mall kommer det att agera enligt följande logik:

1. Den första raden kommer att fyllas i enligt de fält ni har angett i mallen.
2. Därefter kommer systemet automatiskt att ta bort den andra raden och börja extrahera data från `d.contract_items`, och loopa för att fylla i varje rad i tabellformatet tills alla produktdetaljer har skrivits ut.

`i` i varje rad kommer att öka, vilket säkerställer att varje rad visar olika produktinformation.

---

## 4. Ladda upp och konfigurera avtalsmall

### 4.1 Ladda upp mall

1. Klicka på knappen "Lägg till mall" och ange mallnamnet, till exempel "Mall för leverans- och inköpsavtal".
2. Ladda upp den förberedda [Word-avtalsfilen (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx), som redan innehåller alla platshållare.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Efter slutförandet kommer systemet att lista mallen i den valbara mallistan för framtida användning.
4. Vi klickar på "Använd" för att aktivera denna mall.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

Vid denna punkt, avsluta den aktuella popup-rutan och klicka på "Ladda ner mall" för att få den genererade kompletta mallen.

**Tips:**

- Om mallen använder `.doc` eller andra format kan den behöva konverteras till `.docx`, beroende på plugin-stöd.
- I Word-filer, se till att inte dela upp platshållare i flera stycken eller textrutor för att undvika renderingsfel.

---

Lycka till med användningen! Med funktionen "Mallutskrift" kan ni avsevärt spara repetitivt arbete inom avtalshantering, undvika manuella kopierings- och inklistringsfel, och uppnå standardiserad och automatiserad avtalsutskrift.