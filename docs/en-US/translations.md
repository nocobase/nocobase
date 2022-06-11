# Translations

The default language of NocoBase is English, currently English, Simplified Chinese are supported. You can help NocoBase to translate into your language.

The NocoBase language files are located at the following locations.

```shell
packages/core/**/src/locale
packages/plugins/**/src/locale
```

Among other things, the translation of the NocoBase core is mainly located here

https://github.com/nocobase/nocobase/tree/main/packages/core/client/src/locale

Please copy en_US.ts, name it with the name of the language you want to add, and then translate the strings in it. Once the translation is done, please submit it to NocoBase via pull request and we will add it to the list of languages. Then you will see the new languages in the system configuration, where you can configure which languages you want to display for users to choose.

![enabled-languages](./images/enabled-languages.jpg)

The following table lists the Language Culture Name, Locale File Name, Display Name.

| Language Culture Name | Locale File Name | Display Name                  |
| :-------------------- | :--------------- | :---------------------------- |
| af-ZA                 | af_ZA.ts         | Afrikaans - South Africa      |
| sq-AL                 | sq_AL.ts         | Albanian - Albania            |
| ar-DZ                 | ar_DZ.ts         | Arabic - Algeria              |
| ar-BH                 | ar_BH.ts         | Arabic - Bahrain              |
| ar-EG                 | ar_EG.ts         | Arabic - Egypt                |
| ar-IQ                 | ar_IQ.ts         | Arabic - Iraq                 |
| ar-JO                 | ar_JO.ts         | Arabic - Jordan               |
| ar-KW                 | ar_KW.ts         | Arabic - Kuwait               |
| ar-LB                 | ar_LB.ts         | Arabic - Lebanon              |
| ar-LY                 | ar_LY.ts         | Arabic - Libya                |
| ar-MA                 | ar_MA.ts         | Arabic - Morocco              |
| ar-OM                 | ar_OM.ts         | Arabic - Oman                 |
| ar-QA                 | ar_QA.ts         | Arabic - Qatar                |
| ar-SA                 | ar_SA.ts         | Arabic - Saudi Arabia         |
| ar-SY                 | ar_SY.ts         | Arabic - Syria                |
| ar-TN                 | ar_TN.ts         | Arabic - Tunisia              |
| ar-AE                 | ar_AE.ts         | Arabic - United Arab Emirates |
| ar-YE                 | ar_YE.ts         | Arabic - Yemen                |
| hy-AM                 | hy_AM.ts         | Armenian - Armenia            |
| Cy-az-AZ              | Cy_az_AZ.ts      | Azeri (Cyrillic) - Azerbaijan |
| Lt-az-AZ              | Lt_az_AZ.ts      | Azeri (Latin) - Azerbaijan    |
| eu-ES                 | eu_ES.ts         | Basque - Basque               |
| be-BY                 | be_BY.ts         | Belarusian - Belarus          |
| bg-BG                 | bg_BG.ts         | Bulgarian - Bulgaria          |
| ca-ES                 | ca_ES.ts         | Catalan - Catalan             |
| zh-CN                 | zh_CN.ts         | Chinese - China               |
| zh-HK                 | zh_HK.ts         | Chinese - Hong Kong SAR       |
| zh-MO                 | zh_MO.ts         | Chinese - Macau SAR           |
| zh-SG                 | zh_SG.ts         | Chinese - Singapore           |
| zh-TW                 | zh_TW.ts         | Chinese - Taiwan              |
| zh-CHS                | zh_CHS.ts        | Chinese (Simplified)          |
| zh-CHT                | zh_CHT.ts        | Chinese (Traditional)         |
| hr-HR                 | hr_HR.ts         | Croatian - Croatia            |
| cs-CZ                 | cs_CZ.ts         | Czech - Czech Republic        |
| da-DK                 | da_DK.ts         | Danish - Denmark              |
| div-MV                | div_MV.ts        | Dhivehi - Maldives            |
| nl-BE                 | nl_BE.ts         | Dutch - Belgium               |
| nl-NL                 | nl_NL.ts         | Dutch - The Netherlands       |
| en-AU                 | en_AU.ts         | English - Australia           |
| en-BZ                 | en_BZ.ts         | English - Belize              |
| en-CA                 | en_CA.ts         | English - Canada              |
| en-CB                 | en_CB.ts         | English - Caribbean           |
| en-IE                 | en_IE.ts         | English - Ireland             |
| en-JM                 | en_JM.ts         | English - Jamaica             |
| en-NZ                 | en_NZ.ts         | English - New Zealand         |
| en-PH                 | en_PH.ts         | English - Philippines         |
| en-ZA                 | en_ZA.ts         | English - South Africa        |
| en-TT                 | en_TT.ts         | English - Trinidad and Tobago |
| en-GB                 | en_GB.ts         | English - United Kingdom      |
| en-US                 | en_US.ts         | English - United States       |
| en-ZW                 | en_ZW.ts         | English - Zimbabwe            |
| et-EE                 | et_EE.ts         | Estonian - Estonia            |
| fo-FO                 | fo_FO.ts         | Faroese - Faroe Islands       |
| fa-IR                 | fa_IR.ts         | Farsi - Iran                  |
| fi-FI                 | fi_FI.ts         | Finnish - Finland             |
| fr-BE                 | fr_BE.ts         | French - Belgium              |
| fr-CA                 | fr_CA.ts         | French - Canada               |
| fr-FR                 | fr_FR.ts         | French - France               |
| fr-LU                 | fr_LU.ts         | French - Luxembourg           |
| fr-MC                 | fr_MC.ts         | French - Monaco               |
| fr-CH                 | fr_CH.ts         | French - Switzerland          |
| gl-ES                 | gl_ES.ts         | Galician - Galician           |
| ka-GE                 | ka_GE.ts         | Georgian - Georgia            |
| de-AT                 | de_AT.ts         | German - Austria              |
| de-DE                 | de_DE.ts         | German - Germany              |
| de-LI                 | de_LI.ts         | German - Liechtenstein        |
| de-LU                 | de_LU.ts         | German - Luxembourg           |
| de-CH                 | de_CH.ts         | German - Switzerland          |
| el-GR                 | el_GR.ts         | Greek - Greece                |
| gu-IN                 | gu_IN.ts         | Gujarati - India              |
| he-IL                 | he_IL.ts         | Hebrew - Israel               |
| hi-IN                 | hi_IN.ts         | Hindi - India                 |
| hu-HU                 | hu_HU.ts         | Hungarian - Hungary           |
| is-IS                 | is_IS.ts         | Icelandic - Iceland           |
| id-ID                 | id_ID.ts         | Indonesian - Indonesia        |
| it-IT                 | it_IT.ts         | Italian - Italy               |
| it-CH                 | it_CH.ts         | Italian - Switzerland         |
| ja-JP                 | ja_JP.ts         | Japanese - Japan              |
| kn-IN                 | kn_IN.ts         | Kannada - India               |
| kk-KZ                 | kk_KZ.ts         | Kazakh - Kazakhstan           |
| kok-IN                | kok_IN.ts        | Konkani - India               |
| ko-KR                 | ko_KR.ts         | Korean - Korea                |
| ky-KZ                 | ky_KZ.ts         | Kyrgyz - Kazakhstan           |
| lv-LV                 | lv_LV.ts         | Latvian - Latvia              |
| lt-LT                 | lt_LT.ts         | Lithuanian - Lithuania        |
| mk-MK                 | mk_MK.ts         | Macedonian (FYROM)            |
| ms-BN                 | ms_BN.ts         | Malay - Brunei                |
| ms-MY                 | ms_MY.ts         | Malay - Malaysia              |
| mr-IN                 | mr_IN.ts         | Marathi - India               |
| mn-MN                 | mn_MN.ts         | Mongolian - Mongolia          |
| nb-NO                 | nb_NO.ts         | Norwegian (BokmÃ¥l) - Norway  |
| nn-NO                 | nn_NO.ts         | Norwegian (Nynorsk) - Norway  |
| pl-PL                 | pl_PL.ts         | Polish - Poland               |
| pt-BR                 | pt_BR.ts         | Portuguese - Brazil           |
| pt-PT                 | pt_PT.ts         | Portuguese - Portugal         |
| pa-IN                 | pa_IN.ts         | Punjabi - India               |
| ro-RO                 | ro_RO.ts         | Romanian - Romania            |
| ru-RU                 | ru_RU.ts         | Russian - Russia              |
| sa-IN                 | sa_IN.ts         | Sanskrit - India              |
| Cy-sr-SP              | Cy_sr_SP.ts      | Serbian (Cyrillic) - Serbia   |
| Lt-sr-SP              | Lt_sr_SP.ts      | Serbian (Latin) - Serbia      |
| sk-SK                 | sk_SK.ts         | Slovak - Slovakia             |
| sl-SI                 | sl_SI.ts         | Slovenian - Slovenia          |
| es-AR                 | es_AR.ts         | Spanish - Argentina           |
| es-BO                 | es_BO.ts         | Spanish - Bolivia             |
| es-CL                 | es_CL.ts         | Spanish - Chile               |
| es-CO                 | es_CO.ts         | Spanish - Colombia            |
| es-CR                 | es_CR.ts         | Spanish - Costa Rica          |
| es-DO                 | es_DO.ts         | Spanish - Dominican Republic  |
| es-EC                 | es_EC.ts         | Spanish - Ecuador             |
| es-SV                 | es_SV.ts         | Spanish - El Salvador         |
| es-GT                 | es_GT.ts         | Spanish - Guatemala           |
| es-HN                 | es_HN.ts         | Spanish - Honduras            |
| es-MX                 | es_MX.ts         | Spanish - Mexico              |
| es-NI                 | es_NI.ts         | Spanish - Nicaragua           |
| es-PA                 | es_PA.ts         | Spanish - Panama              |
| es-PY                 | es_PY.ts         | Spanish - Paraguay            |
| es-PE                 | es_PE.ts         | Spanish - Peru                |
| es-PR                 | es_PR.ts         | Spanish - Puerto Rico         |
| es-ES                 | es_ES.ts         | Spanish - Spain               |
| es-UY                 | es_UY.ts         | Spanish - Uruguay             |
| es-VE                 | es_VE.ts         | Spanish - Venezuela           |
| sw-KE                 | sw_KE.ts         | Swahili - Kenya               |
| sv-FI                 | sv_FI.ts         | Swedish - Finland             |
| sv-SE                 | sv_SE.ts         | Swedish - Sweden              |
| syr-SY                | syr_SY.ts        | Syriac - Syria                |
| ta-IN                 | ta_IN.ts         | Tamil - India                 |
| tt-RU                 | tt_RU.ts         | Tatar - Russia                |
| te-IN                 | te_IN.ts         | Telugu - India                |
| th-TH                 | th_TH.ts         | Thai - Thailand               |
| tr-TR                 | tr_TR.ts         | Turkish - Turkey              |
| uk-UA                 | uk_UA.ts         | Ukrainian - Ukraine           |
| ur-PK                 | ur_PK.ts         | Urdu - Pakistan               |
| Cy-uz-UZ              | Cy_uz_UZ.ts      | Uzbek (Cyrillic) - Uzbekistan |
| Lt-uz-UZ              | Lt_uz_UZ.ts      | Uzbek (Latin) - Uzbekistan    |
| vi-VN                 | vi_VN.ts         | Vietnamese - Vietnam          |