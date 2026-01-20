---
pkg: "@nocobase/plugin-block-reference"
---
:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::

# Referans Bloğu

## Giriş
Referans bloğu, hedef bloğun UID'sini girerek, önceden yapılandırılmış bir bloğu mevcut sayfada doğrudan gösterir. Bu sayede bloğu tekrar yapılandırmanıza gerek kalmaz.

## Eklentiyi Etkinleştirme
Bu eklenti yerleşiktir ancak varsayılan olarak devre dışıdır.
'Eklenti yöneticisi'ni açın → 'Blok: Referans'ı bulun → 'Etkinleştir'e tıklayın.

![Eklenti Yöneticisinde Referans bloğunu etkinleştirme](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Bloğu Ekleme
1) Bir blok ekleyin → 'Diğer bloklar' grubundan → 'Referans bloğu'nu seçin.  
2) 'Referans ayarları'nda şunları yapılandırın:
   - ``Blok UID`: Hedef bloğun UID'si`
   - ``Referans modu`: `Referans` veya `Kopyala` seçeneğini belirleyin`

![Referans bloğu ekleme ve yapılandırma demosu](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### Blok UID'si Nasıl Alınır?
- Hedef bloğun ayarlar menüsünü açın ve UID'sini kopyalamak için `UID'yi Kopyala` seçeneğine tıklayın.

![Blok ayarlarından UID kopyalama](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Modlar ve Davranış
- `Referans` (varsayılan)
  - Orijinal blokla aynı yapılandırmayı paylaşır; orijinalde veya herhangi bir referans noktasında yapılan düzenlemeler, tüm referansları senkronize olarak günceller.

- `Kopyala`
  - O anki orijinal blokla aynı, bağımsız bir blok oluşturur; daha sonraki değişiklikler aralarında senkronize olmaz ve birbirini etkilemez.

## Yapılandırma
- Referans bloğu:
  - "Referans ayarları": hedef blok UID'sini belirlemek ve Referans/Kopyala modunu seçmek için kullanılır;
  - Ayrıca, referans verilen bloğun tüm ayarlarını (orijinal bloğu doğrudan yapılandırmaya eşdeğerdir) görürsünüz.

![Referans bloğu ayarları](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Kopyalanan blok:
  - Kopyalandıktan sonra elde edilen blok, orijinal blokla aynı türe sahiptir ve yalnızca kendi ayarlarını içerir;
  - "Referans ayarları"nı artık içermez.

## Hata ve Yedek Durumlar
- Hedef eksik veya geçersiz olduğunda bir hata durumu gösterilir. Referans bloğunun ayarlarında (Referans ayarları → Blok UID) bloğun UID'sini yeniden belirleyebilir ve kaydederek görüntüyü geri yükleyebilirsiniz.  

![Hedef blok geçersiz olduğunda hata durumu](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Notlar ve Sınırlamalar
- Deneysel bir özelliktir — üretim ortamlarında dikkatli kullanın.
- Kopyalama yaparken, hedef UID'ye bağlı bazı yapılandırmaların yeniden yapılması gerekebilir.
- Referans verilen bir bloğun tüm yapılandırmaları, "veri kapsamı" gibi ayarlar dahil olmak üzere otomatik olarak senkronize edilir. Ancak, referans verilen bir blok kendi [olay akışı yapılandırmasına](/interface-builder/event-flow/) sahip olabilir. Bu sayede, olay akışları ve özel JavaScript eylemleri kullanarak, her referans için farklı veri kapsamları veya ilgili yapılandırmaları dolaylı yoldan elde edebilirsiniz.