---
pkg: '@nocobase/plugin-audit-logger'
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::

# Auditní protokol

## Úvod

Auditní protokol slouží k zaznamenávání a sledování uživatelských aktivit a historie operací s prostředky v rámci systému.

![](https://static-docs.nocobase.com/202501031627719.png)

![](https://static-docs.nocobase.com/202501031627922.png)

## Popis parametrů

| Parametr              | Popis                                                                                                     |
| :-------------------- | :-------------------------------------------------------------------------------------------------------- |
| **Prostředek**        | Cílový typ prostředku operace                                                                             |
| **Akce**              | Typ provedené operace                                                                                     |
| **Uživatel**          | Uživatel provádějící operaci                                                                              |
| **Role**              | Role uživatele během operace                                                                              |
| **Zdroj dat**         | Zdroj dat                                                                                                 |
| **Cílová kolekce**    | Cílová kolekce                                                                                            |
| **Cílový záznam UK**  | Jedinečný identifikátor cílové kolekce                                                                    |
| **Zdrojová kolekce**  | Zdrojová kolekce asociačního pole                                                                         |
| **Zdrojový záznam UK**| Jedinečný identifikátor zdrojové kolekce                                                                  |
| **Stav**              | HTTP stavový kód odpovědi na požadavek operace                                                            |
| **Vytvořeno v**       | Čas operace                                                                                               |
| **UUID**              | Jedinečný identifikátor operace, shodný s ID požadavku (Request ID) operace, lze jej použít k vyhledávání aplikačních protokolů. |
| **IP**                | IP adresa uživatele                                                                                       |
| **UA**                | Informace o UA uživatele                                                                                  |
| **Metadata**          | Metadata, jako jsou parametry, tělo požadavku a obsah odpovědi operace                                    |

## Popis auditovaných prostředků

V současné době budou do auditního protokolu zaznamenávány následující operace s prostředky:

### Hlavní aplikace

| Operace          | Popis                 |
| :--------------- | :-------------------- |
| `` `app:resart` ``     | Restart aplikace      |
| `` `app:clearCache` `` | Vymazání aplikační cache |

### Správce pluginů

| Operace          | Popis             |
| :--------------- | :---------------- |
| `` `pm:add` ``     | Přidat plugin     |
| `` `pm:update` ``  | Aktualizovat plugin |
| `` `pm:enable` ``  | Povolit plugin    |
| `` `pm:disable` `` | Zakázat plugin    |
| `` `pm:remove` ``  | Odebrat plugin    |

### Ověřování uživatelů

| Operace                 | Popis          |
| :---------------------- | :------------- |
| `` `auth:signIn` ``         | Přihlášení     |
| `` `auth:signUp` ``         | Registrace     |
| `` `auth:signOut` ``        | Odhlášení      |
| `` `auth:changePassword` `` | Změna hesla    |

### Uživatel

| Operace                 | Popis            |
| :---------------------- | :--------------- |
| `` `users:updateProfile` `` | Aktualizace profilu |

### Konfigurace UI

| Operace                      | Popis                |
| :--------------------------- | :------------------- |
| `` `uiSchemas:insertAdjacent` `` | Vložení UI schématu  |
| `` `uiSchemas:patch` ``         | Úprava UI schématu   |
| `` `uiSchemas:remove` ``        | Odebrání UI schématu |

### Operace s kolekcemi

| Operace          | Popis                       |
| :--------------- | :-------------------------- |
| `` `create` ``         | Vytvoření záznamu           |
| `` `update` ``         | Aktualizace záznamu         |
| `` `destroy` ``        | Smazání záznamu             |
| `` `updateOrCreate` `` | Aktualizace nebo vytvoření záznamu |
| `` `firstOrCreate` ``  | Dotaz nebo vytvoření záznamu |
| `` `move` ``           | Přesunutí záznamu           |
| `` `set` ``            | Nastavení záznamu asociačního pole |
| `` `add` ``            | Přidání záznamu asociačního pole |
| `` `remove` ``         | Odebrání záznamu asociačního pole |
| `` `export` ``         | Export záznamu              |
| `` `import` ``         | Import záznamu              |

## Přidání dalších auditovaných prostředků

Pokud jste rozšířili operace s jinými prostředky prostřednictvím pluginů a přejete si zaznamenávat chování těchto operací do auditního protokolu, podívejte se prosím na [API](/api/server/audit-manager.md).