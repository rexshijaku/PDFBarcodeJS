# PDFBarcodeJS
PDF barcode-scanner entirely written in JavaScript.

### Features
Full-document scan <br />
Single page scan <br />
Decodes barcode types such as : EAN, CODE 128, CODE 39, EAN 8, UPC-A, UPC-C, I2of5, 2of5, CODE 93 and CODABAR <br />

### Demo

##### Online demo
Live demo is available <a href="https://rexshijaku.github.io/PDFBarcodeJS/" target="_blank">here</a>.

##### Web server
Clone or download this repository and run demo/ws_demo.html. This demo uses two files: (1) dist/pdf-barcode.js and (2) worker file (pdf.worker.min.js) which is copied to the projects output folder. You must run this file (ws_demo.html) using a web server in order to take the advantage of http:// or https:// protocols to load workers, otherwise using file:// won't load the essential worker. If you don't have any web server installed, you may take a look at the alternative demo version.

##### Alternative 
After you clone this repository, on your local machine run demo/file_demo.html. This example uses minified versions of dependent libraries and its files. This offers you a version which can be tested with zero configurations compared to the previous one.

### Get Started
##### Install by manual download: 
Download files in dist folder and load pdf-barcode.js file as follows :
```html
 <script type="text/javascript" src="pdf-barcode.js"> </script>
```
**Important** : Make sure that the **pdf.worker.min.js** file is copied to your project's output folder. 
Note that if you don't want to take care of pdf.worker.min.js separately as it was explained, follow the alternative install by manual download.

##### Alternative install by manual download: 
Download minified files located in demo/js/file_demo_only and include them just in your assets directory which is targeted by your scripts as it was described in file_demo.html.

##### Node
You can also install it from npm by running the following command:
```html
npm install pdf-barcode
```
include it as:
```js
import PDFBarcodeJs from 'pdf-barcode';  // ES6

const PDFBarcodeJs = require('pdf-barcode').default; // Common JS
```

##### Webpack and other building tools
If you use Webpack or other bundling tools, you will have to make sure on your own that pdf.worker.min.js file from pdfjs-dist/build is copied to your project's output folder.

Alternatively, you can use pdf.worker.min.js from an external CDN:
##
```javascript
 import { PDFJS } from 'pdf-barcode';
 PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.min.js`;
```
### Usage

#### Set up the optimal configuration
The efficiency and the accuracy of pdfBarcodeJS totally depends on the given configuration. By default it uses a configuration which worked best during development and testing. You should modify and optimize this configuration to fit to your barcode formats and sizes. Use any of provided demos above to construct configuration parameters or write them manually. There are four steps you need to untertake to decode a pdf: 

##### JavaScript code:
### 
```js
 var configs = {  // create and populate configs variable
                   scale: {
                       once: true,
                       value: 3
                   },
                   resultOpts: {
                       singleCodeInPage: true
                   },
                   patches: ["x-small", "small", "medium"],
                   quagga: {
                       decoder: {
                           readers: ["code_128_reader"]
                       }
                   }
               };
```
```js
 // select the input file
 var input_file = document.getElementById('pdfentryfile');

 // create callback which handles the result 
 var callback =  function(result) {
    if(result.success)
        console.log(result.codes)
    else 
        console.log(result.message);
 }
```

##### Full-Document decode: 
##
```js
 //decode document (all pages)
 PDFBarcodeJs.decodeDocument(input_file, configs, callback);
```

##### Single page decode: 
##
```js
 // or decode a single page
 var pageNr = 1; 
 PDFBarcodeJs.decodeSinglePage(input_file, pageNr, configs, callback);
```

##### Html code: 
##
```html
 <input id="pdfentryfile" type="file" accept="application/pdf">
```
### How does it works?
PDFBarcodeJS combines and extends the functionality of <a href="https://github.com/mozilla/pdf.js/">pdf.js</a> and <a href="https://github.com/serratus/quaggaJS">quaggaJS</a> to introduce a tool which is able scan barcodes which are placed on PDFs. It fetches and reads pages via <a href="https://github.com/mozilla/pdf.js/">pdf.js</a> methods subsequently adds few processing steps and lastly passes them to <a href="https://github.com/serratus/quaggaJS">quaggaJS</a> which decodes the codes which are present in pages. 
This library supports all barcode formats which are supported by <a href="https://github.com/serratus/quaggaJS">quaggaJS</a>. Depending on the number of barcodes you want to decode, the formats to read and extract, and the barcode sizes you have in your PDFs, you should find the optimal configuration for your PDF decoder which can be done using one of the demo version offered in this repo. After you find the neccessary configuration, just copy it and you are ready to paste it in your code and to start decode barcodes in PDFs.

#### Config arguments

##### scale
This parameter specifies how much a page should be enlarged (scaled) before it reaches decoding step. If it is given as *once* then it scales pages one time by the given value, otherwise if you specify start, step and stop parameters, page will be scaled iteratively until requested barcodes are found maximum number of steps is reached. If you have different barcode sizes throughout the pages you should use a range, if your barcodes have a fixed size you should enable *once* scale. Note thet this is an important parameter for decoding performance, less taken steps will offer a higher performance.

##### resultOpts
Depending on how many barcodes you need to extract from a page, you should specify this parameter. If you need just one barcode per page then turn singleCodeInPage on, otherwise turn multiCodesInPage and specify how many barcodes per page you need in maxCodesInPage parameter.  

##### patches
Based on the barcode size you have, you must provide the best patch. pdfBarcodeJS tries to find barcodes by given patches. If you have different barcode sizes you may provide more than one patch. This also affects the performance of decoder, so try to find the ideal patches for you barcodes.

##### improve
pdfBarcodeJS improves itself continously with an intention to minimize resources in following pages. When it finds a barcode in a page, it will use that configuration on the next page firstly.

##### noisify
If your pages have no text or anything written on them, turn this property on.

#### quagga
##### multiple
pdfBarcodeJS will turn the multiple property of decoder in quagga configs to true if multiCodesInPage is enabled, otherwise it will turn it off.
##### readers
In order to decode specific barcode formats populate *readers* property of *decoder* with following values: 

ode_128_reader (default) <br />
ean_reader <br />
ean_8_reader <br />
code_39_reader <br />
code_39_vin_reader <br />
codabar_reader <br />
upc_reader <br />
upc_e_reader <br />
i2of5_reader <br />
2of5_reader <br />
code_93_reader <br />

In order to get a more insightful knowledge on how quagga configs work, please check its repository <a href="https://github.com/serratus/quaggaJS">here</a>.

#### result object
The most important property of result object is *codes* property which stores all codes found in a document or requested page. Alongside this field are grouped *codes by pages*, *codes by barcode formats* and *statistics*. In development, these stats should be analyzed in order to conclude which parameters should be to excluded, included or adjusted more accurately, in order to reach a satisfying performance and accuracy.
##
```js
 {
   "codes": [
     "code_1",
     "code_2"
   ],
   "codesDetailed": [
     {
       "code": "code_1",
       "format": "code_128",
       "page": 1,
       "scale": 3
     },
     {
       "code": "code_2",
       "format": "code_39",
       "page": 2,
       "scale": 3
     }
   ],
   "codesByPage": [
     1: [
       "code_1"
     ],
     2: [
       "code_2"
     ]
   ],
   "codesByFormat": [
     "code_128": [
       "code_1"
     ],
     "code_93": [
       "code_2"
     ]
   ],
   "codesByPageAndFormat": [
     1: {
       "code_128": [
         "code_1"
       ]
     },
     2: {
       "code_93": [
         "code_2"
       ]
     }
   ],
   "stats": {
     "toalOnPatch": [
       "x-small": 1,
       "small": 0,
       "medium": 1
     ],
     "totalOnScale": [
       3: 2
     ]
   },
   "statsByPage": [
     1: {
       "toalOnPatch": [
         "x-small": 1
       ],
       "totalOnScale": [
         3: 1
       ]
     },
     2: {
       "toalOnPatch": [
         "medium": 1
       ],
       "totalOnScale": [
         3: 1
       ]
     }
   ],
   "success": true
 }
```

### Support
For general questions about PDFBarcodeJS, tweet at @rexshijaku or write me an email on rexhepshijaku@gmail.com.
To have a quick tutorial check the examples folder provided in the repository.

### Author
##### Rexhep Shijaku
 - Email : rexhepshijaku@gmail.com
 - Twitter : https://twitter.com/rexshijaku
 
### Thank you
Mozilla as the author of <a href="https://github.com/mozilla/pdf.js/">pdf.js</a>, Christoph Oberhofer <a href="mailto:it-ch.oberhofer@gmail.com">ch.oberhofer@gmail.com</a> for initiating <a href="https://github.com/serratus/quaggaJS">quaggaJS</a> and Eric Blade <a href="mailto:it-blade.eric@gmail.com">blade.eric@gmail.com</a> with other contributors who are continuously improving it. 

### License
MIT License

Copyright (c) 2020 | Rexhep Shijaku

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
