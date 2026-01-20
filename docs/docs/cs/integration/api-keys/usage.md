:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Používání API klíčů v NocoBase

Tento průvodce vám na praktickém příkladu "Úkolů" ukáže, jak v NocoBase používat API klíče k získávání dat. Pro pochopení celého pracovního postupu se řiďte níže uvedenými podrobnými pokyny.

![202503032004-todo1](https://static-docs.nocobase.com/202503032004-todo1.gif)

## 1 Co jsou API klíče

API klíč je bezpečný token, který ověřuje API požadavky od autorizovaných uživatelů. Funguje jako pověření, které ověřuje identitu žadatele při přístupu k systému NocoBase prostřednictvím webových aplikací, mobilních aplikací nebo backendových skriptů.

V hlavičce HTTP požadavku uvidíte formát jako:

```txt
Authorization: Bearer {API klíč}
```

Předpona "Bearer" naznačuje, že následující řetězec je ověřený API klíč, který se používá k ověření oprávnění žadatele.

### Běžné případy použití

API klíče se obvykle používají v následujících scénářích:

1.  **Přístup klientských aplikací**: Webové prohlížeče a mobilní aplikace používají API klíče k ověření identity uživatele, čímž zajišťují, že k datům mají přístup pouze autorizovaní uživatelé.
2.  **Provádění automatizovaných úloh**: Procesy na pozadí a plánované úlohy používají API klíče k bezpečnému provádění aktualizací, synchronizace dat a operací protokolování.
3.  **Vývoj a testování**: Vývojáři používají API klíče během ladění a testování k simulaci ověřených požadavků a ověření API odpovědí.

API klíče poskytují řadu bezpečnostních výhod: ověřování identity, monitorování využití, omezení rychlosti požadavků a prevenci hrozeb, čímž zajišťují stabilní a bezpečný provoz NocoBase.

## 2 Vytvoření API klíčů v NocoBase

### 2.1 Aktivujte plugin Ověřování: API klíče

Ujistěte se, že je aktivován vestavěný [plugin Ověřování: API klíče](/plugins/@nocobase/plugin-api-keys/). Po jeho povolení se v nastavení systému objeví nová konfigurační stránka pro API klíče.

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

### 2.2 Vytvořte testovací kolekci

Pro demonstrační účely vytvořte kolekci s názvem `todos` s následujícími poli:

-   `id`
-   `title`
-   `completed`

![20250303175632](https://static-docs.nocobase.com/20250303175632.png)

Přidejte do kolekce několik ukázkových záznamů:

-   jíst jídlo
-   spát
-   hrát hry

![20250303180044](https://static-docs.nocobase.com/20250303180044.png)

### 2.3 Vytvořte a přiřaďte roli

API klíče jsou vázány na uživatelské role a systém určuje oprávnění k požadavkům na základě přiřazené role. Před vytvořením API klíče musíte vytvořit roli a nakonfigurovat příslušná oprávnění. Vytvořte roli s názvem "Role API pro úkoly" a udělte jí plný přístup ke kolekci `todos`.

![20250303180247](https://static-docs.nocobase.com/20250303180247.png)

Pokud "Role API pro úkoly" není k dispozici při vytváření API klíče, ujistěte se, že aktuálnímu uživateli byla tato role přiřazena:

![20250303180638](https://static-docs.nocobase.com/20250303180638.png)

Po přiřazení role obnovte stránku a přejděte na stránku správy API klíčů. Klikněte na "Přidat API klíč" a ověřte, že se "Role API pro úkoly" zobrazuje ve výběru rolí.

![20250303180612](https://static-docs.nocobase.com/20250303180612.png)
![20250303180936](https://static-docs.nocobase.com/20250303180936.png)

Pro lepší kontrolu přístupu zvažte vytvoření vyhrazeného uživatelského účtu (např. "Uživatel API pro úkoly") speciálně pro správu a testování API klíčů. Přiřaďte tomuto uživateli "Roli API pro úkoly".
![20250304134443](https://static-docs.nocobase.com/20250304134443.png)
![20250304134713](https://static-docs.nocobase.com/20250304134713.png)
![20250304134734](https://static-docs.nocobase.com/20250304134734.png)

### 2.4 Vygenerujte a uložte API klíč

Po odeslání formuláře systém zobrazí potvrzovací zprávu s nově vygenerovaným API klíčem. **Důležité**: Okamžitě si tento klíč zkopírujte a bezpečně uložte, protože z bezpečnostních důvodů se již znovu nezobrazí.

![20250303181130](https://static-docs.nocobase.com/20250303181130.png)

Příklad API klíče:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

### 2.5 Důležité poznámky

-   Platnost API klíče je určena nastavením expirace nakonfigurovaným při jeho vytvoření.
-   Generování a ověřování API klíče závisí na proměnné prostředí `APP_KEY`. **Tuto proměnnou neměňte**, protože by to zneplatnilo všechny stávající API klíče v systému.

## 3 Testování ověřování pomocí API klíče

### 3.1 Používání pluginu API dokumentace

Otevřete [plugin API dokumentace](/plugins/@nocobase/plugin-api-doc/) a prohlédněte si metody požadavků, URL, parametry a hlavičky pro každý API endpoint.

![20250303181522](https://static-docs.nocobase.com/20250303181522.png)
![20250303181704](https://static-docs.nocobase.com/20250303181704.png)

### 3.2 Pochopení základních CRUD operací

NocoBase poskytuje standardní CRUD (Create, Read, Update, Delete) API pro manipulaci s daty:

-   **Dotaz na seznam (list API):**

    ```txt
    GET {baseURL}/{collectionName}:list
    Hlavička požadavku:
    - Authorization: Bearer <API klíč>

    ```
-   **Vytvoření záznamu (create API):**

    ```txt
    POST {baseURL}/{collectionName}:create

    Hlavička požadavku:
    - Authorization: Bearer <API klíč>

    Tělo požadavku (ve formátu JSON), například:
        {
            "title": "123"
        }
    ```
-   **Aktualizace záznamu (update API):**

    ```txt
    POST {baseURL}/{collectionName}:update?filterByTk={id}
    Hlavička požadavku:
    - Authorization: Bearer <API klíč>

    Tělo požadavku (ve formátu JSON), například:
        {
            "title": "123",
            "completed": true
        }
    ```
-   **Smazání záznamu (delete API):**

    ```txt
    POST {baseURL}/{collectionName}:destroy?filterByTk={id}
    Hlavička požadavku:
    - Authorization: Bearer <API klíč>
    ```

Kde:
-   `{baseURL}`: URL vašeho systému NocoBase
-   `{collectionName}`: Název kolekce

Příklad: Pro lokální instanci na `localhost:13000` s kolekcí s názvem `todos`:

```txt
http://localhost:13000/api/todos:list
```

### 3.3 Testování s Postmanem

Vytvořte GET požadavek v Postmanu s následující konfigurací:
-   **URL**: Endpoint požadavku (např. `http://localhost:13000/api/todos:list`)
-   **Headers**: Přidejte hlavičku `Authorization` s hodnotou:

```txt
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M
```

![20250303182744](https://static-docs.nocobase.com/20250303182744.png)

**Úspěšná odpověď:**

```json
{
    "data": [
        {
            "createdAt": "2025-03-03T09:57:36.728Z",
            "updatedAt": "2025-03-03T09:57:36.728Z",
            "completed": null,
            "createdById": 1,
            "id": 1,
            "title": "eat food",
            "updatedById": 1
        }
    ],
    "meta": {
        "count": 1,
        "page": 1,
        "pageSize": 20,
        "totalPage": 1
    }
}
```

**Chybová odpověď (neplatný/expirovaný API klíč):**

```json
{
    "errors": [
        {
            "message": "Your session has expired. Please sign in again.",
            "code": "INVALID_TOKEN"
        }
    ]
}
```

**Řešení problémů**: Pokud ověření selže, ověřte oprávnění role, vazbu API klíče a formát tokenu.

### 3.4 Export kódu požadavku

Postman umožňuje exportovat požadavek v různých formátech. Příklad cURL příkazu:

```txt
curl --location 'http://localhost:13000/api/todos:list' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M'
```

![20250303184912](https://static-docs.nocobase.com/20250303184912.png)
![20250303184953](https://static-docs.nocobase.com/20250303184953.png)

## 4 Používání API klíčů v JS bloku

NocoBase 2.0 podporuje psaní nativního JavaScript kódu přímo na stránkách pomocí JS bloků. Tento příklad ukazuje, jak získat externí API data pomocí API klíčů.

### Vytvoření JS bloku

Na vaší stránce NocoBase přidejte JS blok a použijte následující kód pro získání dat úkolů:

```javascript
// Získání dat úkolů pomocí API klíče
async function fetchTodos() {
  try {
    // Zobrazit zprávu o načítání
    ctx.message.loading('正在获取数据...');

    // Načíst knihovnu axios pro HTTP požadavky
    const axios = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js');

    if (!axios) {
      ctx.message.error('加载 HTTP 库失败');
      return;
    }

    // API klíč (nahraďte svým skutečným API klíčem)
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGVOYW1lIjoidG9kb3MiLCJpYXQiOjE3NDA5OTY1ODAsImV4cCI6MzMyOTg1OTY1ODB9.tXF2FCAzFNgZFPXqSBbWAfEvWkQwz0-mtKnmOTZT-5M';

    // Odeslat API požadavek
    const response = await axios.get('http://localhost:13000/api/todos:list', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    // Zobrazit výsledky
    console.log('待办事项列表:', response.data);
    ctx.message.success(`成功获取 ${response.data.data.length} 条数据`);

    // Zde můžete data zpracovat
    // Například: zobrazit v tabulce, aktualizovat pole formuláře atd.

  } catch (error) {
    console.error('获取数据出错:', error);
    ctx.message.error('获取数据失败: ' + error.message);
  }
}

// Spustit funkci
fetchTodos();
```

### Klíčové body

-   **ctx.requireAsync()**: Dynamicky načítá externí knihovny (jako axios) pro HTTP požadavky
-   **ctx.message**: Zobrazuje uživatelská oznámení (načítání, úspěch, chybové zprávy)
-   **Ověřování API klíčem**: Přeneste API klíč v hlavičce požadavku `Authorization` s předponou `Bearer`
-   **Zpracování odpovědi**: Zpracujte vrácená data podle potřeby (zobrazení, transformace atd.)

## 5 Shrnutí

Tento průvodce pokryl kompletní pracovní postup pro používání API klíčů v NocoBase:

1.  **Nastavení**: Aktivace pluginu API klíčů a vytvoření testovací kolekce
2.  **Konfigurace**: Vytvoření rolí s příslušnými oprávněními a vygenerování API klíčů
3.  **Testování**: Ověření autentizace API klíčů pomocí Postmanu a pluginu API dokumentace
4.  **Integrace**: Používání API klíčů v JS blocích

![202503031942-todo](https://static-docs.nocobase.com/202503031942-todo.gif)

**Další zdroje:**
-   [Dokumentace pluginu API klíčů](/plugins/@nocobase/plugin-api-keys/)
-   [Plugin API dokumentace](/plugins/@nocobase/plugin-api-doc/)