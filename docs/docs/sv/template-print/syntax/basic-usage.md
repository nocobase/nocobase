:::tip
Detta dokument har översatts av AI. För eventuella felaktigheter, se [den engelska versionen](/en)
:::

## Grundläggande användning

Mallutskrifts-pluginen erbjuder flera syntaxer för att flexibelt infoga dynamisk data och logiska strukturer i mallar. Nedan följer detaljerade syntaxförklaringar och användningsexempel.

### Grundläggande ersättning

Använd platshållare i formatet `{d.xxx}` för dataersättning. Till exempel:

- `{d.title}`: Läser fältet `title` från datamängden.
- `{d.date}`: Läser fältet `date` från datamängden.

**Exempel**:

Mallinnehåll:
```
Bästa kund,

Tack för att ni köpte vår produkt: {d.productName}.
Ordernummer: {d.orderId}
Orderdatum: {d.orderDate}

Vi hoppas att ni blir nöjd med produkten!
```

Datamängd:
```json
{
  "productName": "Smartklocka",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Renderat resultat:
```
Bästa kund,

Tack för att ni köpte vår produkt: Smartklocka.
Ordernummer: A123456789
Orderdatum: 2025-01-01

Vi hoppas att ni blir nöjd med produkten!
```

### Åtkomst till underobjekt

Om datamängden innehåller underobjekt kan ni komma åt egenskaperna för underobjekten med punktnotation.

**Syntax**: `{d.parent.child}`

**Exempel**:

Datamängd:
```json
{
  "customer": {
    "name": "Alex Smith",
    "contact": {
      "email": "alex.smith@example.com",
      "phone": "+1-555-012-3456"
    }
  }
}
```

Mallinnehåll:
```
Kundnamn: {d.customer.name}
E-postadress: {d.customer.contact.email}
Telefonnummer: {d.customer.contact.phone}
```

Renderat resultat:
```
Kundnamn: Alex Smith
E-postadress: alex.smith@example.com
Telefonnummer: +1-555-012-3456
```

### Åtkomst till arrayer

Om datamängden innehåller arrayer kan ni använda det reserverade nyckelordet `i` för att komma åt element i arrayen.

**Syntax**: `{d.arrayName[i].field}`

**Exempel**:

Datamängd:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Mallinnehåll:
```
Den första anställdas efternamn är {d.staffs[i=0].lastname}, och förnamnet är {d.staffs[i=0].firstname}
```

Renderat resultat:
```
Den första anställdas efternamn är Anderson, och förnamnet är James
```