---

pkg: '@nocobase/plugin-action-duplicate'

---

:::tip{title="Upozornění na AI překlad"}
Tento dokument byl přeložen pomocí AI. Pro přesné informace se podívejte na [anglickou verzi](/interface-builder/actions/types/duplicate).
:::

# Duplikovat

## Úvod

Akce Duplikovat umožňuje uživatelům rychle vytvářet nové záznamy na základě existujících dat. Podporuje dva režimy duplikace: **Přímá duplikace** a **Duplikovat do formuláře a pokračovat ve vyplňování**.

## Instalace

Jedná se o vestavěný plugin, není vyžadována žádná další instalace.

## Režim duplikace

![20260209224344](https://static-docs.nocobase.com/20260209224344.png)

### Přímá duplikace

![20260209224506](https://static-docs.nocobase.com/20260209224506.png)

- Ve výchozím nastavení se provádí jako „Přímá duplikace“;
- **Pole šablony**: Určete pole, která mají být duplikována. Je podporována možnost „Vybrat vše“. Toto nastavení je povinné.

![20260209225910](https://static-docs.nocobase.com/20260209225910.gif)

Po dokončení konfigurace klikněte na tlačítko pro duplikaci dat.

### Duplikovat do formuláře a pokračovat ve vyplňování

Konfigurovaná pole šablony budou do formuláře vyplněna jako **výchozí hodnoty**. Uživatelé mohou tyto hodnoty před odesláním upravit a dokončit tak duplikaci.

![20260209224704](https://static-docs.nocobase.com/20260209224704.png)

**Konfigurace polí šablony**: Jako výchozí hodnoty budou přenesena pouze vybraná pole.

![20260209225148](https://static-docs.nocobase.com/20260209225148.png)

#### Synchronizovat pole formuláře

- Automaticky analyzuje pole již nakonfigurovaná v aktuálním bloku formuláře jako pole šablony;
- Pokud budou pole bloku formuláře později upravena (např. úprava komponent relačních polí), musíte znovu otevřít konfiguraci šablony a kliknout na **Synchronizovat pole formuláře**, aby byla zajištěna konzistence.

![20260209225450](https://static-docs.nocobase.com/20260209225450.gif)

Data šablony budou vyplněna jako výchozí hodnoty formuláře a uživatel je může po úpravě odeslat k dokončení duplikace.

### Doplňující poznámky

#### Duplikace, Reference, Předběžné načtení

Různé typy polí (typy relací) mají různou logiku zpracování: **Duplikace / Reference / Předběžné načtení**. Logiku ovlivňuje také **komponenta pole** u relačního pole:

- Select / Record picker: Používá se pro **Referenci**
- Sub-form / Sub-table: Používá se pro **Duplikaci**

**Duplikace**

- Běžná pole se duplikují;
- `hasOne` / `hasMany` lze pouze duplikovat (tyto vztahy by neměly používat výběrové komponenty jako Select nebo Record picker; místo toho by měly používat komponenty Sub-form nebo Sub-table);
- Změna komponenty pro `hasOne` / `hasMany` **nezmění** logiku zpracování (zůstává Duplikace);
- U duplikovaných relačních polí lze vybrat všechna podřízená pole.

**Reference**

- `belongsTo` / `belongsToMany` se považují za Referenci;
- Pokud se komponenta pole změní z „Select“ na „Sub-form“, vztah se změní z **Reference na Duplikaci** (jakmile se stane Duplikací, všechna podřízená pole budou volitelná).

**Předběžné načtení (Preload)**

- Relační pole pod polem Reference se považují za Předběžné načtení;
- Pole Předběžného načtení se po změně komponenty mohou změnit na Referenci nebo Duplikaci.

#### Vybrat vše

- Vybere všechna **Pole pro duplikaci** a **Pole pro referenci**.

#### Následující pole budou ze záznamu vybraného jako šablona dat odfiltrována:

- Primární klíče duplikovaných relačních dat jsou filtrovány; primární klíče pro Reference a Předběžné načtení filtrovány nejsou;
- Cizí klíče;
- Pole, která nepovolují duplicity (Unikátní);
- Pole řazení;
- Pole automatického číslování (Sequence);
- Heslo;
- Vytvořil, Vytvořeno dne;
- Naposledy upravil, Upraveno dne.

#### Synchronizovat pole formuláře

- Automaticky analyzuje pole nakonfigurovaná v aktuálním bloku formuláře do polí šablony;
- Po úpravě polí bloku formuláře (např. úprava komponent relačních polí) je nutné provést synchronizaci znovu, aby byla zajištěna konzistence.