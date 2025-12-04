:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::


## Základní použití

Plugin pro tisk šablon nabízí různé syntaxe pro flexibilní vkládání dynamických dat a logických struktur do šablon. Níže naleznete podrobné vysvětlení syntaxe a příklady použití.

### Základní nahrazení

Pro nahrazení dat použijte zástupné symboly ve formátu `{d.xxx}`. Například:

- `{d.title}`: Načítá pole `title` z datové sady.
- `{d.date}`: Načítá pole `date` z datové sady.

**Příklad**:

Obsah šablony:
```
Vážený zákazníku,

Děkujeme Vám za zakoupení našeho produktu: {d.productName}.
Číslo objednávky: {d.orderId}
Datum objednávky: {d.orderDate}

Přejeme Vám příjemné používání!
```

Datová sada:
```json
{
  "productName": "智能手表",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Výsledek renderování:
```
Vážený zákazníku,

Děkujeme Vám za zakoupení našeho produktu: Chytré hodinky.
Číslo objednávky: A123456789
Datum objednávky: 2025-01-01

Přejeme Vám příjemné používání!
```

### Přístup k podobjektům

Pokud datová sada obsahuje podobjekty, můžete přistupovat k jejich vlastnostem pomocí tečkové notace.

**Syntaxe**: `{d.parent.child}`

**Příklad**:

Datová sada:
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

Obsah šablony:
```
Jméno zákazníka: {d.customer.name}
E-mailová adresa: {d.customer.contact.email}
Kontaktní telefon: {d.customer.contact.phone}
```

Výsledek renderování:
```
Jméno zákazníka: Li Lei
E-mailová adresa: lilei@example.com
Kontaktní telefon: 13800138000
```

### Přístup k polím

Pokud datová sada obsahuje pole, můžete použít rezervované klíčové slovo `i` pro přístup k prvkům v poli.

**Syntaxe**: `{d.arrayName[i].field}`

**Příklad**:

Datová sada:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Obsah šablony:
```
Příjmení prvního zaměstnance je {d.staffs[i=0].lastname} a jméno je {d.staffs[i=0].firstname}
```

Výsledek renderování:
```
Příjmení prvního zaměstnance je Anderson a jméno je James
```