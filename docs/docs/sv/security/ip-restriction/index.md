---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::



pkg: '@nocobase/plugin-ip-restriction'
---

# IP-begränsningar

## Introduktion

NocoBase låter administratörer ställa in vitlistor eller svartlistor för användares åtkomst-IP:er för att begränsa obehöriga externa nätverksanslutningar eller blockera kända skadliga IP-adresser, vilket minskar säkerhetsriskerna. Systemet stöder även administratörer i att söka i loggar över nekad åtkomst för att identifiera riskfyllda IP-adresser.

## Konfigurationsregler

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### IP-filtreringslägen

- **Svartlista**: När en användares åtkomst-IP matchar en IP i listan kommer systemet att **neka** åtkomst; IP-adresser som inte matchar **tillåts** som standard.
- **Vitlista**: När en användares åtkomst-IP matchar en IP i listan kommer systemet att **tillåta** åtkomst; IP-adresser som inte matchar **nekas** åtkomst som standard.

### IP-lista

Används för att definiera IP-adresser som tillåts eller nekas åtkomst till systemet. Dess specifika funktion beror på det valda IP-filtreringsläget. Stöder inmatning av IP-adresser eller CIDR-nätverkssegment, där flera adresser separeras med kommatecken eller radbrytningar.

## Sök i loggar

När en användare nekas åtkomst skrivs åtkomst-IP:n till systemloggarna, och den motsvarande loggfilen kan laddas ner för analys.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Loggexempel:

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Konfigurationsrekommendationer

### Rekommendationer för svartlistläge

- Lägg till kända skadliga IP-adresser för att förhindra potentiella nätverksattacker.
- Kontrollera och uppdatera svartlistan regelbundet, och ta bort ogiltiga eller inte längre nödvändiga IP-adresser.

### Rekommendationer för vitlistläge

- Lägg till betrodda interna nätverks-IP-adresser (som kontorsnätverkssegment) för att säkerställa säker åtkomst till kärnsystem.
- Undvik att inkludera dynamiskt tilldelade IP-adresser i vitlistan för att förhindra avbrott i åtkomsten.

### Allmänna rekommendationer

- Använd CIDR-nätverkssegment för att förenkla konfigurationen, till exempel genom att använda 192.168.0.0/24 istället för att lägga till enskilda IP-adresser.
- Säkerhetskopiera IP-listkonfigurationer regelbundet för att snabbt kunna återställa vid felaktig hantering eller systemfel.
- Övervaka åtkomstloggar regelbundet för att identifiera avvikande IP-adresser och justera svart- eller vitlistan omgående.