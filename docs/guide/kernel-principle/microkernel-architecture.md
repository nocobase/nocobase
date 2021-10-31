---
order: 0
group:
  title: Kernel Principle
  path: /guide/kernel-principle
  order:  6
---

# Microkernel Architecture

<img src="../../images/NocoBase.png" style="max-width: 800px; width: 100%;">

NocoBase adopts microkernel architecture, and various functions are extended in the form of plug-ins, so the microkernel architecture is also called plug-in architecture, which consists of two parts: kernel and plug-ins. The kernel provides the minimum functional WEB server and various plug-in interfaces; plug-ins are various independent modules divided by functions, which are pluggable through interface adaptation. The plug-in design reduces the coupling between modules and improves the reuse rate. With the continuous expansion of the plug-in library, common scenarios only need to combine plug-ins to complete the basic construction, and this design concept is ideal for codeless platforms.
