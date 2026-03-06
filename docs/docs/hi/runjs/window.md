:::tip{title="AI अनुवाद सूचना"}
यह दस्तावेज़ AI द्वारा अनुवादित है। सटीक जानकारी के लिए कृपया [अंग्रेज़ी संस्करण](/runjs/window) देखें।
:::

# window

निम्नलिखित गुणों (properties) को सीधे `window` के माध्यम से एक्सेस किया जा सकता है:

* `setTimeout` / `clearTimeout`
* `setInterval` / `clearInterval`
* `console`
* `Math`
* `Date`
* `FormData`
* `addEventListener`
* `open` (केवल `http:`, `https:`, या `about:blank` की अनुमति है)
* `location` (केवल पढ़ने के लिए (Read-only), सुरक्षित नेविगेशन का समर्थन करता है)
* `navigator`

केवल बुनियादी और सुरक्षित DOM क्वेरी और निर्माण क्षमताएं समर्थित हैं:

* `createElement(tagName)`
* `querySelector(selectors)`
* `querySelectorAll(selectors)`