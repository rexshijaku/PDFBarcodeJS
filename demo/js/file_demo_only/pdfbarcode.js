var PDFJS = pdfjsLib;
var PDFBarcodeJs = (function () {

    var env = 'PROD';

    function init(conf) {

        var configs = extend({}, {
            scale: {
                once: true,
                value: 3,

                start: 3,
                step: 0.6,
                stop: 4.8
            },
            resultOpts: {
                singleCodeInPage: false,
                multiCodesInPage: true,
                maxCodesInPage: 1
            },
            patches: ["x-small", "small", "medium"],
            improve: true,
            noisify: true,
            quagga: {
                inputStream: {},
                locator: {
                    halfSample: false,
                },
                decoder: {
                    readers: ["code_128_reader"],
                    multiple: true
                },
                locate: true
            }
        });

        configs = merge(configs, conf);
        arrangeConfigs(configs);
        return configs;
    }

    function extend(settings, options) {
        for (var key in options)
            if (options.hasOwnProperty(key))
                settings[key] = options[key];
        return settings;
    }

    function merge(obj1, obj2) {
        for (var p in obj2) {
            try {
                if (obj2[p].constructor == Object) {
                    obj1[p] = merge(obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
                obj1[p] = obj2[p];
            }
        }
        return obj1;
    }

    function arrangeConfigs(settings) {

        if (!settings.resultOpts.multiCodesInPage || settings.resultOpts.singleCodeInPage) {
            settings.resultOpts.maxCodesInPage = 1; // then it should be single
            settings.quagga.decoder.multiple = false;
        }
        else
            settings.quagga.decoder.multiple = true; // if not single then set multi so quagga can decode multiple at one time

        if (settings.scale.once) {
            var val = parseFloat(settings.scale.value.toFixed(2));
            settings.scale.start = val;
            settings.scale.stop = val;
            settings.scale.step = 1.0;
            settings.scale.ordered = [val];
        }
        else {
            settings.scale.ordered = [];
            var i = settings.scale.start;
            for (i = settings.scale.start; i <= settings.scale.stop; i += settings.scale.step) {
                i = parseFloat(i.toFixed(2));
                settings.scale.ordered.push(i);
            }
        }
    }

    function getCanvas(viewport) {

        var canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        return canvas;
    }

    function getPageAsImg(canvas, scaled, noisify) {

        var result = {};

        var imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

        if (scaled === 1) {
            var imgToBePrinted = document.createElement('canvas');
            imgToBePrinted.width = canvas.width;
            imgToBePrinted.height = canvas.height;
            imgToBePrinted.getContext('2d').putImageData(imageData, 0, 0);
            result.printImg = imgToBePrinted;
        }

        var imgToProcess = document.createElement('canvas');
        imgToProcess.width = canvas.width;
        imgToProcess.height = canvas.height;
        var context2 = imgToProcess.getContext('2d');
        context2.putImageData(imageData, 0, 0);

        if(noisify) {
            for (var y = 0; y < canvas.height; y += 60) { //todo 60 worked good, but should be related to img sizee
                var uint = context2.getImageData(0, y, canvas.width, 1);
                var pix = uint.data;
                var draw = true;
                for (var i = 0, n = pix.length; i < n; i += 4) {
                    if (pix[i] !== 255) {
                        draw = false;
                        break;
                    }
                }

                if (draw) {
                    context2.beginPath();
                    context2.moveTo(0, y);
                    context2.lineTo(canvas.width, y);
                    context2.lineWidth = 2;
                    context2.strokeStyle = 'red';
                    context2.stroke();
                }
            }
        }
        result.processImg = imgToProcess;
        return result;
    }

    function getConfigs(pageAsImg, patchSize, settings) {

        if (env === 'DEV') {
            console.log("Configs for patch : " + patchSize);
            console.log(settings);
        }

        settings.inputStream.size = pageAsImg.width;
        settings.locator.patchSize = patchSize;
        settings.src = pageAsImg.toDataURL("image/jpeg");
        return settings;
    }

    function setResult(result, document_barcode, currentPage, patch, scaled, settings) {

        if (settings.resultOpts.singleCodeInPage) { // when single result  quagga returns obj only

            if (result && result.codeResult) {
                if (env === 'DEV')
                    console.log("PAGE_" + currentPage + " has results when scaled " + scaled + " times with " + patch + " patch.");
                addResult(result.codeResult, document_barcode, currentPage, patch, scaled);
            }
            else {
                if (env === 'DEV')
                    console.log("PAGE_" + currentPage + " when scaled " + scaled + " times with " + patch + " patch has no results.");
            }
        }
        else  // when multi result obj of quagga returns array
        {
            var hasResult = false;
            if (result) {

                for (var i = 0; i < result.length; i++) {
                    if (result[i].codeResult) {

                        if (env === 'DEV' && !hasResult) {
                            hasResult = true;
                            console.log("PAGE_" + currentPage + " when scaled " + scaled + "  times with " + patch + " patch has no results.");
                        }

                        var codeResult = result[i].codeResult;
                        var pageFormatCollector = document_barcode.codesByPageAndFormat[currentPage][codeResult.format];
                        if (pageFormatCollector !== undefined
                            && pageFormatCollector.indexOf(codeResult.code) !== -1)
                            continue;

                        if (document_barcode.codesByPage[currentPage].length === settings.resultOpts.maxCodesInPage) // page limit reached
                            break;

                        addResult(codeResult, document_barcode, currentPage, patch, scaled);
                    }
                }
            }

            if (!hasResult) {
                if (env === 'DEV')
                    console.log("PAGE_" + currentPage + " when scaled " + scaled + " times with " + patch + " patch has no results.");
            }
        }
    }

    function addResult(codeResult, resultObj, page, patch, scale) {

        if (env === 'DEV')
            console.log("Adding " + codeResult.code);

        resultObj.codes.push(codeResult.code);
        resultObj.codesDetailed.push({code: codeResult.code, format: codeResult.format, page: page, scale: scale});
        resultObj.codesByPage[page].push(codeResult.code);

        if (resultObj.codesByPageAndFormat[page][codeResult.format] === undefined) // this array helps to prevent same barcoodes in a page with same format to be collected
            resultObj.codesByPageAndFormat[page][codeResult.format] = [codeResult.code];
        else
            resultObj.codesByPageAndFormat[page][codeResult.format].push(codeResult.code);

        if (resultObj.codesByFormat[codeResult.format] === undefined) // this arr
            resultObj.codesByFormat[codeResult.format] = [codeResult.code];
        else
            resultObj.codesByFormat[codeResult.format].push(codeResult.code);

        resultObj.statsByPage[page].totalOnPatch[patch] += 1;
        resultObj.statsByPage[page].totalOnScale[scale] += 1;
        resultObj.stats.totalOnPatch[patch] += 1;
        resultObj.stats.totalOnScale[scale] += 1;
    }

    function shuffle2Optimize(arr, first, type) {

        if (env === 'DEV') {
            console.log(type + " order before smart shuffle");
            console.log(arr);
            console.log('Applying smart shuffle...');
        }

        var position = arr.indexOf(first);
        if (position === -1)
            return arr;

        var ordered = [];
        var myarrlen = arr.length;
        var left = position;
        var right = position;

        ordered.push(first);
        while (ordered.length !== myarrlen) {
            left--;
            right++;
            if (left >= 0)
                ordered.push(arr[left]);
            if (right < myarrlen)
                ordered.push(arr[right]);
        }

        if (env === 'DEV') {
            console.log(type + " order after shuffle...");
            console.log(ordered);
        }

        return ordered;
    }

    function copyobj(source, deep) {
        var o, prop, type;
        if (typeof source != 'object' || source === null) {
            o = source;
            return o;
        }
        o = new source.constructor();
        for (prop in source) {

            if (source.hasOwnProperty(prop)) {
                type = typeof source[prop];

                if (deep && type == 'object' && source[prop] !== null) {
                    o[prop] = this.copyobj(source[prop]);

                } else {
                    o[prop] = source[prop];
                }
            }
        }
        return o;
    }

    // initiates the structure of the object which will collect results
    function initResult(currentPage, settings, result) {

        result.codesByPage[currentPage] = [];
        result.codesByPageAndFormat[currentPage] = [];

        result.statsByPage[currentPage] = {totalOnPatch: [], totalOnScale: []};

        var patches_len = settings.patches.length;
        for (var i = 0; i < patches_len; i++) {
            result.statsByPage[currentPage].totalOnPatch[settings.patches[i]] = 0;
            if (!result.stats.totalOnPatch.hasOwnProperty(settings.patches[i]))
                result.stats.totalOnPatch[settings.patches[i]] = 0;
        }

        var scale_len = settings.scale.ordered.length;
        for (var j = 0; j < scale_len; j++) {
            result.statsByPage[currentPage].totalOnScale[settings.scale.ordered[j]] = 0;
            if (!result.stats.totalOnScale.hasOwnProperty(settings.scale.ordered[j]))
                result.stats.totalOnScale[settings.scale.ordered[j]] = 0;
        }
    }

    function parseResult(result, params) {

        result.success = true;
        if (params.singlePage) {
            delete result.codesByPage;
            delete result.statsByPage;
            delete result.codesByPageAndFormat;
            result.decodedPage = params.pageNr;
        }
        return result;
    }

    function pageInRange(pdf, pageNr) {
        return pageNr >= 1 && pageNr <= pdf.numPages;
    }

    function decodeDocument(input, configs, final_call_back, page_printer) {

        decoder({
            input: input,
            singlePage: false,
            configs: configs,
            final_call_back: final_call_back,
            page_printer: page_printer
        });
    }

    function decodeSinglePage(input, pageNr, configs, final_call_back, page_printer) {

        decoder({
            input: input,
            singlePage: true,
            pageNr: pageNr,
            configs: configs,
            final_call_back: final_call_back,
            page_printer: page_printer
        });
    }

    function decoder(params) {

        var finalResults = {
            codes: [],
            codesDetailed: [],
            codesByPage: [],
            codesByFormat: [],
            codesByPageAndFormat: [],
            stats: {totalOnPatch: [], totalOnScale: []},
            statsByPage: [],
            success: false
        };

        var settings = init(params.configs);
        if (env === 'DEV') {
            console.log("Initial settings...");
            console.log(settings);
        }

        var currentPage = 1;
        var quagaconfigs = copyobj(settings.quagga);

        var url = URL.createObjectURL(params.input.files[0]);
        PDFJS.disableWorker = true; // due to CORS
        PDFJS.getDocument(url).promise.then(function (pdf) {

            if (params.singlePage) {
                if (!pageInRange(pdf, params.pageNr)) {
                    params.final_call_back({
                        success: false,
                        message: "Given page is out of range! Valid page range is (1-" + pdf.numPages + ")"
                    });   // PDF loading error
                    return false;
                }
                else
                    currentPage = params.pageNr;
            }

            getPage();

            function getPage() {
                if (env === 'DEV')
                    console.log("PAGE_" + currentPage + " fetched...");
                pdf.getPage(currentPage).then(async function (page) {

                    if (env === 'DEV')
                        console.log("PAGE_" + currentPage + " rendered...");

                    initResult(currentPage, settings, finalResults);
                    var postPdfJsPageRender = function (canvas, scaled, scalingTime) {

                        return new Promise(resolve => {

                                var imginfo = getPageAsImg(canvas, scalingTime, settings.noisify);
                                var patch_attempts = 0;
                                var validPatches = getValidPatches(imginfo.processImg, settings); // due to quagga crash

                                var postQuaggaDecode = function (result) {

                                    setResult(result, finalResults, currentPage, validPatches[patch_attempts], scaled, settings);

                                    if (finalResults.codesByPage[currentPage].length < settings.resultOpts.maxCodesInPage) {
                                        patch_attempts++;
                                        if (patch_attempts < validPatches.length) {
                                            Quagga.decodeSingle(
                                                getConfigs(imginfo.processImg, validPatches[patch_attempts], quagaconfigs),
                                                postQuaggaDecode
                                            );
                                            return false;
                                        }
                                        else
                                            return resolve({
                                                isDone: false,
                                                message: "PAGE_" + currentPage + " | Max number of tries (with valid patches) to find a barcode on page was reached!"
                                            });
                                    }
                                    else
                                        return resolve({
                                            isDone: true,
                                            patch: validPatches[patch_attempts],
                                            message: "PAGE_" + currentPage + " | Count of barcodes requested was reached!"
                                        }); // send 1 to stop scaling loop
                                };

                                if (params.page_printer !== undefined && scalingTime === 1)
                                    params.page_printer(imginfo.printImg, currentPage, scaled);    //info only

                                if (validPatches.length > 0)
                                    Quagga.decodeSingle(
                                        getConfigs(imginfo.processImg, validPatches[patch_attempts], quagaconfigs),
                                        postQuaggaDecode
                                    );
                                else
                                    return resolve({isDone: false, message: "No valid patch was found!"});
                            }
                        );
                    };

                    // scale pages (as images) in given range
                    var scale_len = settings.scale.ordered.length;
                    for (var i = 0; i < scale_len; i++) {
                        const scaled = settings.scale.ordered[i];
                        const viewport = page.getViewport({scale: scaled});
                        const canvas = getCanvas(viewport);
                        const scalingTime = i + 1;

                        if (env === 'DEV')
                            console.log("PAGE_" + currentPage + " scaling " + scaled + " times.");

                        var result = await page.render({
                            canvasContext: canvas.getContext('2d'),
                            viewport: viewport
                        }).promise.then(() => postPdfJsPageRender(canvas, scaled, scalingTime));

                        if (result.isDone) {
                            if (env === 'DEV')
                                console.log("PAGE_ " + currentPage + " was finished! Stopping the loop of scale! (on scale " + scaled + ")");

                            if (settings.improve) // for the next page it will start with this patch and scale
                            {
                                settings.patches = shuffle2Optimize(settings.patches, result.patch, 'Patch');
                                settings.scale.ordered = shuffle2Optimize(settings.scale.ordered, scaled, 'Scale');
                            }
                            break;
                        }
                        else {
                            if (env === 'DEV')
                                console.log(result);
                        }
                    }

                    if (!params.singlePage && currentPage < pdf.numPages) {
                        currentPage++;
                        getPage();
                    }
                    else
                        params.final_call_back(parseResult(finalResults, params));
                });
            }
        }, function (reason) {
            params.final_call_back({success: false, message: reason.message});   // PDF loading error
        });
    }


    // this check prevents the crash created in quagga js
    // asap they fix the bug, this uncessesary calculation will be removed
    function getValidPatches(img, settings) {

        function checkPatchValidity(img, patchSize, half) {

            function _computeDivisors(n) {
                var largeDivisors = [],
                    divisors = [],
                    i;

                for (i = 1; i < Math.sqrt(n) + 1; i++) {
                    if (n % i === 0) {
                        divisors.push(i);
                        if (i !== n / i) {
                            largeDivisors.unshift(Math.floor(n / i));
                        }
                    }
                }
                return divisors.concat(largeDivisors);
            };

            function _computeIntersection(arr1, arr2) {
                var i = 0,
                    j = 0,
                    result = [];

                while (i < arr1.length && j < arr2.length) {
                    if (arr1[i] === arr2[j]) {
                        result.push(arr1[i]);
                        i++;
                        j++;
                    } else if (arr1[i] > arr2[j]) {
                        j++;
                    } else {
                        i++;
                    }
                }
                return result;
            };

            function calculatePatchSize(patchSize, imgSize) {
                var divisorsX = _computeDivisors(imgSize.x),
                    divisorsY = _computeDivisors(imgSize.y),
                    wideSide = Math.max(imgSize.x, imgSize.y),
                    common = _computeIntersection(divisorsX, divisorsY),
                    nrOfPatchesList = [8, 10, 15, 20, 32, 60, 80],
                    nrOfPatchesMap = {
                        "x-small": 5,
                        "small": 4,
                        "medium": 3,
                        "large": 2,
                        "x-large": 1
                    },
                    nrOfPatchesIdx = nrOfPatchesMap[patchSize] || nrOfPatchesMap.medium,
                    nrOfPatches = nrOfPatchesList[nrOfPatchesIdx],
                    desiredPatchSize = Math.floor(wideSide / nrOfPatches),
                    optimalPatchSize;

                function findPatchSizeForDivisors(divisors) {
                    var i = 0,
                        found = divisors[Math.floor(divisors.length / 2)];

                    while (i < divisors.length - 1 && divisors[i] < desiredPatchSize) {
                        i++;
                    }
                    if (i > 0) {
                        if (Math.abs(divisors[i] - desiredPatchSize) > Math.abs(divisors[i - 1] - desiredPatchSize)) {
                            found = divisors[i - 1];
                        } else {
                            found = divisors[i];
                        }
                    }
                    if (desiredPatchSize / found < nrOfPatchesList[nrOfPatchesIdx + 1] / nrOfPatchesList[nrOfPatchesIdx] && desiredPatchSize / found > nrOfPatchesList[nrOfPatchesIdx - 1] / nrOfPatchesList[nrOfPatchesIdx]) {
                        return {x: found, y: found};
                    }
                    return null;
                }

                optimalPatchSize = findPatchSizeForDivisors(common);
                if (!optimalPatchSize) {
                    optimalPatchSize = findPatchSizeForDivisors(_computeDivisors(wideSide));
                    if (!optimalPatchSize) {
                        optimalPatchSize = findPatchSizeForDivisors(_computeDivisors(desiredPatchSize * nrOfPatches));
                    }
                }
                return optimalPatchSize;
            };


            var size = {};
            if (half)
                size = {x: img.width / 2, y: img.height / 2};
            else
                size = {x: img.width, y: img.height};

            var calculated_patch_size = calculatePatchSize(patchSize, size);
            if (calculated_patch_size.x * calculated_patch_size.y * 3 > 65536 || ((calculated_patch_size.x * calculated_patch_size.y * 3) + calculated_patch_size.x * calculated_patch_size.y) > 65536)
                return false;
            return true;
        }

        var valid_patches = [];
        var patches_len = settings.patches.length;
        for (var i = 0; i < patches_len; i++) {
            if (checkPatchValidity(img, settings.patches[i], settings.quagga.locator.halfSample))
                valid_patches.push(settings.patches[i]);
        }
        return valid_patches;

    }

    return { // "export"
        decodeDocument: decodeDocument,
        decodeSinglePage: decodeSinglePage
    };
})();