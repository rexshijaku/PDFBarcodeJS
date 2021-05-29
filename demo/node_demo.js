const { PDFBarcodeJs } = require('pdf-barcode');
var configs = {
    "scale": {
        "once": true,
        "value": 3,
        "start": 3,
        "step": 0.6,
        "stop": 4.8
    },
    "resultOpts": {
        "singleCodeInPage": true,
        "multiCodesInPage": false,
        "maxCodesInPage": 1
    },
    "patches": [
        "x-small",
        "small",
        "medium"
    ],
    "improve": true,
    "noisify": true,
    "quagga": {
        "inputStream": {},
        "locator": {
            "halfSample": false
        },
        "decoder": {
            "readers": [
                "code_128_reader"
            ],
            "multiple": true
        },
        "locate": true
    }
};

const file_path = new URL(`file:///${__dirname + "/E2.pdf"}`).href;

var callback =  function(result) {
    if (result.success)
        console.log(result.codes)
    else
        console.log(result.message);
}

PDFBarcodeJs.decodeSinglePage(file_path,1,configs,callback);