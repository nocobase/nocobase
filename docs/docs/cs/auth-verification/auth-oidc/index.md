---
pkg: '@nocobase/plugin-auth-oidc'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Autentizace: OIDC

## Úvod

Plugin Autentizace: OIDC dodržuje standard protokolu OIDC (Open ConnectID) a používá režim autorizačního kódu (Authorization Code Flow), aby se uživatelé mohli přihlašovat do NocoBase pomocí účtů poskytovaných poskytovateli identit třetích stran (IdP).

## Aktivace pluginu

![](https://static-docs.nocobase.com/202411122358790.png)

## Přidání OIDC autentizace

Přejděte na stránku správy pluginů pro autentizaci uživatelů.

![](https://static-docs.nocobase.com/202411130004459.png)

Přidat - OIDC

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

## Konfigurace

### Základní konfigurace

![](https://static-docs.nocobase.com/202411130006341.png)

| Konfigurace                                        | Popis                                                                                                                                                                | Verze          |
| :------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| Sign up automatically when the user does not exist | Zda automaticky vytvořit nového uživatele, pokud není nalezen žádný odpovídající existující uživatel.                                                                     | -              |
| Issuer                                             | Issuer poskytovaný IdP, obvykle končící na `/.well-known/openid-configuration`.                                                                                           | -              |
| Client ID                                          | ID klienta                                                                                                                                                                 | -              |
| Client Secret                                      | Tajný klíč klienta                                                                                                                                                         | -              |
| scope                                              | Volitelné, výchozí je `openid email profile`.                                                                                                                              | -              |
| id_token signed response algorithm                 | Algoritmus podpisu pro `id_token`, výchozí je `RS256`.                                                                                                                     | -              |
| Enable RP-initiated logout                         | Povolí odhlášení iniciované RP. Odhlásí relaci IdP, když se uživatel odhlásí. Callback pro odhlášení IdP by měl používat Post logout redirect URL uvedené v [Použití](#použití). | `v1.3.44-beta` |

### Mapování polí

![](https://static-docs.nocobase.com/92d63c8f6f4082b50d9f475674cb5650.png)

| Konfigurace                   | Popis                                                                                                                                                      |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Field Map                       | Mapování polí. NocoBase aktuálně podporuje mapování polí jako přezdívka, e-mail a telefonní číslo. Výchozí přezdívka používá `openid`.                                   |
| Use this field to bind the user | Používá se k nalezení a propojení s existujícími uživateli. Můžete zvolit e-mail nebo uživatelské jméno, přičemž výchozí je e-mail. IdP musí poskytovat informace o uživateli obsahující pole `email` nebo `username`. |

### Pokročilá konfigurace

![](https://static-docs.nocobase.com/202411130013306.png)

| Konfigurace                                                       | Popis                                                                                                                                                                                                                                                         | Verze          |
| :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------- |
| HTTP                                                              | Zda URL zpětného volání NocoBase používá protokol HTTP, výchozí je `https`.                                                                                                                                                                                           | -              |
| Port                                                              | Port pro URL zpětného volání NocoBase, výchozí je `443/80`.                                                                                                                                                                                                           | -              |
| State token                                                       | Používá se k ověření zdroje požadavku a prevenci útoků CSRF. Můžete zadat pevnou hodnotu, ale **důrazně doporučujeme nechat pole prázdné, aby se vygenerovaly náhodné hodnoty. Pokud použijete pevnou hodnotu, pečlivě vyhodnoťte své prostředí a bezpečnostní rizika.** | -              |
| Pass parameters in the authorization code grant exchange          | Někteří IdP mohou při výměně kódu za token vyžadovat předání Client ID nebo Client Secret jako parametrů. Tuto možnost můžete zaškrtnout a zadat odpovídající názvy parametrů.                                                                                | -              |
| Method to call the user info endpoint                             | Metoda HTTP použitá při volání API pro získání informací o uživateli.                                                                                                                                                                                                             | -              |
| Where to put the access token when calling the user info endpoint | Způsob předání přístupového tokenu při volání API pro získání informací o uživateli:<br/>- Header – V hlavičce požadavku (výchozí).<br />- Body – V těle požadavku, používá se s metodou `POST`.<br />- Query parameters – Jako parametry dotazu, používá se s metodou `GET`. | -              |
| Skip SSL verification                                             | Přeskočit ověření SSL při volání API IdP. **Tato možnost vystavuje váš systém riziku útoků man-in-the-middle. Tuto možnost povolte pouze v případě, že plně rozumíte jejímu účelu a důsledkům. Důrazně se nedoporučuje používat toto nastavení v produkčním prostředí.**        | `v1.3.40-beta` |

### Použití

![](https://static-docs.nocobase.com/202411130019570.png)

| Konfigurace            | Popis                                                                                    |
| :--------------------- | :--------------------------------------------------------------------------------------------- |
| Redirect URL             | Používá se pro konfiguraci URL zpětného volání v IdP.                                                 |
| Post logout redirect URL | Používá se pro konfiguraci Post logout redirect URL v IdP, když je povoleno odhlášení iniciované RP. |

:::info
Při lokálním testování použijte pro URL `127.0.0.1` namísto `localhost`, protože přihlašování OIDC vyžaduje zápis stavu do klientského cookie pro bezpečnostní ověření. Pokud se vám při přihlašování okno jen mihne, ale přihlášení se nezdaří, zkontrolujte protokoly serveru, zda neobsahují problémy s neshodou stavu, a ujistěte se, že parametr stavu je zahrnut v cookie požadavku. Tento problém často nastává, když se stav v klientském cookie neshoduje se stavem v požadavku.
:::

## Přihlášení

Navštivte přihlašovací stránku a klikněte na tlačítko pod přihlašovacím formulářem pro zahájení přihlášení třetí stranou.

![](https://static-docs.nocobase.com/e493d156254c2ac0b6f6e1002e6a2e6b.png)