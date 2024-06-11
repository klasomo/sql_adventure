// Start the worker in which sql.js will run
var worker = new Worker("js/sqlite/worker.sql-wasm.js");
worker.onerror = error;

// Open a database
worker.postMessage({ action: "open" });

var outputElm = document.getElementById("output");
// Connect to the HTML element we 'print' to
function print(text) {

    outputElm.innerHTML = text.replace(/\n/g, "<br>");
}

function error(e) {
    console.log(e);
    var errorElm = document.getElementById("error");
    errorElm.style.height = "2em";
    errorElm.textContent = e.message;
}

function noerror() {
    var errorElm = document.getElementById("error");
    errorElm.style.height = "0";
}

var commandArray = [];

var queryOutput = "";

// Modifizierte Execute-Funktion, um Ergebnisse in das angegebene Element einzufügen
function execute(commands, outputElement) {
    worker.onmessage = function(event) {
        var results = event.data.results;
        if (!results) {
            error({ message: event.data.error });
            commandArray.pop();
            return;
        }
       
        outputElement.innerHTML = "";  // Leeren des Output-Elements

        for (var i = 0; i < results.length; i++) {
            outputElement.appendChild(tableCreate(results[i].columns, results[i].values));
        }
    };
    worker.postMessage({ action: "exec", sql: commands });
    outputElement.innerHTML = "Fetching results...";
}

// Create an HTML table
var tableCreate = (function() {
    function valconcat(vals, tagName) {
        if (vals.length === 0) return "";
        var open = "<" + tagName + ">",
            close = "</" + tagName + ">";
        return open + vals.join(close + open) + close;
    }
    return function(columns, values) {
        var tbl = document.createElement("table");
        // Hinzufügen der Klassen "table" und "table-zebra"
        tbl.classList.add("table", "table-zebra");
        var html = "<thead>" + valconcat(columns, "th") + "</thead>";
        var rows = values.map(function(v) {
            return valconcat(v, "td");
        });
        html += "<tbody>" + valconcat(rows, "tr") + "</tbody>";
        tbl.innerHTML = html;
        return tbl;
    };
})();


// Execute the commands when the button is clicked
function execEditorContents() {
    noerror();
    outputElm.innerHTML = "";
    commandArray.push(sqlInput.getValue());
    execute(sqlInput.getValue(), outputElm);
}
var execBtn = document.getElementById("execute");
execBtn.addEventListener("click", execEditorContents, true);

// Add syntax highlighting to the textarea

var maxLines = 5;

var sqlInput = CodeMirror.fromTextArea(document.getElementById("commands"), {
    theme: '3024-night',
    viewportMargin: 100,
    lineNumbers: true,
    lineWrapping: true,
    extraKeys: {
        Enter: function(cm) {
            cm.replaceSelection("\n");
        },
        "Ctrl-Enter": execEditorContents,
        "Ctrl-S": savedb,
    },
});

// Set the initial size of the CodeMirror sqlInput
sqlInput.setSize(null, sqlInput.defaultTextHeight() + 10);

// Event listener für Änderungen im sqlInput
sqlInput.on("change", checkAndUpdateHeight);

function checkAndUpdateHeight() {
    if (sqlInput.lineCount() < maxLines) {
        sqlInput.setSize(null, "auto");
    } else {
        sqlInput.setSize(null, sqlInput.defaultTextHeight() * maxLines + 10);
    }
}

// Save the db to a file
function savedb() {
    worker.onmessage = function(event) {
        var arraybuff = event.data.buffer;
        var blob = new Blob([arraybuff]);
        var a = document.createElement("a");
        document.body.appendChild(a);
        a.href = window.URL.createObjectURL(blob);
        a.download = "sql.db";
        a.onclick = function() {
            setTimeout(function() {
                window.URL.revokeObjectURL(a.href);
            }, 1500);
        };
        a.click();
    };
    worker.postMessage({ action: "export" });
}

// Open the database
function openDatabase() {
    var dbFileName = "../db/MITARBEITER_EINGESCHRAENKT.sqlite"; // Der Name deiner Datenbankdatei
    var xhr = new XMLHttpRequest();
    xhr.open("GET", dbFileName, true);
    xhr.responseType = "blob";

    xhr.onload = function(event) {
        var blob = xhr.response;
        var fileReader = new FileReader();

        fileReader.onload = function() {
            var buffer = this.result;
            worker.postMessage({ action: "open", buffer: buffer }, [buffer]);
        };

        fileReader.readAsArrayBuffer(blob);
    };
    xhr.send();
}

var btnMap = document.getElementById("btnMap");
var btnPolice = document.getElementById("btnPolice");
var btnServer = document.getElementById("btnServer");
var btnCompany = document.getElementById("btnCompany");

btnPolice.addEventListener("click", function(){
    changeBackgroundImage("./assets/images/background/buero.png");
});

btnMap.addEventListener("click", function(){
    changeBackgroundImage("./assets/images/background/pinboard2.png");
});

btnServer.addEventListener("click", function(){
    changeBackgroundImage("./assets/images/background/computer.png");
 });
 
 btnCompany.addEventListener("click", function(){
     changeBackgroundImage("./assets/images/background/computer2.png");
 });

function changeBackgroundImage(imagePath) {
    console.log(imagePath);
    document.body.style.backgroundImage = `url('${imagePath}')`;
}



// Progressbar 
function updateProgressBar(stepIndex){
    var steps = document.querySelectorAll('.steps .step');
    
    for(var i = 0; i < steps.length; i++){
        if ( i < stepIndex){
            steps[i].classList.add('step-primary', 'text-primary');
        }else{
            steps[i].classList.remove('step-primary', 'text-primary');
        }
    }
}

var btnCommandHistory = document.getElementById("commandHistory");

btnCommandHistory.addEventListener("click", function() {
    outputElm.innerHTML = "";

    // Erstellen eines Container-Divs für die Historie
    var containerDiv = document.createElement('div');
    containerDiv.classList.add('p-5');

    for (var i = 0; i < commandArray.length; i++) {
        // Erstellen des collapse-div
        var collapseDiv = document.createElement('div');
        collapseDiv.classList.add('collapse', 'bg-base-200', 'mb-2', 'collapse-arrow');

        // Erstellen des input-Elements
        var input = document.createElement('input');
        input.type = 'checkbox';

        // Erstellen des collapse-title
        var titleDiv = document.createElement('div');
        titleDiv.classList.add('collapse-title', 'text-xl', 'font-medium');
        titleDiv.textContent = commandArray[i];

        // Erstellen des collapse-content
        var contentDiv = document.createElement('div');
        contentDiv.classList.add('collapse-content');
        contentDiv.innerHTML = "<p>Ergebnisse werden geladen...</p>";  // Platzhalter-Text

        // Event-Listener zum Ausführen des SQL-Befehls beim ersten Öffnen des collapse-Elements
        input.addEventListener('change', (function(cmd, contentElement, inputElement) {
            return function() {
                if (inputElement.checked && !contentElement.dataset.loaded) {
                    execute(cmd, contentElement);
                    contentElement.dataset.loaded = true;  // Markiere als geladen
                }
            };
        })(commandArray[i], contentDiv, input));

        // Zusammenbauen der Elemente
        collapseDiv.appendChild(input);
        collapseDiv.appendChild(titleDiv);
        collapseDiv.appendChild(contentDiv);
        containerDiv.appendChild(collapseDiv);
    }

    // Hinzufügen des Container-Divs zum Output-Element
    outputElm.appendChild(containerDiv);
});


window.onload = function() {
    openDatabase();
    changeBackgroundImage("./assets/images/background/buero.png");
    updateProgressBar(3);
};


window.onbeforeunload = function() {
    //savedb();
};


// Verhindert das Zoomen mit STRG + Mausrad
document.addEventListener('wheel', function(event) {
    if (event.ctrlKey) {
        event.preventDefault();
    }
}, { passive: false });

// Verhindert das Zoomen mit Gesten auf Touchscreen-Geräten
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
}, { passive: false });

// Verhindert das Zoomen mit Tastaturkombinationen
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && (event.key === '+' || event.key === '-' || event.key === '0')) {
        event.preventDefault();
    }
});

// Setzt den Zoom-Level zurück, falls er sich ändert
const resetZoom = () => {
    document.body.style.transform = 'scale(1)';
    document.body.style.transformOrigin = '0 0';
};

//Überwacht Änderungen des Zoom-Levels
const observer = new MutationObserver(resetZoom);
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

// Überwacht Änderungen der Fenstergröße
window.addEventListener('resize', resetZoom);



window.addEventListener('beforeunload', function (e) {
    // Cancel the event
    e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
    // Chrome requires returnValue to be set
    e.returnValue = '';
  });