# Custom Request

## Pengantar

Saat dalam proses perlu memanggil interface eksternal atau layanan pihak ketiga, Anda dapat memicu HTTP request kustom melalui Custom request. Skenario penggunaan umum meliputi:

* Memanggil API sistem eksternal (seperti CRM, layanan AI, dll.)
* Mendapatkan data jarak jauh dan memprosesnya di langkah proses berikutnya
* Mengirim data ke sistem pihak ketiga (Webhook, notifikasi pesan, dll.)
* Memicu proses otomasi layanan internal atau eksternal

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_07_PM.png)


## Konfigurasi Action

![](https://static-docs.nocobase.com/Custom-request-03-27-2026_06_09_PM.png)

Di Pengaturan Tombol -> Custom Request, Anda dapat mengkonfigurasi konten berikut:

* HTTP method: Metode HTTP request, misalnya GET, POST, PUT, DELETE, dll.
* URL: Alamat target request, dapat diisi dengan URL interface lengkap, juga dapat digabungkan secara dinamis melalui variabel.
* Headers: Informasi header request, digunakan untuk mengirim informasi autentikasi atau konfigurasi interface, seperti Authorization, Content-Type, dll.
* Parameters: Parameter query URL (Query Parameters), biasanya digunakan untuk request GET.
* Body: Konten body request, biasanya digunakan untuk request POST, PUT, dll., dapat diisi dengan JSON, data Form, dll.
* Timeout config: Konfigurasi timeout request, digunakan untuk membatasi durasi maksimum tunggu request, menghindari proses diblokir terlalu lama.
* Response type: Tipe data response request.
* JSON: Interface mengembalikan data JSON, hasilnya akan diinjeksikan ke konteks proses, dapat diperoleh melalui ctx.steps di langkah berikutnya.
* Stream: Interface mengembalikan data stream (Stream), setelah request berhasil akan otomatis memicu download file.
* Access control: Kontrol akses, digunakan untuk membatasi peran mana yang dapat memicu langkah request ini, memastikan keamanan pemanggilan interface.

## Konfigurasi Action Lainnya

Selain pengaturan request, tombol Custom Request juga mendukung konfigurasi umum berikut:

- [Edit Tombol](/interface-builder/actions/action-settings/edit-button): konfigurasi judul tombol, style, ikon, dll.;
- [Aturan Linkage Action](/interface-builder/actions/action-settings/linkage-rule): kontrol tampilan/sembunyi tombol, nonaktif, dll. secara dinamis berdasarkan kondisi;
- [Konfirmasi Ganda](/interface-builder/actions/action-settings/double-check): setelah klik akan menampilkan dialog konfirmasi terlebih dahulu, baru benar-benar mengirim request;
