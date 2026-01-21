:::tip
Bu belge AI tarafından çevrilmiştir. Herhangi bir yanlışlık için lütfen [İngilizce sürümüne](/en) bakın
:::


# FlowEngine Nedir?

FlowEngine, NocoBase 2.0'ın yepyeni bir ön uç (front-end) kodsuz ve düşük kodlu geliştirme motorudur. Model'leri ve Flow'ları bir araya getirerek ön uç mantığını basitleştirir, yeniden kullanılabilirliği ve sürdürülebilirliği artırır. Aynı zamanda, Flow'un yapılandırılabilir doğasından yararlanarak, ön uç bileşenlerine ve iş mantığına kodsuz yapılandırma ve düzenleme yetenekleri kazandırır.

## Neden FlowEngine olarak adlandırılıyor?

Çünkü FlowEngine'de bileşenlerin özellikleri ve mantığı artık statik olarak tanımlanmaz; bunun yerine bir **Flow** tarafından yönlendirilir ve yönetilir.

*   **Flow**, bir veri akışı gibi, mantığı sıralı adımlara (Step) ayırır ve bunları bileşene sırayla uygular;
*   **Engine**, ön uç mantığını ve etkileşimlerini yönlendiren bir motor olduğunu ifade eder.

Bu nedenle, **FlowEngine = Flow'lar tarafından yönlendirilen bir ön uç mantık motoru**'dur.

## Model Nedir?

FlowEngine'de Model, bir bileşenin soyut modelidir ve şunlardan sorumludur:

*   Bileşenin **özelliklerini (Props) ve durumunu** yönetmek;
*   Bileşenin **render etme (oluşturma) yöntemini** tanımlamak;
*   **Flow**'u barındırmak ve yürütmek;
*   **Olay dağıtımını** ve **yaşam döngülerini** tek tip şekilde ele almak.

Başka bir deyişle, **Model bileşenin mantıksal beynidir**; bileşeni statik bir öğeden yapılandırılabilir ve düzenlenebilir dinamik bir birime dönüştürür.

## Flow Nedir?

FlowEngine'de, **Flow, Model'e hizmet eden bir mantık akışıdır**.
Amacı şunlardır:

*   Özellik veya olay mantığını adımlara (Step) ayırmak ve bunları bir akış şeklinde sırayla yürütmek;
*   Özellik değişikliklerini ve olay yanıtlarını yönetebilir;
*   Mantığı **dinamik, yapılandırılabilir ve yeniden kullanılabilir** hale getirmek.

## Bu kavramları nasıl anlayabiliriz?

**Flow**'u bir **su akışı** olarak düşünebilirsiniz:

*   **Step, su akışının geçtiği bir düğüm gibidir**
    Her Step küçük bir görevi yerine getirir (örneğin, bir özelliği ayarlamak, bir olayı tetiklemek, bir API çağırmak), tıpkı suyun bir kapıdan veya su çarkından geçerken bir etki yaratması gibi.

*   **Akış sıralıdır**
    Su, önceden belirlenmiş bir yolda yukarıdan aşağıya doğru akar ve tüm Step'lerden sırayla geçer; benzer şekilde, bir Flow'daki mantık da tanımlanan sıraya göre yürütülür.

*   **Akış dallanabilir ve birleştirilebilir**
    Bir su akışı birden fazla küçük akışa ayrılabilir veya birleşebilir; bir Flow da birden fazla alt akışa bölünebilir veya daha karmaşık mantıksal zincirler halinde birleştirilebilir.

*   **Akış yapılandırılabilir ve kontrol edilebilir**
    Bir su akışının yönü ve hacmi bir savak (su kapağı) ile ayarlanabilir; bir Flow'un yürütme yöntemi ve parametreleri de yapılandırma (stepParams) aracılığıyla kontrol edilebilir.

### Benzetme Özeti

*   Bir **bileşen**, dönmek için bir su akışına ihtiyaç duyan bir su çarkı gibidir;
*   **Model**, bu su çarkının tabanı ve kontrolörüdür; suyu almak ve çalışmasını sağlamaktan sorumludur;
*   **Flow**, her Step'ten sırayla geçen, bileşenin sürekli değişmesini ve yanıt vermesini sağlayan su akışıdır.

Dolayısıyla FlowEngine'de:

*   **Flow, mantığın bir su akışı gibi doğal bir şekilde hareket etmesini sağlar**;
*   **Model ise bileşeni bu akışın taşıyıcısı ve yürütücüsü yapar**.