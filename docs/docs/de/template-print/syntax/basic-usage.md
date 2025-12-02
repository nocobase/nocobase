:::tip KI-Übersetzungshinweis
Diese Dokumentation wurde automatisch von KI übersetzt.
:::

## Grundlegende Anwendung

Das Plugin für Vorlagendruck bietet verschiedene Syntax-Möglichkeiten, um dynamische Daten und logische Strukturen flexibel in Vorlagen einzufügen. Im Folgenden finden Sie detaillierte Erläuterungen zur Syntax und Anwendungsbeispiele.

### Grundlegende Ersetzung

Verwenden Sie Platzhalter im Format `{d.xxx}`, um Daten zu ersetzen. Zum Beispiel:

- `{d.title}`: Liest das Feld `title` aus dem Datensatz.
- `{d.date}`: Liest das Feld `date` aus dem Datensatz.

**Beispiel**:

Vorlageninhalt:
```
Sehr geehrte Kundin, sehr geehrter Kunde,

vielen Dank für den Kauf unseres Produkts: {d.productName}.
Bestellnummer: {d.orderId}
Bestelldatum: {d.orderDate}

Wir wünschen Ihnen viel Freude damit!
```

Datensatz:
```json
{
  "productName": "Intelligente Uhr",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Gerendertes Ergebnis:
```
Sehr geehrte Kundin, sehr geehrter Kunde,

vielen Dank für den Kauf unseres Produkts: Intelligente Uhr.
Bestellnummer: A123456789
Bestelldatum: 2025-01-01

Wir wünschen Ihnen viel Freude damit!
```

### Zugriff auf Unterobjekte

Wenn der Datensatz Unterobjekte enthält, können Sie auf deren Eigenschaften über die Punktnotation zugreifen.

**Syntax**: `{d.parent.child}`

**Beispiel**:

Datensatz:
```json
{
  "customer": {
    "name": "Li Lei",
    "contact": {
      "email": "lilei@example.com",
      "phone": "13800138000"
    }
  }
}
```

Vorlageninhalt:
```
Kundenname: {d.customer.name}
E-Mail-Adresse: {d.customer.contact.email}
Telefonnummer: {d.customer.contact.phone}
```

Gerendertes Ergebnis:
```
Kundenname: Li Lei
E-Mail-Adresse: lilei@example.com
Telefonnummer: 13800138000
```

### Zugriff auf Arrays

Wenn der Datensatz Arrays enthält, können Sie das reservierte Schlüsselwort `i` verwenden, um auf die Elemente im Array zuzugreifen.

**Syntax**: `{d.arrayName[i].field}`

**Beispiel**:

Datensatz:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Vorlageninhalt:
```
Der Nachname des ersten Mitarbeiters ist {d.staffs[i=0].lastname} und der Vorname ist {d.staffs[i=0].firstname}
```

Gerendertes Ergebnis:
```
Der Nachname des ersten Mitarbeiters ist Anderson und der Vorname ist James
```