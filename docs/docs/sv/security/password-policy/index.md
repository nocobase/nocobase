---
pkg: '@nocobase/plugin-password-policy'
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::


# Lösenordspolicy

## Introduktion

Här kan ni ställa in lösenordsregler, lösenords giltighetstid och säkerhetspolicyer för inloggning för alla användare, samt hantera låsta användare.

## Lösenordsregler

![](https://static-docs.nocobase.com/202412281329313.png)

### Minsta lösenordslängd

Ställ in det minsta antal tecken som krävs för lösenord. Maxlängden är 64 tecken.

### Krav på lösenordskomplexitet

Följande alternativ stöds:

- Måste innehålla bokstäver och siffror
- Måste innehålla bokstäver, siffror och symboler
- Måste innehålla siffror, stora och små bokstäver
- Måste innehålla siffror, stora och små bokstäver samt symboler
- Måste innehålla minst 3 av följande teckentyper: siffror, stora bokstäver, små bokstäver och specialtecken
- Inga begränsningar

![](https://static-docs.nocobase.com/202412281331649.png)

### Lösenord får inte innehålla användarnamn

Ställ in om lösenordet får innehålla den aktuella användarens användarnamn.

### Lösenordshistorik

Systemet kommer ihåg de senaste lösenorden som användaren har använt. Användare kan inte återanvända dessa lösenord när de byter lösenord. 0 innebär ingen begränsning, och maxantalet är 24.

## Konfiguration för lösenords giltighetstid

![](https://static-docs.nocobase.com/202412281335588.png)

### Lösenords giltighetstid

Giltighetstiden för användarens lösenord. Användare måste byta lösenord innan det går ut för att giltighetstiden ska återställas. Om lösenordet inte byts innan det går ut, kommer användaren inte att kunna logga in med det gamla lösenordet och behöver då hjälp av en administratör för att återställa det. Om andra inloggningsmetoder är konfigurerade kan användaren fortfarande logga in med dessa.

### Meddelandekanal för påminnelse om lösenords giltighetstid

Inom 10 dagar före användarens lösenord går ut skickas en påminnelse varje gång användaren loggar in. Som standard skickas påminnelsen via den interna meddelandekanalen "Påminnelse om lösenords giltighetstid", vilken kan hanteras under meddelandehantering.

### Konfigurationsrekommendationer

Eftersom utgångna lösenord kan leda till att konton inte kan logga in, inklusive administratörskonton, rekommenderas det att ni byter lösenord i tid och att ni konfigurerar flera konton i systemet som har behörighet att ändra användarlösenord.

## Säkerhet vid lösenordsinloggning

Ställ in begränsningar för ogiltiga lösenordsförsök vid inloggning.

![](https://static-docs.nocobase.com/202412281339724.png)

### Maximalt antal ogiltiga lösenordsförsök

Ställ in det maximala antalet inloggningsförsök en användare kan göra inom ett angivet tidsintervall.

### Maximalt tidsintervall för ogiltiga lösenordsförsök (sekunder)

Ställ in tidsintervallet (i sekunder) för att beräkna det maximala antalet ogiltiga inloggningsförsök för en användare.

### Låsningsperiod (sekunder)

Ställ in hur länge en användare ska vara låst efter att ha överskridit gränsen för ogiltiga lösenordsförsök (0 betyder ingen begränsning). Under låsningsperioden kommer användaren att nekas åtkomst till systemet via alla autentiseringsmetoder, inklusive API-nycklar. Om ni behöver låsa upp en användare manuellt, se [Användarlåsning](./lockout.md).

### Scenarier

#### Inga begränsningar

Inga begränsningar för antalet ogiltiga lösenordsförsök som användare kan göra.

![](https://static-docs.nocobase.com/202412281343226.png)

#### Begränsa försöksfrekvens, lås inte användare

Exempel: En användare kan försöka logga in högst 5 gånger var 5:e minut.

![](https://static-docs.nocobase.com/202412281344412.png)

#### Lås användare efter att gränsen överskridits

Exempel: Om en användare gör 5 ogiltiga lösenordsförsök i följd inom 5 minuter, låses användaren i 2 timmar.

![](https://static-docs.nocobase.com/202412281344952.png)

### Konfigurationsrekommendationer

- Konfigurationen för antal ogiltiga lösenordsförsök och tidsintervallet används vanligtvis för att begränsa högfrekventa inloggningsförsök med lösenord under en kort period, för att förhindra brute-force-attacker.
- Om användaren ska låsas efter att gränsen överskridits bör övervägas utifrån det faktiska användningsscenariot. Inställningen för låsningsperiod kan utnyttjas illvilligt, då angripare medvetet kan mata in felaktiga lösenord flera gånger för ett målkonto, vilket tvingar kontot att låsas och gör det obrukbart. Detta kan motverkas genom att kombinera IP-begränsningar, API-frekvensbegränsningar och andra åtgärder.
- Eftersom kontolåsning förhindrar åtkomst till systemet, inklusive administratörskonton, är det lämpligt att ni konfigurerar flera konton i systemet som har behörighet att låsa upp användare.