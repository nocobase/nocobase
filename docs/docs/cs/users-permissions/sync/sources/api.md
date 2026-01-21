:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


# Synchronizace uživatelských dat přes HTTP API

## Získání API klíče

Viz [API klíče](/auth-verification/api-keys). Ujistěte se, že role přiřazená k API klíči má potřebná oprávnění pro synchronizaci uživatelských dat.

## Přehled API

### Příklad

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Podrobnosti o těle požadavku viz níže
```

### Koncový bod

```bash
POST /api/userData:push
```

### Formát uživatelských dat

#### UserData

| Parametr   | Typ                                | Popis                                                                        |
| ---------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`           | Povinné. Typ dat, která se odesílají. Pro odesílání uživatelských dat použijte `user`. |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Volitelné. Slouží k vyhledávání a párování existujících uživatelů v systému na základě zadaného pole. |
| `records`  | `UserRecord[]`                     | Povinné. Pole záznamů uživatelských dat.                                     |

#### UserRecord

| Parametr      | Typ        | Popis                                                                                                       |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `uid`         | `string`   | Povinné. Jedinečný identifikátor zdrojových uživatelských dat, slouží k propojení zdrojových dat se systémovým uživatelem. Pro jednoho uživatele je neměnný. |
| `nickname`    | `string`   | Volitelné. Uživatelská přezdívka.                                                                           |
| `username`    | `string`   | Volitelné. Uživatelské jméno.                                                                               |
| `email`       | `string`   | Volitelné. E-mailová adresa uživatele.                                                                      |
| `phone`       | `string`   | Volitelné. Telefonní číslo uživatele.                                                                       |
| `departments` | `string[]` | Volitelné. Pole UID oddělení, do kterých uživatel patří.                                                    |
| `isDeleted`   | `boolean`  | Volitelné. Určuje, zda je záznam smazán.                                                                    |
| `<field>`     | `any`      | Volitelné. Data vlastních polí v tabulce uživatelů.                                                         |

### Formát dat oddělení

:::info
Předpokladem pro odesílání dat oddělení je instalace a povolení [pluginu Oddělení](../../departments).
:::

#### DepartmentData

| Parametr   | Typ                      | Popis                                                                        |
| ---------- | ------------------------ | ---------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'` | Povinné. Typ dat, která se odesílají. Pro odesílání dat oddělení použijte `department`. |
| `records`  | `DepartmentRecord[]`     | Povinné. Pole záznamů dat oddělení.                                          |

#### DepartmentRecord

| Parametr    | Typ       | Popis                                                                                                       |
| ----------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `uid`       | `string`  | Povinné. Jedinečný identifikátor zdrojových dat oddělení, slouží k propojení zdrojových dat se systémovým oddělením. Pro jedno oddělení je neměnný. |
| `title`     | `string`  | Povinné. Název oddělení.                                                                                    |
| `parentUid` | `string`  | Volitelné. UID nadřazeného oddělení.                                                                        |
| `isDeleted` | `boolean` | Volitelné. Určuje, zda je záznam smazán.                                                                    |
| `<field>`   | `any`     | Volitelné. Data vlastních polí v tabulce oddělení.                                                          |

:::info

1. Opakované odesílání dat je idempotentní operace.
2. Pokud nadřazené oddělení neexistuje v okamžiku odesílání dat oddělení, nelze provést propojení. Data můžete odeslat znovu poté, co bude nadřazené oddělení vytvořeno.
3. Pokud oddělení uživatele neexistuje v okamžiku odesílání uživatelských dat, nelze uživatele s tímto oddělením propojit. Uživatelská data můžete odeslat znovu poté, co budou odeslána data oddělení.

:::