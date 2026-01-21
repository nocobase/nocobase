---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



# SQL-samling

## Introduktion

SQL-samlingen erbjuder en kraftfull metod för att hämta data med SQL-frågor. Genom att extrahera datafält via SQL-frågor och konfigurera tillhörande fältmetadata kan ni använda dessa fält precis som om ni arbetade med en vanlig tabell. Denna funktion är särskilt fördelaktig för scenarier som involverar komplexa kopplingsfrågor, statistisk analys och mer.

## Användarmanual

### Skapa en ny SQL-samling

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

1. Ange er SQL-fråga i inmatningsrutan och klicka på **Kör** (Execute). Systemet kommer då att analysera frågan för att identifiera vilka tabeller och fält som används, och automatiskt extrahera relevant fältmetadata från källtabellerna.

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

2. Om systemets analys av källtabellerna och fälten är felaktig, kan ni manuellt välja de korrekta tabellerna och fälten för att säkerställa att rätt metadata används. Börja med att välja källtabellen, och välj sedan motsvarande fält i avsnittet för fältkälla nedan.

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

3. För fält som inte har en direkt källa kommer systemet att härleda fälttypen baserat på datatypen. Om denna härledning är felaktig kan ni manuellt välja rätt fälttyp.

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

4. Medan ni konfigurerar varje fält kan ni förhandsgranska dess visning i förhandsgranskningsområdet, vilket gör att ni omedelbart kan se effekten av era inställningar.

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

5. När ni har slutfört konfigurationen och bekräftat att allt är korrekt, klicka på knappen **Bekräfta** (Confirm) under SQL-inmatningsrutan för att slutföra inlämningen.

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Redigera

1. Om ni behöver ändra SQL-frågan, klicka på knappen **Redigera** (Edit) för att direkt ändra SQL-satsen och konfigurera om fälten vid behov.

2. För att justera fältmetadata, använd alternativet **Konfigurera fält** (Configure fields), vilket låter er uppdatera fältinställningarna precis som ni skulle göra för en vanlig tabell.

### Synkronisering

Om SQL-frågan förblir oförändrad men den underliggande databastabellstrukturen har modifierats, kan ni synkronisera och konfigurera om fälten genom att välja **Konfigurera fält** (Configure Fields) - **Synkronisera från databas** (Sync from Database).

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### SQL-samling jämfört med länkade databasvyer

| Malltyp | Bäst lämpad för | Implementeringsmetod | Stöd för CRUD-operationer |
| :--- | :--- | :--- | :--- |
| SQL | Enkla modeller, lättviktiga användningsfall<br />Begränsad interaktion med databasen<br />Undvika underhåll av vyer<br />Föredrar UI-drivna operationer | SQL-underfråga | Stöds ej |
| Anslut till databasvy | Komplexa modeller<br />Kräver databasinteraktion<br />Datamodifiering behövs<br />Kräver starkare och stabilare databasstöd | Databasvy | Delvis stöds |

:::warning
När ni använder en SQL-samling, se till att välja tabeller som är hanterbara inom NocoBase. Att använda tabeller från samma databas som inte är anslutna till NocoBase kan leda till felaktig parsning av SQL-frågor. Om detta är ett problem, överväg att skapa och länka till en vy istället.
:::