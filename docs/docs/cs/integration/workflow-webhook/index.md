:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Integrace Webhooků do pracovních postupů

Pomocí spouštěčů Webhooků může NocoBase přijímat HTTP volání z externích systémů a automaticky spouštět pracovní postupy, čímž zajišťuje bezproblémovou integraci s externími systémy.

## Přehled

Webhook je mechanismus "reverzního API", který umožňuje externím systémům proaktivně odesílat data do NocoBase, když nastanou specifické události. Ve srovnání s aktivním dotazováním (pollingem) nabízejí Webhooky okamžitější a efektivnější způsob integrace.

## Typické scénáře použití

### Odesílání dat z formulářů

Externí dotazníkové systémy, registrační formuláře a formuláře pro zpětnou vazbu od zákazníků odesílají po odeslání dat uživatelem data do NocoBase prostřednictvím Webhooku, čímž automaticky vytvářejí záznamy a spouštějí následné zpracování (například odesílání potvrzovacích e-mailů, přidělování úkolů apod.).

### Oznámení zpráv

Události z platforem pro zasílání zpráv třetích stran (například WeCom, DingTalk, Slack), jako jsou nové zprávy, zmínky nebo dokončení schválení, mohou prostřednictvím Webhooků spouštět automatizované procesy v NocoBase.

### Synchronizace dat

Když se data změní v externích systémech (například CRM, ERP), Webhooky odesílají aktualizace do NocoBase v reálném čase, aby udržely synchronizaci dat.

### Integrace služeb třetích stran

- **GitHub**: Události jako push kódu, vytvoření PR spouštějí automatizační pracovní postupy.
- **GitLab**: Oznámení o stavu CI/CD pipeline.
- **Odesílání formulářů**: Externí formulářové systémy odesílají data do NocoBase.
- **IoT zařízení**: Změny stavu zařízení, hlášení dat ze senzorů.

## Funkční vlastnosti

### Flexibilní mechanismus spouštění

- Podporuje HTTP metody GET, POST, PUT, DELETE.
- Automaticky parsuje JSON, data z formulářů a další běžné formáty.
- Konfigurovatelné ověřování požadavků pro zajištění důvěryhodných zdrojů.

### Možnosti zpracování dat

- Přijatá data lze v pracovních postupech použít jako proměnné.
- Podporuje složitou logiku transformace a zpracování dat.
- Lze kombinovat s dalšími uzly pracovního postupu pro implementaci složité obchodní logiky.

### Zajištění bezpečnosti

- Podporuje ověřování podpisu pro prevenci padělaných požadavků.
- Konfigurovatelný IP whitelist.
- Šifrovaný přenos HTTPS.

## Kroky použití

### 1. Instalace pluginu

V manažeru pluginů najděte a nainstalujte **[pracovní postup: Spouštěč Webhooků](/plugins/@nocobase/plugin-workflow-webhook/)** plugin.

> Poznámka: Tento plugin je komerční a vyžaduje samostatný nákup nebo předplatné.

### 2. Vytvoření pracovního postupu Webhooku

1. Přejděte na stránku **Správa pracovních postupů**.
2. Klikněte na **Vytvořit pracovní postup**.
3. Zvolte **Spouštěč Webhooků** jako typ spouštěče.

![Vytvořit pracovní postup Webhooku](https://static-docs.nocobase.com/20241210105049.png)

4. Konfigurujte parametry Webhooku.

![Konfigurace spouštěče Webhooku](https://static-docs.nocobase.com/20241210105441.png)
   - **Cesta požadavku**: Vlastní URL cesta Webhooku
   - **Metoda požadavku**: Vyberte povolené HTTP metody (GET/POST/PUT/DELETE)
   - **Synchronní/Asynchronní**: Zvolte, zda se má čekat na dokončení pracovního postupu před vrácením výsledků
   - **Ověřování**: Konfigurujte ověřování podpisu nebo jiné bezpečnostní mechanismy

### 3. Konfigurace uzlů pracovního postupu

Přidejte uzly pracovního postupu podle obchodních požadavků, například:

- **Operace s kolekcemi**: Vytváření, aktualizace, mazání záznamů
- **Podmíněná logika**: Větvení na základě přijatých dat
- **HTTP požadavek**: Volání jiných API
- **Oznámení**: Odesílání e-mailů, SMS atd.
- **Vlastní kód**: Spouštění JavaScript kódu

### 4. Získání URL Webhooku

Po vytvoření pracovního postupu systém vygeneruje unikátní URL Webhooku, obvykle ve formátu:

```
https://your-nocobase-domain.com/api/webhooks/your-workflow-key
```

### 5. Konfigurace v systému třetí strany

Vygenerovanou URL Webhooku nakonfigurujte v systému třetí strany:

- V systémech formulářů nastavte adresu zpětného volání pro odesílání dat.
- Nakonfigurujte Webhook v GitHubu/GitLabu.
- Nakonfigurujte adresu pro odesílání událostí ve WeCom/DingTalk.

### 6. Testování Webhooku

Otestujte Webhook pomocí nástrojů (například Postman, cURL):

```bash
curl -X POST https://your-nocobase-domain.com/api/webhooks/your-workflow-key \
  -H "Content-Type: application/json" \
  -d '{"event":"test","data":{"message":"Hello NocoBase"}}'
```

## Přístup k datům požadavku

V pracovních postupech můžete přistupovat k datům přijatým Webhookem prostřednictvím proměnných:

- `{{$context.data}}`: Data těla požadavku
- `{{$context.headers}}`: Hlavičky požadavku
- `{{$context.query}}`: Parametry dotazu URL
- `{{$context.params}}`: Parametry cesty

![Parsování parametrů požadavku](https://static-docs.nocobase.com/20241210111155.png)

![Parsování těla požadavku](https://static-docs.nocobase.com/20241210112529.png)

## Konfigurace odpovědi

![Nastavení odpovědi](https://static-docs.nocobase.com/20241210114312.png)

### Synchronní režim

Po dokončení spuštění pracovního postupu se vrátí výsledky, lze konfigurovat:

- **Stavový kód odpovědi**: 200, 201 atd.
- **Data odpovědi**: Vlastní JSON data odpovědi
- **Hlavičky odpovědi**: Vlastní HTTP hlavičky

### Asynchronní režim

Okamžitě se vrátí potvrzovací odpověď, pracovní postup se provádí na pozadí. Vhodné pro:

- Dlouhotrvající pracovní postupy
- Scénáře, které nevyžadují vrácení výsledků spuštění
- Scénáře s vysokou souběžností

## Osvědčené bezpečnostní postupy

### 1. Povolení ověřování podpisu

Většina služeb třetích stran podporuje mechanismy podpisu:

```javascript
// Příklad: Ověření podpisu GitHub Webhooku
const crypto = require('crypto');
const signature = context.headers['x-hub-signature-256'];
const payload = JSON.stringify(context.data);
const secret = 'your-webhook-secret';
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid signature');
}
```

### 2. Použití HTTPS

Zajistěte, aby NocoBase bylo nasazeno v prostředí HTTPS, pro ochranu bezpečnosti přenosu dat.

### 3. Omezení zdrojů požadavků

Nakonfigurujte IP whitelist, aby byly povoleny pouze požadavky z důvěryhodných zdrojů.

### 4. Ověřování dat

Přidejte do pracovních postupů logiku ověřování dat, abyste zajistili správný formát a platný obsah přijatých dat.

### 5. Auditní záznamy

Zaznamenávejte všechny požadavky Webhooku pro snadné sledování a řešení problémů.

## Řešení problémů

### Webhook se nespouští?

1. Zkontrolujte, zda je URL Webhooku správná.
2. Potvrďte, že stav pracovního postupu je "Povoleno".
3. Zkontrolujte protokoly odesílání systému třetí strany.
4. Zkontrolujte konfiguraci firewallu a sítě.

### Jak ladit Webhooky?

1. Zkontrolujte záznamy spuštění pracovního postupu pro podrobné informace o požadavcích a výsledcích volání.
2. Použijte nástroje pro testování Webhooků (například Webhook.site) k ověření požadavků.
3. Zkontrolujte klíčová data a chybové zprávy v záznamech spuštění.

### Jak řešit opakované pokusy?

Některé služby třetích stran se pokusí odeslat znovu, pokud neobdrží úspěšnou odpověď:

- Zajistěte, aby pracovní postup byl idempotentní.
- Použijte jedinečné identifikátory pro deduplikaci.
- Zaznamenávejte ID zpracovaných požadavků.

### Tipy pro optimalizaci výkonu

- Použijte asynchronní režim pro časově náročné operace.
- Přidejte podmíněnou logiku pro filtrování nepotřebných požadavků.
- Zvažte použití front zpráv pro scénáře s vysokou souběžností.

## Příklad scénářů

### Zpracování externího odeslání formuláře

```javascript
// 1. Ověřte zdroj dat
// 2. Parsujte data formuláře
const formData = context.data;

// 3. Vytvořte záznam zákazníka
// 4. Přidělte příslušnému vlastníkovi
// 5. Odešlete potvrzovací e-mail odesílateli
if (formData.email) {
  // Odeslat e-mailové oznámení
}
```

### Oznámení o push kódu na GitHub

```javascript
// 1. Parsujte data push
const commits = context.data.commits;
const branch = context.data.ref.replace('refs/heads/', '');

// 2. Pokud je to hlavní větev
if (branch === 'main') {
  // 3. Spusťte proces nasazení
  // 4. Upozorněte členy týmu
}
```

![Příklad pracovního postupu Webhooku](https://static-docs.nocobase.com/20241210120655.png)

## Související zdroje

- [Dokumentace pluginu pro pracovní postupy](/plugins/@nocobase/plugin-workflow/)
- [Pracovní postup: Spouštěč Webhooků](/workflow/triggers/webhook)
- [Pracovní postup: Uzel HTTP požadavku](/integration/workflow-http-request/)
- [Ověřování pomocí API klíčů](/integration/api-keys/)