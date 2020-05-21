var decodeType = 'allpages';
var configs = {
    scale: {
        once: true,
        value: 3,

        start: 3,
        step: 0.6,
        stop: 4.8
    },
    resultOpts: {
        singleCodeInPage: true,
        multiCodesInPage: false,
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
};

function onceHandler(once) {

    var rangeHolder = document.getElementById('range-holder');
    var staticHolder = document.getElementById('static-holder');
    if (once) {
        rangeHolder.style.display = 'none';
        staticHolder.style.display = 'inline';
    }
    else {
        rangeHolder.style.display = 'inline';
        staticHolder.style.display = 'none';
    }
    configs.scale.once = once;
    writeConfigs();
}

function singleMultiHandler(isMulti) {
    var maxPerPage = document.getElementById('maxPerPage');
    var multi = parseInt(isMulti) === 1;
    if (multi) {
        maxPerPage.value = 1;
        maxPerPage.disabled = false;

    }
    else {
        maxPerPage.value = 1;
        maxPerPage.disabled = true;
    }

    configs.resultOpts.multiCodesInPage = multi;
    configs.resultOpts.singleCodeInPage = !multi;
    configs.resultOpts.maxCodesInPage = 1;
    writeConfigs();
}

function handleHalfSample(half) {
    configs.quagga.locator.halfSample = half;
    writeConfigs();
}

function handleLocate(locate) {
    configs.quagga.locate = locate;
    writeConfigs();
}

function handleValueChange(value) {
    configs.scale.value = parseFloat(value);
    writeConfigs();
}

function handleStartChange(value) {
    configs.scale.start = parseFloat(value);
    writeConfigs();
}

function handleStepChange(value) {
    configs.scale.step = parseFloat(value);
    writeConfigs();
}

function handleStopChange(value) {
    configs.scale.stop = parseFloat(value);
    writeConfigs();
}

function handleMaxCodesChange(value) {
    configs.resultOpts.maxCodesInPage = parseFloat(value);
    writeConfigs();
}

function handleNoisifyChange(value) {
    configs.noisify = value;
    writeConfigs();
}

function handleSmartChange(value) {
    configs.improve = value;
    writeConfigs();
}


window.onload = function (e) {

    writeConfigs();

    var elems = document.getElementsByName("barcode_types[]");
    for (var i = 0; i < elems.length; i++) {
        elems[i].addEventListener("change", function () {

            var reader = this.value + '_reader';
            var array_ref = configs.quagga.decoder.readers;
            var index = array_ref.indexOf(reader);
            if (this.checked) {
                if (index === -1)
                    array_ref.push(reader);
            }
            else {
                if (index !== -1)
                    array_ref.splice(index, 1);
            }
            writeConfigs();

        }, false);
    }


    var patches = document.getElementsByName("patches[]");
    for (var i = 0; i < patches.length; i++) {
        patches[i].addEventListener("change", function () {

            var patch = this.value;
            var array_ref = configs.patches;
            var index = array_ref.indexOf(patch);
            if (this.checked) {
                if (index === -1)
                    array_ref.push(patch);
            }
            else {
                if (index !== -1)
                    array_ref.splice(index, 1);
            }
            writeConfigs();

        }, false);
    }

    var copyTextinputBtn = document.querySelector('.js-textinputcopybtn');
    copyTextinputBtn.addEventListener('click', function(event) {

        var copyTextinput = document.getElementById('configs');
        copyTextinput.innerHTML = JSON.stringify(configs, undefined, 4);
        copyTextinput.select();

        try {
            var successful = document.execCommand('copy');
            var msg = successful ? 'successful' : 'unsuccessful';
            console.log('Copying text input command was ' + msg);
        } catch (err) {
            console.log('Oops, unable to copy');
        }
    });
};

function writeConfigs() {
    var copyTextinput = document.getElementById('configs');
    copyTextinput.innerHTML = JSON.stringify(configs, undefined, 4);

    var confstr = JSON.stringify(configs);
    console.log(confstr);
}

function addrow(text) {
    var tableRef = document.getElementById('summary').getElementsByTagName('tbody')[0];
    var newRow   = tableRef.insertRow();
    var newCell  = newRow.insertCell(0);
    var newText  = document.createTextNode(text);
    newCell.appendChild(newText);
}

function handleDecodeType(val) {

    console.log(val);
    var pageNrInput = document.getElementById('pageNr');
    if(parseInt(val) === 1)
    {
        pageNrInput.style.display = 'none';
        decodeType = 'allpages';
    }
    else
    {
        pageNrInput.style.display = '';
        decodeType = 'singlepage';
    }
}