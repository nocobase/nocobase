:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Integrace HTTP požadavků v pracovních postupech

Pomocí uzlu HTTP požadavek mohou **pracovní postupy** NocoBase aktivně odesílat požadavky na libovolnou HTTP službu, což umožňuje výměnu dat a obchodní integraci s externími systémy.

## Přehled

Uzel HTTP požadavek je klíčovou integrační komponentou v **pracovních postupech**, která Vám umožňuje během jejich provádění volat API třetích stran, rozhraní interních služeb nebo jiné webové služby za účelem získání dat nebo spuštění externích operací.

## Typické scénáře použití

### Získávání dat

- **Dotazy na data třetích stran**: Získávání dat v reálném čase z API počasí, směnných kurzů apod.
- **Rozlišení adres**: Volání API mapových služeb pro analýzu adres a geokódování.
- **Synchronizace podnikových dat**: Získávání dat o zákaznících a objednávkách ze systémů CRM a ERP.

### Spouštění obchodních operací

- **Odesílání zpráv**: Volání služeb SMS, e-mailu, WeCom apod. pro odesílání oznámení.
- **Platební požadavky**: Iniciování plateb, vracení peněz apod. prostřednictvím platebních bran.
- **Zpracování objednávek**: Odesílání přepravních listů a dotazování na stav logistiky v přepravních systémech.

### Systémová integrace

- **Volání mikroslužeb**: Volání API jiných služeb v architektuře mikroslužeb.
- **Hlášení dat**: Hlášení obchodních dat analytickým platformám a monitorovacím systémům.
- **Služby třetích stran**: Integrace služeb AI, rozpoznávání OCR, syntézy řeči apod.

### Automatizované operace

- **Plánované úlohy**: Pravidelné volání externích API pro synchronizaci dat.
- **Reakce na události**: Automatické volání externích API při změně dat pro informování souvisejících systémů.
- **Schvalovací pracovní postupy**: Odesílání žádostí o schválení prostřednictvím API schvalovacích systémů.

## Funkce

### Kompletní podpora HTTP

- Podporuje všechny HTTP metody: GET, POST, PUT, PATCH, DELETE.
- Podporuje vlastní hlavičky požadavků (Headers).
- Podporuje více datových formátů: JSON, data formulářů, XML.
- Podporuje různé typy parametrů: parametry URL, parametry cesty, tělo požadavku.

### Flexibilní zpracování dat

- **Odkazy na proměnné**: Dynamické vytváření požadavků pomocí proměnných **pracovního postupu**.
- **Analýza odpovědí**: Automatická analýza JSON odpovědí a extrakce požadovaných dat.
- **Transformace dat**: Transformace formátů dat požadavků a odpovědí.
- **Zpracování chyb**: Konfigurace strategií opakování, nastavení časových limitů a logiky zpracování chyb.

### Bezpečnostní autentizace

- **Basic Auth**: Základní HTTP autentizace.
- **Bearer Token**: Autentizace pomocí tokenu.
- **API Key**: Vlastní autentizace pomocí API klíče.
- **Vlastní hlavičky**: Podpora libovolné metody autentizace.

## Kroky použití

### 1. Ověřte, zda je **plugin** povolen

Uzel HTTP požadavek je vestavěnou funkcí **pluginu** **pracovních postupů**. Ujistěte se, že je **[plugin](/plugins/@nocobase/plugin-workflow/)** **pracovních postupů** povolen.

### 2. Přidejte uzel HTTP požadavek do **pracovního postupu**

1. Vytvořte nebo upravte **pracovní postup**.
2. Přidejte uzel **HTTP požadavek** na požadované místo.

![HTTP Request - Add Node](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

3. Nakonfigurujte parametry požadavku.

### 3. Konfigurace parametrů požadavku

![HTTP Request Node - Configuration](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

#### Základní konfigurace

- **URL požadavku**: Cílová adresa API, podporuje použití proměnných.
  ```
  https://api.example.com/users/{{$context.userId}}
  ```

- **Metoda požadavku**: Vyberte GET, POST, PUT, DELETE apod.

- **Hlavičky požadavku**: Konfigurace HTTP hlaviček.
  ```json
  {
    "Content-Type": "application/json",
    "Authorization": "Bearer {{$context.apiKey}}"
  }
  ```

- **Parametry požadavku**:
  - **Query parametry**: Parametry dotazu URL.
  - **Body parametry**: Data těla požadavku (POST/PUT).

#### Pokročilá konfigurace

- **Časový limit**: Nastavte časový limit požadavku (výchozí 30 sekund).
- **Opakování při selhání**: Nakonfigurujte počet opakování a interval opakování.
- **Ignorovat selhání**: **Pracovní postup** pokračuje v provádění, i když požadavek selže.
- **Nastavení proxy**: Nakonfigurujte HTTP proxy (pokud je potřeba).

### 4. Použití dat z odpovědi

Po provedení uzlu HTTP požadavek lze data z odpovědi použít v následujících uzlech:

- `{{$node.data.status}}`: Stavový kód HTTP.
- `{{$node.data.headers}}`: Hlavičky odpovědi.
- `{{$node.data.data}}`: Data těla odpovědi.
- `{{$node.data.error}}`: Chybová zpráva (pokud požadavek selhal).

![HTTP Request Node - Response Usage](https://static-docs.nocobase.com/20240529110610.png)

## Příklady scénářů

### Příklad 1: Získání informací o počasí

```javascript
// Konfigurace
URL: https://api.weather.com/v1/current
Method: GET
Query Parameters:
  city: {{$context.city}}
  key: your-api-key

// Použití odpovědi
Temperature: {{$node.data.data.temperature}}
Weather: {{$node.data.data.condition}}
```

### Příklad 2: Odeslání zprávy WeCom

```javascript
// Konfigurace
URL: https://qyapi.weixin.qq.com/cgi-bin/message/send
Method: POST
Headers:
  Content-Type: application/json
Body:
{
  "touser": "{{$context.userId}}",
  "msgtype": "text",
  "agentid": 1000001,
  "text": {
    "content": "Objednávka {{$context.orderId}} byla odeslána"
  }
}
```

### Příklad 3: Dotaz na stav platby

```javascript
// Konfigurace
URL: https://api.payment.com/v1/orders/{{$context.orderId}}/status
Method: GET
Headers:
  Authorization: Bearer {{$context.apiKey}}
  Content-Type: application/json

// Podmíněná logika
Pokud {{$node.data.data.status}} je rovno "paid"
  - Aktualizujte stav objednávky na "Zaplaceno"
  - Odešlete oznámení o úspěšné platbě
Jinak pokud {{$node.data.data.status}} je rovno "pending"
  - Ponechte stav objednávky jako "Čeká na platbu"
Jinak
  - Zaznamenejte selhání platby
  - Upozorněte administrátora na zpracování výjimky
```

### Příklad 4: Synchronizace dat do CRM

```javascript
// Konfigurace
URL: https://api.crm.com/v1/customers
Method: POST
Headers:
  X-API-Key: {{$context.crmApiKey}}
  Content-Type: application/json
Body:
{
  "name": "{{$context.customerName}}",
  "email": "{{$context.email}}",
  "phone": "{{$context.phone}}",
  "source": "NocoBase",
  "created_at": "{{$context.createdAt}}"
}
```

## Konfigurace autentizace

### Basic Authentication

```javascript
Headers:
  Authorization: Basic base64(username:password)
```

### Bearer Token

```javascript
Headers:
  Authorization: Bearer your-access-token
```

### API Key

```javascript
// V hlavičce
Headers:
  X-API-Key: your-api-key

// Nebo v dotazu
Query Parameters:
  api_key: your-api-key
```

### OAuth 2.0

Nejprve získejte `access_token`, poté použijte:

```javascript
Headers:
  Authorization: Bearer {{$context.accessToken}}
```

## Zpracování chyb a ladění

### Běžné chyby

1. **Vypršení časového limitu připojení**: Zkontrolujte síťové připojení, zvyšte časový limit.
2. **401 Neautorizováno**: Ověřte, zda jsou autentizační údaje správné.
3. **404 Nenalezeno**: Zkontrolujte, zda je URL správná.
4. **500 Chyba serveru**: Zkontrolujte stav služby poskytovatele API.

### Tipy pro ladění

1. **Použijte uzly protokolu**: Před a po HTTP požadavcích přidejte uzly protokolu pro zaznamenávání dat požadavků a odpovědí.

2. **Zkontrolujte protokoly provádění**: Protokoly provádění **pracovního postupu** obsahují podrobné informace o požadavcích a odpovědích.

3. **Testovací nástroje**: Nejprve otestujte API pomocí nástrojů jako Postman, cURL apod.

4. **Zpracování chyb**: Přidejte podmíněnou logiku pro zpracování různých stavů odpovědí.

```javascript
Pokud {{$node.data.status}} >= 200 a {{$node.data.status}} < 300
  - Zpracujte logiku úspěchu
Jinak
  - Zpracujte logiku selhání
  - Zaznamenejte chybu: {{$node.data.error}}
```

## Doporučení pro optimalizaci výkonu

### 1. Použijte asynchronní zpracování

Pro požadavky, které nevyžadují okamžité výsledky, zvažte použití asynchronních **pracovních postupů**.

### 2. Nakonfigurujte přiměřené časové limity

Nastavte časové limity na základě skutečných dob odezvy API, abyste předešli nadměrnému čekání.

### 3. Implementujte strategie ukládání do mezipaměti

Pro data, která se často nemění (např. konfigurace, slovníky), zvažte ukládání odpovědí do mezipaměti.

### 4. Dávkové zpracování

Pokud potřebujete volat stejné API vícekrát, zvažte použití dávkových rozhraní API (pokud jsou podporována).

### 5. Opakování při chybě

Nakonfigurujte přiměřené strategie opakování, ale vyhněte se nadměrnému opakování, které by mohlo vést k omezení rychlosti API.

## Doporučené postupy zabezpečení

### 1. Chraňte citlivé informace

- Nevystavujte citlivé informace v URL.
- Používejte HTTPS pro šifrovaný přenos.
- API klíče a citlivá data ukládejte do proměnných prostředí nebo do správy konfigurace.

### 2. Ověřte data z odpovědi

```javascript
// Ověřte stav odpovědi
if (![200, 201].includes($node.data.status)) {
  throw new Error('Požadavek API selhal');
}

// Ověřte formát dat
if (!$node.data.data || !$node.data.data.id) {
  throw new Error('Neplatná data odpovědi');
}
```

### 3. Omezení frekvence požadavků

Dodržujte omezení rychlosti API třetích stran, abyste předešli zablokování.

### 4. Sanitizace protokolů

Při zaznamenávání protokolů dbejte na sanitizaci citlivých informací (hesla, klíče apod.).

## Srovnání s Webhookem

| Funkce | Uzel HTTP požadavek | Webhook spouštěč |
|--------|--------------------|-----------------|
| Směr | NocoBase volá externí | Externí volá NocoBase |
| Načasování | Během provádění **pracovního postupu** | Při výskytu externí události |
| Účel | Získávání dat, spouštění externích operací | Přijímání externích oznámení, událostí |
| Typické scénáře | Volání platebního API, dotaz na počasí | Zpětná volání plateb, oznámení zpráv |

Tyto dvě funkce se vzájemně doplňují a společně tvoří kompletní řešení systémové integrace.

## Související zdroje

- [Dokumentace **pluginu** **pracovních postupů**](/plugins/@nocobase/plugin-workflow/)
- [**Pracovní postup**: Uzel HTTP požadavek](/workflow/nodes/request)
- [**Pracovní postup**: Webhook spouštěč](/integration/workflow-webhook/)
- [Autentizace pomocí API klíčů](/integration/api-keys/)
- [**Plugin** pro dokumentaci API](/plugins/@nocobase/plugin-api-doc/)