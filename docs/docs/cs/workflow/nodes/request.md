---
pkg: '@nocobase/plugin-workflow-request'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# HTTP Požadavek

## Úvod

Když potřebujete komunikovat s jiným webovým systémem, můžete použít uzel HTTP Požadavek. Tento uzel při svém spuštění odešle HTTP požadavek na zadanou adresu podle své konfigurace. Může přenášet data ve formátu JSON nebo `application/x-www-form-urlencoded` a zajistit tak datovou interakci s externími systémy.

Pokud jste obeznámeni s nástroji pro odesílání požadavků, jako je Postman, rychle si osvojíte používání uzlu HTTP Požadavek. Na rozdíl od těchto nástrojů mohou všechny parametry v uzlu HTTP Požadavek využívat kontextové proměnné z aktuálního pracovního postupu, což umožňuje jejich organickou integraci s obchodními procesy systému.

## Instalace

Jedná se o vestavěný plugin, není nutná žádná instalace.

## Vytvoření uzlu

V konfiguračním rozhraní pracovního postupu klikněte na tlačítko plus („+“) v toku a přidejte uzel „HTTP Požadavek“:

![HTTP Požadavek_Přidat](https://static-docs.nocobase.com/46f2a6fc3f6869c80f8fbd362a54e644.png)

## Konfigurace uzlu

![Uzel HTTP Požadavek_Konfigurace](https://static-docs.nocobase.com/2fcb29af66b892fa704add52e2974a52.png)

### Metoda požadavku

Volitelné metody HTTP požadavku: `GET`, `POST`, `PUT`, `PATCH` a `DELETE`.

### URL adresa požadavku

URL adresa HTTP služby, která musí obsahovat protokol (`http://` nebo `https://`). Doporučuje se používat `https://`.

### Formát dat požadavku

Jedná se o `Content-Type` v hlavičce požadavku. Podporované formáty naleznete v části „[Tělo požadavku](#tělo-požadavku)“.

### Konfigurace hlaviček požadavku

Páry klíč-hodnota pro sekci hlaviček požadavku. Hodnoty mohou používat proměnné z kontextu pracovního postupu.

:::info{title=Tip}
Hlavička požadavku `Content-Type` je konfigurována prostřednictvím formátu dat požadavku. Není nutné ji zde vyplňovat a jakékoli přepsání bude neúčinné.
:::

### Parametry požadavku

Páry klíč-hodnota pro sekci dotazovacích parametrů požadavku. Hodnoty mohou používat proměnné z kontextu pracovního postupu.

### Tělo požadavku

Část těla požadavku. Podporovány jsou různé formáty v závislosti na zvoleném `Content-Type`.

#### `application/json`

Podporuje text ve standardním formátu JSON. Proměnné z kontextu pracovního postupu můžete vložit pomocí tlačítka proměnné v pravém horním rohu textového editoru.

:::info{title=Tip}
Proměnné musí být použity uvnitř JSON řetězce, například: `{ "a": "{{$context.data.a}}" }`.
:::

#### `application/x-www-form-urlencoded`

Formát párů klíč-hodnota. Hodnoty mohou používat proměnné z kontextu pracovního postupu. Pokud jsou proměnné zahrnuty, budou analyzovány jako šablona řetězce a zřetězeny do konečné řetězcové hodnoty.

#### `application/xml`

Podporuje text ve standardním formátu XML. Proměnné z kontextu pracovního postupu můžete vložit pomocí tlačítka proměnné v pravém horním rohu textového editoru.

#### `multipart/form-data` <Badge>v1.8.0+</Badge>

Podporuje páry klíč-hodnota pro data formuláře. Soubory lze nahrávat, pokud je datový typ nastaven na objekt souboru. Soubory lze vybrat pouze pomocí proměnných z existujících objektů souborů v kontextu, například výsledky dotazu na kolekci souborů nebo související data z přidružené kolekce souborů.

:::info{title=Tip}
Při výběru dat souboru se ujistěte, že proměnná odpovídá jednomu objektu souboru, nikoli seznamu souborů (při dotazu na vztah typu jedna k mnoha nebo mnoho k mnoha bude hodnota pole vztahu polem).
:::

### Nastavení časového limitu

Pokud požadavek dlouho neodpovídá, lze pomocí nastavení časového limitu zrušit jeho provedení. Pokud požadavek vyprší, aktuální pracovní postup bude předčasně ukončen se stavem selhání.

### Ignorovat selhání

Uzel požadavku považuje standardní HTTP stavové kódy mezi `200` a `299` (včetně) za úspěšné a všechny ostatní za selhání. Pokud je zaškrtnuta možnost „Ignorovat neúspěšné požadavky a pokračovat v pracovním postupu“, budou následné uzly v pracovním postupu pokračovat v provádění, i když požadavek selže.

## Použití výsledku odpovědi

Výsledek odpovědi HTTP požadavku lze analyzovat pomocí uzlu [JSON Dotaz](./json-query.md) pro použití v následných uzlech.

Od verze `v1.0.0-alpha.16` lze tři části výsledku odpovědi uzlu požadavku použít jako samostatné proměnné:

*   Stavový kód odpovědi
*   Hlavičky odpovědi
*   Data odpovědi

![Uzel HTTP Požadavek_Použití výsledku odpovědi](https://static-docs.nocobase.com/20240529110610.png)

Stavový kód odpovědi je obvykle standardní HTTP stavový kód v číselné podobě, například `200`, `403` atd. (jak je poskytováno poskytovatelem služby).

Hlavičky odpovědi (Response headers) jsou ve formátu JSON. Jak hlavičky, tak data odpovědi ve formátu JSON je stále nutné před použitím analyzovat pomocí uzlu JSON.

## Příklad

Například můžeme použít uzel požadavku k propojení s cloudovou platformou pro odesílání SMS notifikací. Konfigurace pro API odesílání SMS z cloudu může vypadat následovně (příslušné parametry budete muset upravit podle dokumentace konkrétního API):

![Uzel HTTP Požadavek_Konfigurace uzlu](https://static-docs.nocobase.com/20240515124004.png)

Když pracovní postup spustí tento uzel, zavolá SMS API s nakonfigurovaným obsahem. Pokud je požadavek úspěšný, bude prostřednictvím cloudové SMS služby odeslána SMS zpráva.