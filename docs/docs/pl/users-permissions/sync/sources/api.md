:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

# Synchronizowanie danych użytkowników za pomocą API HTTP

## Uzyskiwanie klucza API

Proszę zapoznać się z dokumentacją [Klucze API](/auth-verification/api-keys). Należy upewnić się, że rola przypisana do klucza API posiada uprawnienia niezbędne do synchronizacji danych użytkowników.

## Przegląd API

### Przykład

```bash
curl 'https://localhost:13000/api/userData:push' \
  -H 'Authorization: Bearer <token>' \
  --data-raw '{"dataType":"user","records":[]}' # Szczegóły dotyczące treści żądania znajdą Państwo poniżej
```

### Endpoint

```bash
POST /api/userData:push
```

### Format danych użytkowników

#### UserData

| Parametr   | Typ                                | Opis                                                                        |
| ---------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'`           | Wymagane. Typ przesyłanych danych. Dla danych użytkowników należy użyć wartości `user`. |
| `matchKey` | `'username' \| 'email' \| 'phone'` | Opcjonalne. Służy do dopasowywania istniejących użytkowników systemu na podstawie określonego pola. |
| `records`  | `UserRecord[]`                     | Wymagane. Tablica rekordów danych użytkowników.                             |

#### UserRecord

| Parametr      | Typ        | Opis                                                                                                        |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `uid`         | `string`   | Wymagane. Unikalny identyfikator danych użytkownika źródłowego, służący do powiązania danych źródłowych z użytkownikiem systemu. Niezmienny dla danego użytkownika. |
| `nickname`    | `string`   | Opcjonalne. Pseudonim użytkownika.                                                                          |
| `username`    | `string`   | Opcjonalne. Nazwa użytkownika.                                                                              |
| `email`       | `string`   | Opcjonalne. Adres e-mail użytkownika.                                                                       |
| `phone`       | `string`   | Opcjonalne. Numer telefonu użytkownika.                                                                     |
| `departments` | `string[]` | Opcjonalne. Tablica identyfikatorów UID działów, do których należy użytkownik.                              |
| `isDeleted`   | `boolean`  | Opcjonalne. Wskazuje, czy rekord został usunięty.                                                           |
| `<field>`     | `any`      | Opcjonalne. Niestandardowe pola w tabeli użytkowników.                                                      |

### Format danych działów

:::info
Aby przesyłać dane działów, należy zainstalować i włączyć wtyczkę [Działy](../../departments).
:::

#### DepartmentData

| Parametr   | Typ                      | Opis                                                                       |
| ---------- | ------------------------ | -------------------------------------------------------------------------- |
| `dataType` | `'user' \| 'department'` | Wymagane. Typ przesyłanych danych. Dla danych działów należy użyć wartości `department`. |
| `records`  | `DepartmentRecord[]`     | Wymagane. Tablica rekordów danych działów.                                 |

#### DepartmentRecord

| Parametr    | Typ       | Opis                                                                                                        |
| ----------- | --------- | ----------------------------------------------------------------------------------------------------------- |
| `uid`       | `string`  | Wymagane. Unikalny identyfikator danych działu źródłowego, służący do powiązania danych źródłowych z działem systemu. Niezmienny dla danego działu. |
| `title`     | `string`  | Wymagane. Tytuł działu.                                                                                     |
| `parentUid` | `string`  | Opcjonalne. Identyfikator UID działu nadrzędnego.                                                           |
| `isDeleted` | `boolean` | Opcjonalne. Wskazuje, czy rekord został usunięty.                                                           |
| `<field>`   | `any`     | Opcjonalne. Niestandardowe pola w tabeli działów.                                                           |

:::info

1.  Wielokrotne przesyłanie danych jest operacją idempotentną.
2.  Jeśli dział nadrzędny nie istnieje podczas przesyłania danych działów, powiązanie nie zostanie utworzone. Mogą Państwo ponownie przesłać dane po utworzeniu działu nadrzędnego.
3.  Jeśli dział użytkownika nie istnieje podczas przesyłania danych użytkowników, użytkownik nie może zostać z nim powiązany. Mogą Państwo ponownie przesłać dane użytkowników po przesłaniu danych działów.

:::