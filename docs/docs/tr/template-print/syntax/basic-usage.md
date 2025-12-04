:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


## Temel Kullanım

Şablon Yazdırma eklentisi, şablonlara dinamik veri ve mantıksal yapılar eklemek için çeşitli söz dizimleri sunar. Aşağıda, bu söz dizimlerinin ayrıntılı açıklamalarını ve kullanım örneklerini bulabilirsiniz.

### Temel Değiştirme

Veri değiştirmek için `{d.xxx}` formatındaki yer tutucuları kullanın. Örneğin:

- `{d.title}`: Veri setindeki `title` alanını okur.
- `{d.date}`: Veri setindeki `date` alanını okur.

**Örnek**:

Şablon İçeriği:
```
Değerli Müşterimiz,

Ürünümüzü satın aldığınız için teşekkür ederiz: {d.productName}.
Sipariş Numarası: {d.orderId}
Sipariş Tarihi: {d.orderDate}

Keyifli kullanımlar dileriz!
```

Veri Seti:
```json
{
  "productName": "智能手表",
  "orderId": "A123456789",
  "orderDate": "2025-01-01"
}
```

Oluşturulan Sonuç:
```
Değerli Müşterimiz,

Ürünümüzü satın aldığınız için teşekkür ederiz: Akıllı Saat.
Sipariş Numarası: A123456789
Sipariş Tarihi: 2025-01-01

Keyifli kullanımlar dileriz!
```

### Alt Nesnelere Erişim

Eğer veri setiniz alt nesneler içeriyorsa, bu alt nesnelerin özelliklerine nokta notasyonu kullanarak erişebilirsiniz.

**Söz Dizimi**: `{d.parent.child}`

**Örnek**:

Veri Seti:
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

Şablon İçeriği:
```
Müşteri Adı: {d.customer.name}
E-posta Adresi: {d.customer.contact.email}
Telefon Numarası: {d.customer.contact.phone}
```

Oluşturulan Sonuç:
```
Müşteri Adı: 李雷
E-posta Adresi: lilei@example.com
Telefon Numarası: 13800138000
```

### Dizilere Erişim

Eğer veri setiniz diziler içeriyorsa, dizideki elemanlara erişmek için ayrılmış `i` anahtar kelimesini kullanabilirsiniz.

**Söz Dizimi**: `{d.arrayName[i].field}`

**Örnek**:

Veri Seti:
```json
{
  "staffs": [
    { "firstname": "James", "lastname": "Anderson" },
    { "firstname": "Emily", "lastname": "Roberts" },
    { "firstname": "Michael", "lastname": "Johnson" }
  ]
}
```

Şablon İçeriği:
```
İlk çalışanın soyadı {d.staffs[i=0].lastname}, adı ise {d.staffs[i=0].firstname}
```

Oluşturulan Sonuç:
```
İlk çalışanın soyadı Anderson, adı ise James
```