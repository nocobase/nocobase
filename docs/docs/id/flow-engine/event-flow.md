---
title: "Event Flow FlowEngine"
description: "Event Flow FlowEngine: orkestrasi logika event-driven di Flow, eksekusi Step berurutan, mengelola perubahan property dan respons event."
keywords: "event flow,Event Flow,Step,orkestrasi Flow,perubahan property,respons event,FlowEngine,NocoBase"
---

# Event Flow

Di FlowEngine, semua Component antarmuka adalah **Event-driven**.  
Perilaku, interaksi, dan perubahan data Component, semuanya dipicu oleh event dan dieksekusi melalui Flow.

## Static Flow vs Dynamic Flow

Di FlowEngine, Flow dapat dibagi menjadi dua jenis:

### **1. Static Flow**

- Didefinisikan oleh developer dalam kode;
- Berlaku untuk **semua instance dari class Model**;
- Sering digunakan untuk menangani logika umum dari class Model tertentu;

### **2. Dynamic Flow**

- Dikonfigurasi oleh pengguna di antarmuka;
- Hanya berlaku untuk instance spesifik tertentu;
- Sering digunakan untuk perilaku personal dalam skenario tertentu;

Singkatnya: **Static Flow adalah template logika yang didefinisikan pada class, Dynamic Flow adalah logika personal yang didefinisikan pada instance.**

## Linkage Rules vs Dynamic Flow

Dalam sistem konfigurasi FlowEngine, ada dua cara untuk mengimplementasikan logika event:

### **1. Linkage Rules**

- Adalah **enkapsulasi Step event flow bawaan**;
- Konfigurasi lebih sederhana, lebih semantik;
- Pada dasarnya tetap merupakan bentuk yang disederhanakan dari **Event Flow**.

### **2. Dynamic Flow**

- Kemampuan konfigurasi Flow yang lengkap;
- Dapat dikustomisasi:
  - **Trigger (on)**: Mendefinisikan kapan dipicu;
  - **Step Eksekusi (steps)**: Mendefinisikan logika yang dieksekusi;
- Cocok untuk logika bisnis yang lebih kompleks dan fleksibel.

Oleh karena itu, **Linkage Rules ≈ Event Flow yang disederhanakan**, mekanisme inti keduanya konsisten.

## Konsistensi FlowAction

Baik **Linkage Rules** maupun **Event Flow**, harus menggunakan kumpulan **FlowAction** yang sama.  
Artinya:

- **FlowAction** mendefinisikan operasi yang dapat dipanggil oleh Flow;
- Keduanya berbagi satu sistem action, bukan diimplementasikan secara terpisah dua kali;
- Ini dapat memastikan reuse logika dan ekstensi yang konsisten.

## Hierarki Konsep

Secara konseptual, hubungan abstraksi inti FlowModel adalah sebagai berikut:

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Global Events
      │     └── Local Events
      └── FlowActionDefinition
            ├── Global Actions
            └── Local Actions
```

### Penjelasan Hierarki

- **FlowModel**  
  Merepresentasikan entitas model yang dapat dikonfigurasi dan dapat mengeksekusi logika flow.

- **FlowDefinition**  
  Mendefinisikan satu set logika flow yang lengkap (termasuk kondisi trigger dan langkah eksekusi).

- **FlowEventDefinition**  
  Mendefinisikan sumber trigger flow, termasuk:
  - **Global Events**: Seperti startup aplikasi, loading data selesai;
  - **Local Events**: Seperti perubahan field, klik tombol.

- **FlowActionDefinition**  
  Mendefinisikan action yang dapat dieksekusi flow, termasuk:
  - **Global Actions**: Seperti refresh halaman, notifikasi global;
  - **Local Actions**: Seperti memodifikasi nilai field, mengganti status Component.

## Ringkasan

| Konsep | Tujuan | Cakupan Berlaku |
|------|------|-----------|
| **Static Flow** | Logika flow yang didefinisikan dalam kode | Semua instance XXModel |
| **Dynamic Flow** | Logika flow yang didefinisikan di antarmuka | Instance FlowModel tunggal | 
| **FlowEvent** | Mendefinisikan trigger (kapan dipicu) | Global atau lokal | 
| **FlowAction** | Mendefinisikan logika eksekusi | Global atau lokal |
| **Linkage Rule** | Enkapsulasi Step event flow yang disederhanakan | Level Block, Action | 
