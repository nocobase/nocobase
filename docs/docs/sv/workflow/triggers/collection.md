:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

# Samlingshändelser

## Introduktion

Triggare av typen samlingshändelse lyssnar efter händelser som skapande, uppdatering och radering av data i en samling. När en dataoperation utförs på samlingen och uppfyller de konfigurerade villkoren, utlöses det motsvarande arbetsflödet. Exempelvis scenarier som att dra av produktlager efter en ny order, eller att invänta manuell granskning efter att en ny kommentar lagts till.

## Grundläggande användning

Det finns flera typer av ändringar i en samling:

1. Efter att data skapats.
2. Efter att data uppdaterats.
3. Efter att data skapats eller uppdaterats.
4. Efter att data raderats.

![数据表事件_触发时机选择](https://static-docs.nocobase.com/81275602742deb71e0c830eb97aa612c.png)

Ni kan välja när triggern ska utlösas baserat på olika affärsbehov. När den valda ändringen inkluderar uppdatering av samlingen, kan ni även specificera vilka fält som har ändrats. Triggervillkoret uppfylls endast när de valda fälten ändras. Om inga fält väljs, innebär det att en ändring i vilket fält som helst kan utlösa arbetsflödet.

![数据表事件_发生变动的字段选择](https://static-docs.nocobase.com/8741475f01298b3c00267b2b4674611.png)

Mer specifikt kan ni konfigurera villkorsregler för varje fält i den utlösande dataraden. Triggern utlöses endast när fälten uppfyller de motsvarande villkoren.

![数据表事件_配置数据满足的条件](https://static-docs.nocobase.com/264ae3835dcd75cee0eef7812c11fe0c.png)

Efter att en samlingshändelse har utlösts, kommer dataraden som genererade händelsen att injiceras i exekveringsplanen som triggerns kontextdata, för att kunna användas som variabler av efterföljande noder i arbetsflödet. Men när efterföljande noder behöver använda relationsfälten för denna data, måste ni först konfigurera förladdning av relationsdata. Den valda relationsdatan kommer att injiceras i kontexten tillsammans med triggern och kan väljas och användas hierarkiskt.

## Relaterade tips

### Stöd för massdataoperationer saknas för närvarande

Samlingshändelser stöder för närvarande inte utlösning av massdataoperationer. Till exempel, när ni skapar en artikel och samtidigt lägger till flera taggar för den artikeln (en-till-många-relationsdata), kommer endast arbetsflödet för att skapa artikeln att utlösas. De samtidigt skapade taggarna kommer inte att utlösa arbetsflödet för att skapa taggar. När ni associerar eller lägger till många-till-många-relationsdata, kommer arbetsflödet för mellansamlingen inte heller att utlöses.

### Dataoperationer utanför applikationen utlöser inte händelser

Operationer på samlingar via HTTP API-anrop till applikationens gränssnitt kan också utlösa motsvarande händelser. Men om dataändringar görs direkt via databasoperationer istället för via NocoBase-applikationen, kan de motsvarande händelserna inte utlösas. Till exempel kommer inbyggda databastriggare inte att associeras med arbetsflöden i applikationen.

Dessutom är användning av SQL-åtgärdsnoden för att utföra operationer på databasen likvärdigt med direkta databasoperationer och kommer inte att utlösa samlingshändelser.

### Externa datakällor

Arbetsflöden har stöttat externa datakällor sedan version `0.20`. Om ni använder ett plugin för externa datakällor och samlingshändelsen är konfigurerad för en extern datakälla, kan de motsvarande samlingshändelserna utlösas, så länge dataoperationerna på den datakällan utförs inom applikationen (t.ex. användarskapande, uppdateringar och arbetsflödesdataoperationer). Men om dataändringarna görs via andra system eller direkt i den externa databasen, kan samlingshändelser inte utlöses.

## Exempel

Låt oss ta scenariot med att beräkna totalpriset och dra av lagret efter att en ny order skapats som exempel.

Först skapar vi en samling för produkter och en för ordrar med följande datamodeller:

| Fältnamn | Fälttyp |
| -------- | -------- |
| Produktnamn | Enradig text |
| Pris     | Nummer     |
| Lager     | Heltal     |

| Fältnamn | Fälttyp       |
| -------- | -------------- |
| Order-ID   | Sekvens       |
| Orderprodukt | Många-till-en (Produkter) |
| Ordersumma | Nummer           |

Och lägg till lite grundläggande produktdata:

| Produktnamn      | Pris | Lager |
| ------------- | ---- | ---- |
| iPhone 14 Pro | 7999 | 10   |
| iPhone 13 Pro | 5999 | 0    |

Skapa sedan ett arbetsflöde baserat på samlingshändelsen för ordrar:

![数据表事件_示例_新增订单触发](https://static-docs.nocobase.com/094392a870dddc65aeb20357f62ddc08.png)

Här är några av konfigurationsalternativen:

- Samling: Välj samlingen "Ordrar".
- Utlösningstidpunkt: Välj "Efter att data skapats" för utlösning.
- Triggervillkor: Lämna tomt.
- Förladda relationsdata: Markera "Produkter".

Konfigurera sedan andra noder enligt arbetsflödets logik: kontrollera om produktlagret är större än 0. Om det är det, dra av lagret; annars är ordern ogiltig och bör raderas:

![数据表事件_示例_新增订单流程编排](https://static-docs.nocobase.com/7713ea1aaa0f52a0dc3c92aba5e58f05.png)

Konfigurationen av noder kommer att förklaras i detalj i dokumentationen för specifika nodtyper.

Aktivera detta arbetsflöde och testa det genom att skapa en ny order via gränssnittet. Efter att en order har lagts för "iPhone 14 Pro" kommer lagret för motsvarande produkt att minskas till 9. Om en order läggs för "iPhone 13 Pro" kommer ordern att raderas på grund av otillräckligt lager.

![数据表事件_示例_新增订单执行结果](https://static-docs.nocobase.com/24cbe51e24ba4804b3bd48d99415c54f.png)