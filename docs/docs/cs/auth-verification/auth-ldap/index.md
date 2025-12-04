---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Autentizace: LDAP

## Úvod

Plugin Autentizace: LDAP dodržuje standard protokolu LDAP (Lightweight Directory Access Protocol) a umožňuje uživatelům přihlásit se do NocoBase pomocí svých přihlašovacích údajů z LDAP serveru.

## Aktivace pluginu

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Přidání LDAP autentizace

Přejděte na stránku správy pluginů pro uživatelskou autentizaci.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Přidat - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Konfigurace

### Základní konfigurace

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- **Automaticky registrovat, pokud uživatel neexistuje** – Zda automaticky vytvořit nového uživatele, pokud není nalezen žádný odpovídající existující uživatel.
- **LDAP URL** – Adresa LDAP serveru
- **Bind DN** – DN používané k testování připojení serveru a vyhledávání uživatelů
- **Bind password** – Heslo pro Bind DN
- **Test připojení** – Kliknutím na tlačítko otestujete připojení serveru a ověříte platnost Bind DN.

### Konfigurace vyhledávání

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- **Search DN** – DN používané k vyhledávání uživatelů
- **Search filter** – Podmínka filtrování pro vyhledávání uživatelů, kde `{{account}}` představuje uživatelský účet použitý pro přihlášení.
- **Scope** – `Base`, `One level`, `Subtree`, výchozí `Subtree`
- **Size limit** – Limit velikosti stránky vyhledávání

### Mapování atributů

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- **Použít toto pole pro navázání uživatele** – Pole používané k navázání na existující uživatele. Pokud je přihlašovací účet uživatelské jméno, vyberte uživatelské jméno; pokud je to e-mailová adresa, vyberte e-mailovou adresu. Výchozí je uživatelské jméno.
- **Mapa atributů** – Mapování uživatelských atributů na pole v uživatelské tabulce NocoBase.

## Přihlášení

Navštivte přihlašovací stránku a zadejte uživatelské jméno a heslo LDAP do přihlašovacího formuláře.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>