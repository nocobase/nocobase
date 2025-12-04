:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::

## Podstawowe użycie

Wtyczka do drukowania szablonów oferuje różnorodne składnie, które pozwalają elastycznie wstawiać dane dynamiczne i struktury logiczne do szablonów. Poniżej znajdą Państwo szczegółowe wyjaśnienia składni oraz przykłady użycia.

### Podstawianie danych

Do podstawiania danych proszę używać symboli zastępczych w formacie `{d.xxx}`. Na przykład:

- `{d.title}`: Odczytuje pole `title` z zestawu danych.
- `{d.date}`: Odczytuje pole `date` z zestawu danych.

**Przykład**:

Zawartość szablonu:
```
尊敬的客户，您好！

感谢您购买我们的产品：{d.productName}。
订单编号：{d.orderId}
订单日期：{d.orderDate}

祝您使用愉快！
```

Zestaw danych:
```json
{
  "productName": "智能手表",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Wynik renderowania:
```
Szanowny Kliencie!

Dziękujemy za zakup naszego produktu: inteligentnego zegarka.
Numer zamówienia: A123456789
Data zamówienia: 2025-01-01

Życzymy przyjemnego użytkowania!
```

### Dostęp do obiektów podrzędnych

Jeśli zestaw danych zawiera obiekty podrzędne, mogą Państwo uzyskać dostęp do ich właściwości, używając notacji kropkowej.

**Składnia**: `{d.parent.child}`

**Przykład**:

Zestaw danych:
```json
{
  "customer": {
    "name": "李雷",
    "contact": {
      "email": "lilei@example.com",
      "phone": "13800138000"
    }
  }
}
```

Zawartości szablonu:
```
客户姓名：{d.customer.name}
邮箱地址：{d.customer.contact.email}
联系电话：{d.customer.contact.phone}
```

Wynik renderowania:
```
Imię i nazwisko klienta: Li Lei
Adres e-mail: lilei@example.com
Numer telefonu: 13800138000
```

### Dostęp do tablic

Jeśli zestaw danych zawiera tablice, mogą Państwo użyć zastrzeżonego słowa kluczowego `i`, aby uzyskać dostęp do ich elementów.

**Składnia**: `{d.arrayName[i].field}`

**Przykład**:

Zestaw danych:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Zawartość szablonu:
```
第一个员工姓是 {d.staffs[i=0].lastname}，名是 {d.staffs[i=0].firstname}
```

Wynik renderowania:
```
Nazwisko pierwszego pracownika to Anderson, a imię to James.
```