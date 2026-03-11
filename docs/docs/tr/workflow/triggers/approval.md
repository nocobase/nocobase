---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="AI Çeviri Bildirimi"}
Bu belge yapay zeka tarafından çevrilmiştir. Doğru bilgi için [İngilizce sürüme](/workflow/triggers/approval) bakın.
:::

# Onay

## Giriş

Onay, ilgili verilerin durumuna karar vermek için insan tarafından başlatılan ve insan tarafından işlenen özel bir süreç formudur. Genellikle ofis otomasyonu veya diğer manuel karar verme işlerinin süreç yönetiminde kullanılır; örneğin "izin talebi", "masraf iadesi onayı" ve "hammadde satın alma onayı" gibi senaryolar için manuel süreçler oluşturulabilir ve yönetilebilir.

Onay eklentisi, özel bir iş akışı türü (tetikleyici) olan "Onay (olay)" ve bu sürece özel "Onay" düğümü sağlar. NocoBase'in benzersiz özel koleksiyonları ve özel bloklarıyla birleştiğinde, çeşitli onay senaryoları hızlı ve esnek bir şekilde oluşturulabilir ve yönetilebilir.

## İş Akışı Oluşturma

Bir iş akışı oluştururken "Onay" türünü seçerek bir onay iş akışı oluşturabilirsiniz:

![审批触发器_创建审批流程](https://static-docs.nocobase.com/f52dda854f46a669e0c1c7fb487a17ea.png)

Ardından, iş akışı yapılandırma arayüzünde tetikleyiciye tıklayarak daha fazla yapılandırma için açılır pencereyi açın.

## Tetikleyici Yapılandırması

![20251226102619](https://static-docs.nocobase.com/20251226102619.png)

### Bir Koleksiyon Bağlama

NocoBase'in onay eklentisi esneklik üzerine tasarlanmıştır ve herhangi bir özel koleksiyon ile birlikte kullanılabilir. Yani onay yapılandırması için veri modelini tekrar yapılandırmaya gerek yoktur, doğrudan oluşturulmuş olan koleksiyonlar yeniden kullanılır. Bu nedenle, tetikleyici yapılandırmasına girdikten sonra, öncelikle bu sürecin hangi koleksiyonun verileri üzerinde onay yürüteceğini belirlemek için bir koleksiyon seçmeniz gerekir:

![审批触发器_触发器配置_选择数据表](https://static-docs.nocobase.com/20251226103223.png)

### Tetikleme Yöntemi

İş verileri için bir onay başlatırken aşağıdaki iki tetikleme yönteminden birini seçebilirsiniz:

*   **Veri kaydedilmeden önce**

    Gönderilen veriler kaydedilmeden önce onayı başlatır. Verilerin ancak onaylandıktan sonra kaydedilmesi gereken senaryolar için uygundur. Bu modda, onay başlatıldığındaki veriler yalnızca geçici verilerdir ve ancak onay geçtikten sonra ilgili koleksiyona resmi olarak kaydedilir.

*   **Veri kaydedildikten sonra**

    Gönderilen veriler kaydedildikten sonra onayı başlatır. Verilerin önce kaydedilip sonra onaylanabildiği senaryolar için uygundur. Bu modda, onay başlatıldığında veriler ilgili koleksiyona zaten kaydedilmiştir ve onay sürecindeki değişiklikler de kaydedilecektir.

### Onay Başlatma Konumu

Sistemde onayın başlatılabileceği konumu seçebilirsiniz:

*   **Yalnızca veri bloklarında başlat**

    Bu koleksiyonun herhangi bir form bloğu eylemini bu iş akışına bağlayarak onay başlatabilir ve tek bir verinin onay bloğunda onay sürecini işleyip takip edebilirsiniz. Genellikle iş verileri için uygundur.

*   **Hem veri bloklarında hem de Yapılacaklar Merkezi'nde başlatılabilir**

    Veri bloklarına ek olarak, genel Yapılacaklar Merkezi'nde de onay başlatabilir ve işleyebilirsiniz. Bu genellikle idari veriler için uygundur.

### Kimler onay başlatabilir

Hangi kullanıcıların bu onayı başlatabileceğine karar vermek için kullanıcı kapsamına dayalı izinler yapılandırabilirsiniz:

*   **Tüm kullanıcılar**

    Sistemdeki tüm kullanıcılar bu onayı başlatabilir.

*   **Yalnızca seçilen kullanıcılar**

    Yalnızca belirtilen kapsamdaki kullanıcıların bu onayı başlatmasına izin verilir, çoklu seçim yapılabilir.

    ![20251226114623](https://static-docs.nocobase.com/20251226114623.png)

### Başlatıcının Form Arayüzü Yapılandırması

Son olarak, başlatıcının form arayüzünü yapılandırmanız gerekir. Bu arayüz, onay merkezi bloğundan başlatırken ve kullanıcı geri çektikten sonra yeniden başlatırken yapılacak gönderim işlemleri için kullanılacaktır. Yapılandırma düğmesine tıklayarak açılır pencereyi açın:

![审批触发器_触发器配置_发起人表单](https://static-docs.nocobase.com/20251226130239.png)

Başlatıcının arayüzü için bağlı koleksiyona dayalı bir doldurma formu veya ipucu ve rehberlik amaçlı açıklama metni (Markdown) ekleyebilirsiniz. Formun eklenmesi zorunludur, aksi takdirde başlatıcı bu arayüze girdiğinde işlem yapamayacaktır.

Bir form bloğu ekledikten sonra, normal form yapılandırma arayüzünde olduğu gibi, ilgili koleksiyonun alan bileşenlerini ekleyebilir ve formun doldurulması gereken içeriğini düzenlemek için bunları istediğiniz gibi sıralayabilirsiniz:

![审批触发器_触发器配置_发起人表单_字段配置](https://static-docs.nocobase.com/20251226130339.png)

Doğrudan gönder düğmesinden farklı olarak, geçici depolama süreçlerini desteklemek için "Taslak Kaydet" işlem düğmesi de ekleyebilirsiniz:

![审批触发器_触发器配置_发起人表单_操作配置_保存](https://static-docs.nocobase.com/20251226130512.png)

Eğer bir onay iş akışı başlatıcının geri çekmesine izin veriyorsa, başlatıcı arayüzü yapılandırmasında "Geri Çek" düğmesini etkinleştirmeniz gerekir:

![审批触发器_触发器配置_允许撤回](https://static-docs.nocobase.com/20251226130637.png)

Etkinleştirildikten sonra, bu iş akışından başlatılan onay, herhangi bir onaylayan işlem yapmadan önce başlatıcı tarafından geri çekilebilir. Ancak sonraki herhangi bir onay düğümünde yapılandırılan bir onaylayan işlem yaptıktan sonra artık geri çekilemez.

:::info{title=İpucu}
Geri çekme düğmesini etkinleştirdikten veya sildikten sonra, tetikleyici yapılandırma açılır penceresinde kaydet ve gönder düğmesine tıklamanız gerekir ki değişiklikler etkili olsun.
:::

### "Başvurularım" Kartı <Badge>2.0+</Badge>

Yapılacaklar Merkezi'ndeki "Başvurularım" listesindeki görev kartlarını yapılandırmak için kullanılabilir.

![20260213005957](https://static-docs.nocobase.com/20260213005957.png)

Kart üzerinde gösterilmesini istediğiniz iş alanlarını (ilişki alanları hariç) veya onay ile ilgili bilgileri özgürce yapılandırabilirsiniz.

Onay başvurusu oluşturulduktan sonra, Yapılacaklar Merkezi listesinde özelleştirilmiş görev kartını görebilirsiniz:

![20260213010228](https://static-docs.nocobase.com/20260213010228.png)

### Akıştaki Kayıt Görüntüleme Modu

*   **Anlık Görüntü (Snapshot)**

    Onay sürecinde, başvuranın ve onaylayanların içeri girdiklerinde gördükleri kayıt durumu ve gönderimden sonra yalnızca kendi değiştirdikleri kaydı görmeleridir; başkalarının daha sonra yaptığı güncellemeleri görmezler.

*   **En Güncel (Latest)**

    Onay sürecinde, başvuran ve onaylayanlar tüm süreç boyunca, işlem yapmadan önceki kayıt durumu ne olursa olsun, her zaman kaydın en güncel sürümünü görürler. Süreç bittikten sonra kaydın nihai sürümünü göreceklerdir.

## Onay Düğümü

Bir onay iş akışında, onaylayanların başlatılan onayı işlemesi (onaylama, reddetme veya geri gönderme) için operasyonel mantığı yapılandırmak üzere özel "Onay" düğümünü kullanmanız gerekir. "Onay" düğümü yalnızca onay iş akışlarında kullanılabilir. Ayrıntılar için [Onay Düğümü](../nodes/approval.md) bölümüne bakın.

:::info{title=İpucu}
Eğer bir onay iş akışında hiç "Onay" düğümü yoksa, bu süreç otomatik olarak onaylanmış sayılacaktır.
:::

## Onay Başlatma Yapılandırması

Bir onay iş akışını yapılandırıp etkinleştirdikten sonra, kullanıcıların gönderim sırasında onay başlatabilmesi için bu iş akışını ilgili koleksiyonun form gönder düğmesine bağlayabilirsiniz:

![发起审批_绑定工作流](https://static-docs.nocobase.com/20251226110710.png)

Bundan sonra, kullanıcının bu formu göndermesi ilgili onay iş akışını tetikleyecektir. Gönderilen veriler ilgili koleksiyona kaydedilmesinin yanı sıra, sonraki onay personelinin incelemesi için onay akışına anlık görüntü olarak kaydedilir.

:::info{title=İpucu}
Onay başlatma düğmesi şu anda yalnızca yeni ekleme veya güncelleme formlarındaki "Gönder" (veya "Kaydet") düğmesini desteklemektedir. "İş akışını tetikle" düğmesini desteklemez (bu düğme yalnızca "Özel eylem olayları"na bağlanabilir).
:::

## Yapılacaklar Merkezi

Yapılacaklar Merkezi, kullanıcıların yapılacak görevleri görüntülemesi ve işlemesi için birleşik bir giriş noktası sağlar. Mevcut kullanıcı tarafından başlatılan onaylara ve yapılacak görevlere üst araç çubuğundaki Yapılacaklar Merkezi'nden girilebilir ve sol taraftaki kategori navigasyonu aracılığıyla farklı türdeki görevler görüntülenebilir.

![20250310161203](https://static-docs.nocobase.com/20250310161203.png)

### Başlattıklarım

#### Başlatılan Onayları Görüntüleme

![20250310161609](https://static-docs.nocobase.com/20250310161609.png)

#### Doğrudan Yeni Bir Onay Başlatma

![20250310161658](https://static-docs.nocobase.com/20250310161658.png)

### Yapılacaklarım

#### Yapılacaklar Listesi

![20250310161934](https://static-docs.nocobase.com/20250310161934.png)

#### Yapılacaklar Detayları

![20250310162111](https://static-docs.nocobase.com/20250310162111.png)

## HTTP API

### Başlatıcı

#### Koleksiyondan Başlatma

Veri bloğundan başlatırken şu şekilde çağrı yapabilirsiniz (`posts` koleksiyonu oluşturma düğmesi örneği):

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post."
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey"
```

Buradaki URL parametresi `triggerWorkflows` iş akışının key değeridir, birden fazla iş akışı virgülle ayrılır. Bu key, iş akışı tuvalinin üst kısmındaki iş akışı adının üzerine fareyle gelindiğinde elde edilebilir:

![工作流_key_查看方式](https://static-docs.nocobase.com/20240426135108.png)

Çağrı başarılı olduktan sonra, ilgili `posts` koleksiyonunun onay iş akışı tetiklenecektir.

:::info{title="İpucu"}
Harici çağrılar da kullanıcı kimliğine dayanması gerektiğinden, HTTP API üzerinden çağrı yaparken normal arayüzden gönderilen isteklerle aynı şekilde kimlik doğrulama bilgileri sağlanmalıdır. Buna `Authorization` istek başlığı veya `token` parametresi (girişten elde edilen token) ve `X-Role` istek başlığı (kullanıcının mevcut rol adı) dahildir.
:::

Eğer bu eylemdeki bire bir ilişki verileri (bire çok henüz desteklenmiyor) için bir olayı tetiklemeniz gerekiyorsa, parametrede `!` kullanarak ilişki alanının tetikleyici verisini belirtebilirsiniz:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "title": "Hello, world!",
    "content": "This is a test post.",
    "category": {
      "title": "Test category"
    }
  }'
  "http://localhost:3000/api/posts:create?triggerWorkflows=workflowKey!category"
```

Yukarıdaki çağrı başarılı olduğunda, ilgili `categories` koleksiyonunun onay olayı tetiklenecektir.

:::info{title="İpucu"}
HTTP API üzerinden eylem sonrası olayları tetiklerken, iş akışının etkin durumuna ve koleksiyon yapılandırmasının eşleşip eşleşmediğine dikkat etmelisiniz, aksi takdirde çağrı başarılı olmayabilir veya hata oluşabilir.
:::

#### Onay Merkezinden Başlatma

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "collectionName": "<collection name>",
    "workflowId": <workflow id>,
    "data": { "<field>": "<value>" },
    "status": <initial approval status>,
  }'
  "http://localhost:3000/api/approvals:create"
```

**Parametreler**

* `collectionName`: Onay başlatılacak hedef koleksiyon adı, zorunlu.
* `workflowId`: Onay başlatmak için kullanılan iş akışı ID'si, zorunlu.
* `data`: Onay başlatılırken oluşturulan koleksiyon kaydı alanları, zorunlu.
* `status`: Onay başlatılırken oluşturulan kayıt durumu, zorunlu. Seçenekler:
  * `0`: Taslak, kaydedildiğini ancak onaya sunulmadığını belirtir.
  * `2`: Onaya sun, başlatıcının onay başvurusunu gönderdiğini ve onaya girdiğini belirtir.

#### Kaydetme ve Gönderme

Başlatılan (veya geri çekilen) onay taslak durumundayken, aşağıdaki arayüz üzerinden tekrar kaydedebilir veya gönderebilirsiniz:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  '{
    "data": { "<field>": "<value>" },
    "status": 2
  }'
  "http://localhost:3000/api/approvals:update/<approval id>"
```

#### Başlatılan Onay Listesini Alma

```bash
curl -X GET -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' \
  "http://localhost:3000/api/approvals:listMine"
```

#### Geri Çekme

Başlatıcı, şu anda onayda olan kayıtları aşağıdaki arayüz üzerinden geri çekebilir:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -H 'X-Role: <roleName>' -d \
  "http://localhost:3000/api/approvals:withdraw/<approval id>"
```

**Parametreler**

* `<approval id>`: Geri çekilecek onay kaydı ID'si, zorunlu.

### Onaylayan

Onay süreci bir onay düğümüne girdikten sonra, mevcut onaylayan için bir yapılacak görev oluşturulur. Onaylayan, onay görevini arayüz üzerinden tamamlayabileceği gibi HTTP API çağrısı ile de tamamlayabilir.

#### Onay İşlem Kayıtlarını Alma

Yapılacak görevler onay işlem kayıtlarıdır, aşağıdaki arayüz üzerinden mevcut kullanıcının tüm onay işlem kayıtlarını alabilirsiniz:

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:listMine"
```

Burada `approvalRecords` bir koleksiyon kaynağı olarak `filter`, `sort`, `pageSize` ve `page` gibi genel sorgu koşullarını da kullanabilir.

#### Tek Bir Onay İşlem Kaydını Alma

```bash
curl -X GET -H 'Authorization: Bearer <your token>' \
  "http://localhost:3000/api/approvalRecords:get/<record id>"
```

#### Onaylama ve Reddetme

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "status": 2,
    "comment": "Looks good to me.",
    "data": { "<field to modify>": "<value>" }
  }'
  "http://localhost:3000/api/approvalRecords:submit/<record id>"
```

**Parametreler**

* `<record id>`: İşlem yapılacak onay kaydı ID'si, zorunlu.
* `status`: Onay işlem durumu, `2` "Onayla", `-1` "Reddet" anlamına gelir, zorunlu.
* `comment`: Onay işlemi açıklaması, isteğe bağlı.
* `data`: Onaylandıktan sonra mevcut onay düğümünün bulunduğu koleksiyon kaydında yapılan değişiklikleri belirtir, isteğe bağlı (yalnızca onaylandığında geçerlidir).

#### Geri Gönderme <Badge>v1.9.0+</Badge>

v1.9.0 sürümünden önce, geri gönderme "Onayla" ve "Reddet" ile aynı arayüzü kullanıyordu ve `"status": 1` geri göndermeyi temsil ediyordu.

v1.9.0 sürümünden itibaren geri gönderme için ayrı bir arayüz bulunmaktadır:

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "returnToNodeKey": "<node key>",
  }'
  "http://localhost:3000/api/approvalRecords:return/<record id>"
```

**Parametreler**

* `<record id>`: İşlem yapılacak onay kaydı ID'si, zorunlu.
* `returnToNodeKey`: Geri gönderilecek hedef düğüm key'i, isteğe bağlı. Düğümde geri gönderilebilecek düğüm kapsamı yapılandırıldığında, bu parametre ile hangi düğüme geri gönderileceği belirlenebilir. Yapılandırılmadığında bu parametreye değer göndermeye gerek yoktur, varsayılan olarak başlangıç noktasına geri gönderilir ve başlatıcı tarafından yeniden sunulur.

#### Devretme

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignee": <user id>,
  }'
  "http://localhost:3000/api/approvalRecords:delegate/<record id>"
```

**Parametreler**

* `<record id>`: İşlem yapılacak onay kaydı ID'si, zorunlu.
* `assignee`: Devredilecek kullanıcı ID'si, zorunlu.

#### Ek İmza (Add Signer)

```bash
curl -X POST -H 'Authorization: Bearer <your token>' -d \
  '{
    "assignees": [<user id>],
    "order": <order>,
  }'
  "http://localhost:3000/api/approvalRecords:add/<record id>"
```

**Parametreler**

* `<record id>`: İşlem yapılacak onay kaydı ID'si, zorunlu.
* `assignees`: Ek imza atacak kullanıcı ID listesi, zorunlu.
* `order`: Ek imza sırası, `-1` "ben"den önce, `1` "ben"den sonra anlamına gelir.