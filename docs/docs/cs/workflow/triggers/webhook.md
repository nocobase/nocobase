---
pkg: '@nocobase/plugin-workflow-webhook'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Webhook

## Úvod

Spouštěč Webhooku poskytuje URL adresu, kterou mohou systémy třetích stran volat prostřednictvím HTTP požadavků. Když dojde k události třetí strany, odešle se na tuto URL HTTP požadavek, který spustí provedení pracovního postupu. Je vhodný pro oznámení iniciovaná externími systémy, jako jsou zpětná volání plateb, zprávy a podobně.

## Vytvoření pracovního postupu

Při vytváření pracovního postupu vyberte typ „Webhook událost“:

![20241210105049](https://static-docs.nocobase.com/20241210105049.png)

:::info{title="Poznámka"}
Rozdíl mezi „synchronními“ a „asynchronními“ pracovními postupy spočívá v tom, že synchronní pracovní postup čeká na dokončení provedení pracovního postupu, než vrátí odpověď, zatímco asynchronní pracovní postup okamžitě vrátí odpověď nakonfigurovanou ve spouštěči a zařadí provedení do fronty na pozadí.
:::

## Konfigurace spouštěče

![20241210105441](https://static-docs.nocobase.com/20241210105441.png)

### Webhook URL

URL adresa pro Webhook spouštěč je automaticky generována systémem a je svázána s tímto pracovním postupem. Můžete kliknout na tlačítko vpravo pro její zkopírování a vložit ji do systému třetí strany.

Podporována je pouze metoda HTTP POST; jiné metody vrátí chybu `405`.

### Zabezpečení

V současné době je podporována HTTP Basic autentizace. Tuto možnost můžete povolit a nastavit uživatelské jméno a heslo. Zahrňte uživatelské jméno a heslo do Webhook URL v systému třetí strany pro implementaci bezpečnostní autentizace pro Webhook (podrobnosti o standardu naleznete na: [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#basic_authentication_scheme)).

Pokud jsou nastaveny uživatelské jméno a heslo, systém ověří, zda se uživatelské jméno a heslo v požadavku shodují. Pokud nejsou poskytnuty nebo se neshodují, bude vrácena chyba `401`.

### Parsování dat požadavku

Když třetí strana volá Webhook, data obsažená v požadavku je třeba naparsovat, než je bude možné použít v pracovním postupu. Po naparsování se stanou proměnnou spouštěče, kterou lze odkazovat v následných uzlech.

Parsování HTTP požadavku je rozděleno do tří částí:

1.  Hlavičky požadavku

    Hlavičky požadavku jsou obvykle jednoduché páry klíč-hodnota řetězcového typu. Pole hlaviček, která potřebujete použít, lze konfigurovat přímo, například `Date`, `X-Request-Id` apod.

2.  Parametry požadavku

    Parametry požadavku jsou parametry dotazu v URL adrese, například parametr `query` v `http://localhost:13000/api/webhook:trigger/1hfmkioou0d?query=1`. Můžete vložit celou ukázkovou URL adresu nebo pouze část s parametry dotazu a kliknout na tlačítko pro parsování, čímž se automaticky naparsují páry klíč-hodnota.

    ![20241210111155](https://static-docs.nocobase.com/20241210111155.png)

    Automatické parsování převede část URL s parametry do struktury JSON a vygeneruje cesty jako `query[0]`, `query[0].a` na základě hierarchie parametrů. Název cesty lze ručně upravit, pokud nevyhovuje vašim potřebám, ale obvykle není nutná žádná úprava. Alias je zobrazovaný název proměnné při jejím použití, což je volitelné. Parsování také vygeneruje úplný seznam parametrů z ukázky; můžete odstranit všechny parametry, které nepotřebujete.

3.  Tělo požadavku

    Tělo požadavku je část Body HTTP požadavku. V současné době jsou podporována pouze těla požadavků s `Content-Type` `application/json`. Můžete přímo konfigurovat cesty k parsování, nebo můžete zadat ukázku JSON a kliknout na tlačítko pro parsování pro automatické parsování.

    ![20241210112529](https://static-docs.nocobase.com/20241210112529.png)

    Automatické parsování převede páry klíč-hodnota ve struktuře JSON na cesty. Například `{"a": 1, "b": {"c": 2}}` vygeneruje cesty jako `a`, `b` a `b.c`. Alias je zobrazovaný název proměnné při jejím použití, což je volitelné. Parsování také vygeneruje úplný seznam parametrů z ukázky; můžete odstranit všechny parametry, které nepotřebujete.

### Nastavení odpovědi

Konfigurace odpovědi Webhooku se liší mezi synchronními a asynchronními pracovními postupy. U asynchronních pracovních postupů je odpověď konfigurována přímo ve spouštěči. Po obdržení Webhook požadavku okamžitě vrátí nakonfigurovanou odpověď systému třetí strany a poté provede pracovní postup. U synchronních pracovních postupů je třeba přidat uzel odpovědi do toku, aby se zpracovala podle obchodních požadavků (podrobnosti viz: [Uzel odpovědi](#uzel-odpovědi)).

Typicky má odpověď pro asynchronně spuštěnou Webhook událost stavový kód `200` a tělo odpovědi `ok`. Podle potřeby můžete také přizpůsobit stavový kód odpovědi, hlavičky a tělo.

![20241210114312](https://static-docs.nocobase.com/20241210114312.png)

## Uzel odpovědi

Odkaz: [Uzel odpovědi](../nodes/response.md)

## Příklad

V pracovním postupu Webhooku můžete vracet různé odpovědi na základě různých obchodních podmínek, jak je znázorněno na obrázku níže:

![20241210120655](https://static-docs.nocobase.com/20241210120655.png)

Použijte uzel podmíněné větve k určení, zda je splněn určitý obchodní stav. Pokud ano, vraťte úspěšnou odpověď; jinak vraťte neúspěšnou odpověď.