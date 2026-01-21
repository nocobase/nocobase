---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::


# Versleuteling

## Introductie

Sommige gevoelige bedrijfsgegevens, zoals telefoonnummers van klanten, e-mailadressen of kaartnummers, kunnen worden versleuteld. Na versleuteling worden deze gegevens als cijfertekst opgeslagen in de database.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Versleuteling

:::warning
De plugin genereert automatisch een `applicatiesleutel`, die wordt opgeslagen in de map `/storage/apps/main/encryption-field-keys`.

De bestandsnaam van de `applicatiesleutel` is de sleutel-ID, met de extensie `.key`. Wijzig de bestandsnaam niet zomaar.

Bewaar het bestand met de `applicatiesleutel` zorgvuldig. Als u het bestand met de `applicatiesleutel` verliest, kunnen de versleutelde gegevens niet meer worden ontsleuteld.

Als de plugin is ingeschakeld voor een sub-applicatie, wordt de sleutel standaard opgeslagen in de map `/storage/apps/${sub-applicatie naam}/encryption-field-keys`.
:::

### Hoe het werkt

Maakt gebruik van envelopversleuteling.

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Proces voor sleutelcreatie
1. De eerste keer dat u een versleuteld veld aanmaakt, genereert het systeem automatisch een 32-bits `applicatiesleutel`. Deze wordt in Base64-codering opgeslagen in de standaard opslagmap.
2. Telkens wanneer u een nieuw versleuteld veld aanmaakt, wordt voor dit veld een willekeurige 32-bits `veldsleutel` gegenereerd. Deze wordt vervolgens versleuteld met de `applicatiesleutel` en een willekeurig gegenereerde 16-bits `veldversleutelingsvector` (met het `AES`-versleutelingsalgoritme), en daarna opgeslagen in het `options`-veld van de `fields`-tabel.

### Proces voor veldversleuteling
1. Telkens wanneer u gegevens naar een versleuteld veld schrijft, haalt u eerst de versleutelde `veldsleutel` en `veldversleutelingsvector` op uit het `options`-veld van de `fields`-tabel.
2. U ontsleutelt de versleutelde `veldsleutel` met behulp van de `applicatiesleutel` en de `veldversleutelingsvector`. Vervolgens worden de gegevens versleuteld met de `veldsleutel` en een willekeurig gegenereerde 16-bits `gegevensversleutelingsvector` (met het `AES`-versleutelingsalgoritme).
3. De gegevens worden ondertekend met de ontsleutelde `veldsleutel` (met het `HMAC-SHA256`-digestalgoritme) en omgezet naar een Base64-gecodeerde string. (De gegenereerde `gegevenshandtekening` wordt later gebruikt voor gegevensopvraging.)
4. De 16-bits `gegevensinitialisatievector` en de versleutelde `cijfertekst` worden binair samengevoegd en vervolgens in Base64 gecodeerd naar een string.
5. De Base64-gecodeerde string van de `gegevenshandtekening` en de samengevoegde Base64-gecodeerde string van de `cijfertekst` worden samengevoegd met een `.` als scheidingsteken.
6. De uiteindelijke samengevoegde string wordt opgeslagen in de database.

## Omgevingsvariabelen

Als u een aangepaste `applicatiesleutel` wilt opgeven, kunt u de omgevingsvariabele `ENCRYPTION_FIELD_KEY_PATH` gebruiken. De plugin zal het bestand op dat pad laden als de `applicatiesleutel`.

**Vereisten voor het bestand met de `applicatiesleutel`:**
1. De bestandsextensie moet `.key` zijn.
2. De bestandsnaam wordt gebruikt als sleutel-ID; het wordt aanbevolen om een UUID te gebruiken om uniciteit te garanderen.
3. De inhoud van het bestand moet bestaan uit 32 bytes aan Base64-gecodeerde binaire gegevens.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Veldconfiguratie

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Impact op filteren na versleuteling

Versleutelde velden ondersteunen alleen: gelijk aan, niet gelijk aan, bestaat, bestaat niet.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

**Werkwijze voor gegevensfiltering:**
1. Haal de `veldsleutel` van het versleutelde veld op en ontsleutel deze met de `applicatiesleutel`.
2. Gebruik de `veldsleutel` om de door de gebruiker ingevoerde zoektekst te ondertekenen (met `HMAC-SHA256`).
3. Voeg de ondertekende zoektekst samen met een `.` als scheidingsteken en voer een zoekopdracht met voorvoegselovereenkomst uit op het versleutelde veld in de database.

## Sleutelrotatie

:::warning
Voordat u de `nocobase key-rotation`-opdracht gebruikt, moet u ervoor zorgen dat de plugin is geladen in de applicatie.
:::

Wanneer u een applicatie naar een nieuwe omgeving migreert en niet langer dezelfde sleutel als de oude omgeving wilt gebruiken, kunt u de `nocobase key-rotation`-opdracht gebruiken om de `applicatiesleutel` te vervangen.

Voor het uitvoeren van de sleutelrotatie-opdracht moet u de `applicatiesleutel` van de oude omgeving opgeven. Na uitvoering wordt een nieuwe `applicatiesleutel` gegenereerd en (Base64-gecodeerd) opgeslagen in de standaardmap.

```bash
# --key-path specificeert het bestand met de applicatiesleutel van de oude omgeving, dat overeenkomt met de versleutelde gegevens in de database.
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Als u de `applicatiesleutel` van een sub-applicatie wilt vervangen, moet u de parameter `--app-name` toevoegen en de `naam` van de sub-applicatie opgeven.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```