
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# De functie "Sjabloon afdrukken" gebruiken om inkoop- en verkoopcontracten te genereren

In supply chain- of handelsscenario's is het vaak nodig om snel een gestandaardiseerd "Inkoop- en Verkoopcontract" te genereren en de inhoud dynamisch in te vullen op basis van informatie uit gegevensbronnen, zoals kopers, verkopers en productdetails. Hieronder laten we u aan de hand van een vereenvoudigd "Contract"-voorbeeld zien hoe u de functie "Sjabloon afdrukken" configureert en gebruikt om gegevensinformatie toe te wijzen aan plaatshouders in contractsjablonen, zodat het uiteindelijke contractdocument automatisch wordt gegenereerd.

---

## 1. Achtergrond en overzicht van de gegevensstructuur

In ons voorbeeld zijn er grofweg de volgende hoofdcollecties (andere irrelevante velden zijn weggelaten):

- **parties**: Slaat informatie op over eenheden of individuen van Partij A/Partij B, inclusief naam, adres, contactpersoon, telefoonnummer, enz.
- **contracts**: Slaat specifieke contractrecords op, inclusief contractnummer, externe sleutels van koper/verkoper, informatie over ondertekenaars, start-/einddatums, bankrekening, enz.
- **contract_line_items**: Slaat meerdere items op onder het contract (productnaam, specificatie, aantal, eenheidsprijs, leveringsdatum, enz.)

![template_print-2025-11-01-16-34-04](https://static-docs.nocobase.com/template_print-2025-11-01-16-34-04.png)

Aangezien het huidige systeem alleen het afdrukken van individuele records ondersteunt, klikken we op "Afdrukken" op de pagina "Contractdetails". Het systeem haalt dan automatisch het bijbehorende contractrecord en de gerelateerde partij-informatie op, en vult deze in Word- of PDF-documenten in.

## 2. Voorbereiding

### 2.1 Plugin voorbereiding

Let op: onze "Sjabloon afdrukken" is een commerciële plugin die eerst moet worden aangeschaft en geactiveerd voordat afdrukbewerkingen kunnen worden uitgevoerd.

![template_print-2025-11-01-17-31-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-51.png)

**Plugin-activering bevestigen:**

Maak op een willekeurige pagina een detailblok (bijvoorbeeld voor gebruikers) en controleer of er een overeenkomstige sjabloonconfiguratieoptie is in de actieconfiguratie:

![template_print-2025-11-01-17-32-09](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-09.png)

![template_print-2025-11-01-17-32-30](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-30.png)

### 2.2 Collectie aanmaken

Maak de hierboven ontworpen hoofdcollectie, contractcollectie en productitemcollectie aan (selecteer alleen de kernvelden).

#### Contracten collectie

| Veldcategorie | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Velden** | | | |
| | ID | id | Integer |
| | Koper ID | buyer_id | Integer |
| | Verkoper ID | seller_id | Integer |
| **Associatievelden** | | | |
| | Contractitems | contract_items | One to many |
| | Koper (Partij A) | buyer | Many to one |
| | Verkoper (Partij B) | seller | Many to one |
| **Algemene velden** | | | |
| | Contractnummer | contract_no | Single line text |
| | Startdatum levering | start_date | Datetime (with time zone) |
| | Einddatum levering | end_date | Datetime (with time zone) |
| | Aanbetalingspercentage (%) | deposit_ratio | Percent |
| | Betaaldagen na levering | payment_days_after | Integer |
| | Naam bankrekening (begunstigde) | bank_account_name | Single line text |
| | Banknaam | bank_name | Single line text |
| | Bankrekeningnummer (begunstigde) | bank_account_number | Single line text |
| | Totaalbedrag | total_amount | Number |
| | Valutacodes | currency_codes | Single select |
| | Saldo percentage (%) | balance_ratio | Percent |
| | Saldodagen na levering | balance_days_after | Integer |
| | Leveringsplaats | delivery_place | Long text |
| | Naam ondertekenaar Partij A | party_a_signatory_name | Single line text |
| | Titel ondertekenaar Partij A | party_a_signatory_title | Single line text |
| | Naam ondertekenaar Partij B | party_b_signatory_name | Single line text |
| | Titel ondertekenaar Partij B | party_b_signatory_title | Single line text |
| **Systeemvelden** | | | |
| | Aangemaakt op | createdAt | Created at |
| | Aangemaakt door | createdBy | Created by |
| | Laatst bijgewerkt op | updatedAt | Last updated at |
| | Laatst bijgewerkt door | updatedBy | Last updated by |

#### Partijen collectie

| Veldcategorie | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Velden** | | | |
| | ID | id | Integer |
| **Algemene velden** | | | |
| | Partijnaam | party_name | Single line text |
| | Adres | address | Single line text |
| | Contactpersoon | contact_person | Single line text |
| | Telefoonnummer contactpersoon | contact_phone | Phone |
| | Functie | position | Single line text |
| | E-mail | email | Email |
| | Website | website | URL |
| **Systeemvelden** | | | |
| | Aangemaakt op | createdAt | Created at |
| | Aangemaakt door | createdBy | Created by |
| | Laatst bijgewerkt op | updatedAt | Last updated at |
| | Laatst bijgewerkt door | updatedBy | Last updated by |

#### Contractregelitems collectie

| Veldcategorie | Field Display Name | Field Name | Field Interface |
|---------|-------------------|------------|-----------------|
| **PK & FK Velden** | | | |
| | ID | id | Integer |
| | Contract ID | contract_id | Integer |
| **Associatievelden** | | | |
| | Contract | contract | Many to one |
| **Algemene velden** | | | |
| | Productnaam | product_name | Single line text |
| | Specificatie / Model | spec | Single line text |
| | Aantal | quantity | Integer |
| | Eenheidsprijs | unit_price | Number |
| | Totaalbedrag | total_amount | Number |
| | Leveringsdatum | delivery_date | Datetime (with time zone) |
| | Opmerking | remark | Long text |
| **Systeemvelden** | | | |
| | Aangemaakt op | createdAt | Created at |
| | Aangemaakt door | createdBy | Created by |
| | Laatst bijgewerkt op | updatedAt | Last updated at |
| | Laatst bijgewerkt door | updatedBy | Last updated by |

### 2.3 Interface configuratie

**Voorbeeldgegevens invoeren:**

![template_print-2025-11-01-17-32-59](https://static-docs.nocobase.com/template_print-2025-11-01-17-32-59.png)

![template_print-2025-11-01-17-33-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-11.png)

**Configureer koppelingsregels om de totale prijs en de resterende betaling automatisch te berekenen:**

![template_print-2025-11-01-17-33-21](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-21.png)

**Maak een weergaveblok aan, bevestig de gegevens en schakel de actie "Sjabloon afdrukken" in:**

![template_print-2025-11-01-17-33-33](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-33.png)

### 2.4 Configuratie van de plugin "Sjabloon afdrukken"

![template_print-2025-11-01-17-33-45](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-45.png)

Voeg een sjabloonconfiguratie toe, bijvoorbeeld "Inkoop- en Verkoopcontract":

![template_print-2025-11-01-17-33-57](https://static-docs.nocobase.com/template_print-2025-11-01-17-33-57.png)

![template_print-2025-11-01-17-34-08](https://static-docs.nocobase.com/template_print-2025-11-01-17-34-08.png)

Vervolgens gaan we naar het tabblad "Veldenlijst", waar u alle velden van het huidige object kunt zien. Nadat u op "Kopiëren" heeft geklikt, kunt u beginnen met het invullen van het sjabloon.

![template_print-2025-11-01-17-35-19](https://static-docs.nocobase.com/template_print-2025-11-01-17-35-19.png)

### 2.5 Voorbereiding van het contractbestand

**Word-contractsjabloonbestand**

Bereid het contractsjabloon (.docx-bestand) van tevoren voor, bijvoorbeeld: `SUPPLY AND PURCHASE CONTRACT.docx`

In dit voorbeeld geven we een vereenvoudigde versie van het "Inkoop- en Verkoopcontract", dat voorbeeldplaatshouders bevat:

- `{d.contract_no}`: Contractnummer
- `{d.buyer.party_name}`, `{d.seller.party_name}`: Namen van koper en verkoper
- `{d.total_amount}`: Totaalbedrag van het contract
- En andere plaatshouders zoals "contactpersoon", "adres", "telefoonnummer", enz.

Vervolgens kunt u de velden van uw collectie kopiëren en in Word plakken.

---

## 3. Handleiding sjabloonvariabelen

### 3.1 Basisvariabelen en eigenschappen van geassocieerde objecten invullen

**Basisvelden invullen:**

Bijvoorbeeld het contractnummer bovenaan, of het object van de contractondertekenende entiteit. U klikt op kopiëren en plakt het direct in de overeenkomstige lege ruimte in het contract.

![template_print-2025-11-01-17-31-11](https://static-docs.nocobase.com/template_print-2025-11-01-17-31-11.gif)

![template_print-2025-11-01-17-30-51](https://static-docs.nocobase.com/template_print-2025-11-01-17-30-51.png)

### 3.2 Gegevens opmaken

#### Datumopmaak

In sjablonen moeten we vaak velden opmaken, vooral datumvelden. Het direct gekopieerde datumformaat is meestal lang (zoals Wed Jan 01 2025 00:00:00 GMT) en moet worden opgemaakt om de gewenste stijl weer te geven.

Voor datumvelden kunt u de functie `formatD()` gebruiken om het uitvoerformaat op te geven:

```
{veldnaam:formatD(opmaakstijl)}
```

**Voorbeeld:**

Als het oorspronkelijke veld dat we hebben gekopieerd bijvoorbeeld `{d.created_at}` is en we de datum willen opmaken als `2025-01-01`, dan wijzigt u dit veld als volgt:

```
{d.created_at:formatD(YYYY-MM-DD)}  // Uitvoer: 2025-01-01
```

**Veelvoorkomende datumopmaakstijlen:**

- `YYYY` - Jaar (vier cijfers)
- `MM` - Maand (twee cijfers)
- `DD` - Dag (twee cijfers)
- `HH` - Uur (24-uursnotatie)
- `mm` - Minuten
- `ss` - Seconden

**Voorbeeld 2:**

```
{d.created_at:formatD(YYYY-MM-DD HH:mm:ss)}  // Uitvoer: 2025-01-01 14:30:00
```

#### Getalopmaak

Stel dat er een bedragveld is, zoals `{d.total_amount}` in het contract. We kunnen de functie `formatN()` gebruiken om getallen op te maken, waarbij we het aantal decimalen en de duizendseparator opgeven.

**Syntaxis:**

```
{veldnaam:formatN(aantal_decimalen, duizendseparator)}
```

- **aantal_decimalen**: U kunt opgeven hoeveel decimalen u wilt behouden. Bijvoorbeeld, `2` betekent twee decimalen.
- **duizendseparator**: Geef aan of een duizendseparator moet worden gebruikt, meestal `true` of `false`.

**Voorbeeld 1: Bedrag opmaken met duizendseparator en twee decimalen**

```
{d.amount:formatN(2, true)}  // Uitvoer: 1.234,56
```

Dit formatteert `d.amount` naar twee decimalen en voegt een duizendseparator toe.

**Voorbeeld 2: Bedrag opmaken als geheel getal zonder decimalen**

```
{d.amount:formatN(0, true)}  // Uitvoer: 1.235
```

Dit formatteert `d.amount` naar een geheel getal en voegt een duizendseparator toe.

**Voorbeeld 3: Bedrag opmaken met twee decimalen, maar zonder duizendseparator**

```
{d.amount:formatN(2, false)}  // Uitvoer: 1234,56
```

Hier wordt de duizendseparator uitgeschakeld en worden alleen twee decimalen behouden.

**Andere behoeften voor bedragopmaak:**

- **Valutasymbool**: Carbone zelf biedt geen directe functionaliteit voor het opmaken van valutasymbolen, maar u kunt valutasymbolen toevoegen via directe gegevens of in sjablonen. Bijvoorbeeld:
  ```
  {d.amount:formatN(2, true)} EUR  // Uitvoer: 1.234,56 EUR
  ```

#### Tekstopmaak

Voor tekstvelden kunt u `:upperCase` gebruiken om de tekstindeling op te geven, zoals hoofdletterconversie.

**Syntaxis:**

```
{veldnaam:upperCase:andere_commando's}
```

**Veelvoorkomende conversiemethoden:**

- `upperCase` - Converteren naar hoofdletters
- `lowerCase` - Converteren naar kleine letters
- `upperCase:ucFirst` - Eerste letter hoofdletter

**Voorbeeld:**

```
{d.party_a_signatory_name:upperCase}  // Uitvoer: JOHN DOE
```

### 3.3 Herhalend afdrukken

#### Hoe u lijsten met subobjecten (zoals productdetails) afdrukt

Wanneer we een tabel moeten afdrukken die meerdere subitems (zoals productdetails) bevat, gebruiken we meestal een herhalende afdruk. Op deze manier genereert het systeem een rij inhoud voor elk item in de lijst, totdat alle items zijn doorlopen.

Stel dat we een productlijst hebben (bijvoorbeeld `contract_items`), die meerdere productobjecten bevat. Elk productobject heeft meerdere attributen, zoals productnaam, specificatie, aantal, eenheidsprijs, totaalbedrag en opmerkingen.

**Stap 1: Vul velden in de eerste rij van de tabel in**

Vul eerst de sjabloonvariabelen direct in de eerste rij van de tabel (niet de koptekst) in. Deze variabelen worden vervangen door de overeenkomstige gegevens en weergegeven in de uitvoer.

De eerste rij van de tabel ziet er bijvoorbeeld als volgt uit:

| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i].product_name} | {d.contract_items[i].spec} | {d.contract_items[i].quantity} | {d.contract_items[i].unit_price} | {d.contract_items[i].total_amount} | {d.contract_items[i].remark} |

Hier staat `d.contract_items[i]` voor het i-de item in de productlijst, en `i` is een index die de volgorde van het huidige product aangeeft.

**Stap 2: Wijzig de index in de tweede rij**

Vervolgens wijzigen we in de tweede rij van de tabel de index van het veld naar `i+1` en vullen we alleen het eerste attribuut in. Dit is omdat we bij herhalend afdrukken het volgende item uit de lijst moeten halen en dit in de volgende rij moeten weergeven.

De tweede rij wordt bijvoorbeeld als volgt ingevuld:
| Product Name | Specification / Model | Quantity | Unit Price | Total Amount | Remark |
|--------------|----------------------|----------|------------|--------------|--------|
| {d.contract_items[i+1].product_name} | | |  | |  |

In dit voorbeeld hebben we `[i]` gewijzigd in `[i+1]`, zodat we de volgende productgegevens in de lijst kunnen ophalen.

**Stap 3: Automatisch herhalend afdrukken tijdens sjabloonweergave**

Wanneer het systeem dit sjabloon verwerkt, werkt het volgens de volgende logica:

1. De eerste rij wordt ingevuld volgens de velden die u in het sjabloon heeft ingesteld.
2. Vervolgens verwijdert het systeem automatisch de tweede rij en begint het met het extraheren van gegevens uit `d.contract_items`, waarbij elke rij in het formaat van de tabel herhalend wordt ingevuld totdat alle productdetails zijn afgedrukt.

De `i` in elke rij wordt verhoogd, zodat elke rij verschillende productinformatie weergeeft.

---

## 4. Contractsjabloon uploaden en configureren

### 4.1 Sjabloon uploaden

1. Klik op de knop "Sjabloon toevoegen" en voer de sjabloonnaam in, bijvoorbeeld "Sjabloon inkoop- en verkoopcontract".
2. Upload het voorbereide [Word-contractbestand (.docx)](https://static-docs.nocobase.com/template_print-2025-11-01-17-37-11.docx), dat al alle plaatshouders bevat.

![template_print-2025-11-01-17-36-06](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-06.png)

3. Na voltooiing zal het systeem het sjabloon in de lijst met beschikbare sjablonen plaatsen voor toekomstig gebruik.
4. We klikken op "Gebruiken" om dit sjabloon te activeren.

![template_print-2025-11-01-17-36-13](https://static-docs.nocobase.com/template_print-2025-11-01-17-36-13.png)

Sluit nu het huidige pop-upvenster en klik op "Sjabloon downloaden" om het gegenereerde complete sjabloon te verkrijgen.

**Tips:**

- Als het sjabloon `.doc` of andere formaten gebruikt, moet het mogelijk worden geconverteerd naar `.docx`, afhankelijk van de ondersteuning van de plugin.
- Let er in Word-bestanden op dat u plaatshouders niet opsplitst over meerdere alinea's of tekstvakken, om weergavefouten te voorkomen.

---

Veel succes! Met de functie "Sjabloon afdrukken" kunt u aanzienlijk besparen op repetitief werk in contractbeheer, handmatige kopieer- en plakfouten voorkomen en gestandaardiseerde en geautomatiseerde contractuitvoer realiseren.