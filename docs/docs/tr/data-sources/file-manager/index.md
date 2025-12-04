---
pkg: "@nocobase/plugin-file-manager"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::



# Dosya Yöneticisi

## Giriş

Dosya Yöneticisi eklentisi, dosyaları etkili bir şekilde yönetmeniz için bir dosya koleksiyonu, ek alanı ve dosya depolama motorları sunar. Dosyalar, dosya meta verilerini depolayan ve Dosya Yöneticisi aracılığıyla yönetilebilen, özel bir koleksiyon türü olan dosya koleksiyonlarındaki kayıtlardır. Ek alanları ise dosya koleksiyonuyla ilişkili belirli ilişkilendirme alanlarıdır. Eklenti, yerel depolama, Alibaba Cloud OSS, Amazon S3 ve Tencent Cloud COS dahil olmak üzere birden fazla depolama yöntemini destekler.

## Kullanım Kılavuzu

### Dosya Koleksiyonu

Tüm ek alanlarıyla ilişkili dosyaları depolamak için yerleşik bir `attachments` koleksiyonu bulunmaktadır. Bunun yanı sıra, belirli dosyaları depolamak üzere yeni dosya koleksiyonları da oluşturabilirsiniz.

[Daha fazla bilgi için Dosya Koleksiyonu belgelerine göz atın.](/data-sources/file-manager/file-collection)

### Ek Alanı

Ek alanları, dosya koleksiyonuyla ilişkili belirli ilişkilendirme alanlarıdır. Bu alanları, "Ek" alan türü aracılığıyla oluşturabilir veya bir "İlişkilendirme" alanı olarak yapılandırabilirsiniz.

[Daha fazla bilgi için Ek Alanı belgelerine göz atın.](/data-sources/file-manager/field-attachment)

### Dosya Depolama Motoru

Dosya depolama motoru, dosyaları belirli hizmetlere kaydetmek için kullanılır. Bu hizmetler arasında yerel depolama (sunucu sabit diskine kaydetme), bulut depolama ve benzerleri bulunur.

[Daha fazla bilgi için Dosya Depolama Motoru belgelerine göz atın.](./storage/index.md)

### HTTP API

Dosya yüklemeleri HTTP API aracılığıyla gerçekleştirilebilir. Daha fazla bilgi için [HTTP API](./http-api.md) bölümüne bakabilirsiniz.

## Geliştirme

*