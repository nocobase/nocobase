:::tip Avviso di traduzione IA
Questa documentazione è stata tradotta automaticamente dall'IA.
:::

## Uso Base

Il plugin di stampa dei modelli offre diverse sintassi per inserire in modo flessibile dati dinamici e strutture logiche nei modelli. Di seguito trova le spiegazioni dettagliate della sintassi e gli esempi di utilizzo.

### Sostituzione Base

Utilizzi i segnaposto nel formato `{d.xxx}` per la sostituzione dei dati. Ad esempio:

- `{d.title}`: Legge il campo `title` dal set di dati.
- `{d.date}`: Legge il campo `date` dal set di dati.

**Esempio**:

Contenuto del modello:
```
尊敬的客户，您好！

感谢您购买我们的产品：{d.productName}。
订单编号：{d.orderId}
订单日期：{d.orderDate}

祝您使用愉快！
```

Set di dati:
```json
{
  "productName": "智能手表",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Risultato del rendering:
```
Gentile Cliente,

La ringraziamo per aver acquistato il nostro prodotto: Smart Watch.
ID Ordine: A123456789
Data Ordine: 2025-01-01

Le auguriamo una piacevole esperienza!
```

### Accesso agli Sottoggetti

Se il set di dati contiene sottoggetti, può accedere alle proprietà dei sottoggetti utilizzando la notazione a punto.

**Sintassi**: `{d.parent.child}`

**Esempio**:

Set di dati:
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

Contenuto del modello:
```
客户姓名：{d.customer.name}
邮箱地址：{d.customer.contact.email}
联系电话：{d.customer.contact.phone}
```

Risultato del rendering:
```
Nome cliente: 李雷
Indirizzo email: lilei@example.com
Numero di telefono: 13800138000
```

### Accesso agli Array

Se il set di dati contiene array, può utilizzare la parola chiave riservata `i` per accedere agli elementi nell'array.

**Sintassi**: `{d.arrayName[i].field}`

**Esempio**:

Set di dati:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Contenuto del modello:
```
第一个员工姓是 {d.staffs[i=0].lastname}，名是 {d.staffs[i=0].firstname}
```

Risultato del rendering:
```
Il cognome del primo impiegato è Anderson, e il nome è James
```