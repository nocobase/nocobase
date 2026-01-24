:::tip
Dit document is vertaald door AI. Voor onnauwkeurigheden, raadpleeg [de Engelse versie](/en)
:::

## Basisgebruik

De Template Printing plugin biedt verschillende syntaxes om flexibel dynamische gegevens en logische structuren in sjablonen in te voegen. Hieronder vindt u gedetailleerde uitleg van de syntaxis en gebruiksvoorbeelden.

### Basisvervanging

Gebruik placeholders in het formaat `{d.xxx}` voor gegevensvervanging. Bijvoorbeeld:

- `{d.title}`: Leest het `title`-veld uit de dataset.
- `{d.date}`: Leest het `date`-veld uit de dataset.

**Voorbeeld**:

Sjablooninhoud:
```
Geachte klant,

Bedankt voor uw aankoop van ons product: {d.productName}.
Bestelnummer: {d.orderId}
Besteldatum: {d.orderDate}

Wij wensen u veel plezier met uw aankoop!
```

Dataset:
```json
{
  "productName": "Smart Watch",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Gegenereerd resultaat:
```
Geachte klant,

Bedankt voor uw aankoop van ons product: Smart Watch.
Bestelnummer: A123456789
Besteldatum: 2025-01-01

Wij wensen u veel plezier met uw aankoop!
```

### Toegang tot subobjecten

Als de dataset subobjecten bevat, kunt u de eigenschappen van deze subobjecten benaderen met behulp van de puntnotatie.

**Syntaxis**: `{d.parent.child}`

**Voorbeeld**:

Dataset:
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

Sjablooninhoud:
```
Naam klant: {d.customer.name}
E-mailadres: {d.customer.contact.email}
Telefoonnummer: {d.customer.contact.phone}
```

Gegenereerd resultaat:
```
Naam klant: Alex Smith
E-mailadres: alex.smith@example.com
Telefoonnummer: +1-555-012-3456
```

### Toegang tot arrays

Als de dataset arrays bevat, kunt u het gereserveerde sleutelwoord `i` gebruiken om elementen in de array te benaderen.

**Syntaxis**: `{d.arrayName[i].field}`

**Voorbeeld**:

Dataset:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Sjablooninhoud:
```
De achternaam van de eerste medewerker is {d.staffs[i=0].lastname}, en de voornaam is {d.staffs[i=0].firstname}
```

Gegenereerd resultaat:
```
De achternaam van de eerste medewerker is Anderson, en de voornaam is James
```