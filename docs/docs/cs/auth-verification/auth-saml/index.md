---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Ověřování: SAML 2.0

## Úvod

Plugin Ověřování: SAML 2.0 dodržuje standard protokolu SAML 2.0 (Security Assertion Markup Language 2.0) a umožňuje uživatelům přihlásit se do NocoBase pomocí účtů poskytovaných poskytovateli služeb ověřování identity třetích stran (IdP).

## Aktivace pluginu

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## Přidání SAML ověřování

Přejděte na stránku správy pluginů pro ověřování uživatelů.

![](https://static-docs.nocobase.com/202411130004459.png)

Přidat - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Konfigurace

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- SSO URL – Poskytuje IdP, používá se pro jednotné přihlášení (Single Sign-On).
- Veřejný certifikát – Poskytuje IdP.
- ID entity (IdP Issuer) – Volitelné, poskytuje IdP.
- http – Pokud vaše aplikace NocoBase používá protokol HTTP, zaškrtněte toto políčko.
- Použít toto pole pro propojení uživatele – Pole použité pro spárování a propojení se stávajícími uživateli. Můžete zvolit e-mail nebo uživatelské jméno, výchozí je e-mail. Uživatelské informace přenášené IdP musí obsahovat pole `email` nebo `username`.
- Automaticky registrovat, pokud uživatel neexistuje – Zda se má automaticky vytvořit nový uživatel, pokud se nenajde žádný odpovídající existující uživatel.
- Použití – `SP Issuer / EntityID` a `ACS URL` se používají ke zkopírování a vyplnění do odpovídající konfigurace v IdP.

## Mapování polí

Mapování polí je třeba nakonfigurovat na konfigurační platformě IdP. Můžete se podívat na [příklad](./examples/google.md).

Pole dostupná pro mapování v NocoBase jsou:

- email (povinné)
- telefon (platí pouze pro IdP, které podporují `phone` ve svém rozsahu)
- přezdívka
- uživatelské jméno
- křestní jméno
- příjmení

`nameID` je přenášeno protokolem SAML a není třeba ho mapovat; bude uloženo jako unikátní identifikátor uživatele.
Priorita pravidel pro přezdívku nového uživatele je: `nickname` > `firstName lastName` > `username` > `nameID`
Mapování uživatelských organizací a rolí v současné době není podporováno.

## Přihlášení

Navštivte přihlašovací stránku a klikněte na tlačítko pod přihlašovacím formulářem pro zahájení přihlášení třetí stranou.

![](https://static-docs.nocobase.com/7496365c9d36a294948e6adeb5b24bc.png)