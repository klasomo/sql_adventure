// Start the worker in which sql.js will run
var worker = new Worker("js/sqlite/worker.sql-wasm.js");
worker.onerror = error;

// Open a database
worker.postMessage({ action: "open" });

// Connect to the HTML element we 'print' to
function print(text) {
    var outputElm = document.getElementById("output");
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

// Run a command in the database
function execute(commands) {
    tic();
    worker.onmessage = function(event) {
        var results = event.data.results;
        toc("Executing SQL");
        if (!results) {
            error({ message: event.data.error });
            return;
        }

        tic();
        var outputElm = document.getElementById("output");
        outputElm.innerHTML = "";
        for (var i = 0; i < results.length; i++) {
            outputElm.appendChild(tableCreate(results[i].columns, results[i].values));
        }
        toc("Displaying results");
    };
    worker.postMessage({ action: "exec", sql: commands });
    var outputElm = document.getElementById("output");
    outputElm.textContent = "Fetching results...";
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
    execute(sqlInput.getValue() + ";");
}
var execBtn = document.getElementById("execute");
execBtn.addEventListener("click", execEditorContents, true);

// Performance measurement functions
var tictime;
if (!window.performance || !performance.now) {
    window.performance = { now: Date.now };
}

function tic() {
    tictime = performance.now();
}

function toc(msg) {
    var dt = performance.now() - tictime;
    console.log((msg || "toc") + ": " + dt + "ms");
}

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

// Load a db from a file
var dbFileBtn = document.getElementById("dbfile");
dbFileBtn.onchange = function() {
    var f = dbFileBtn.files[0];
    var r = new FileReader();
    r.onload = function() {
        worker.onmessage = function() {
            toc("Loading database from file");
            // Show the schema of the loaded database
            sqlInput.setValue(
                "SELECT `name`, `sql`\n  FROM `sqlite_master`\n  WHERE type='table';"
            );
            execEditorContents();
        };
        tic();
        try {
            worker.postMessage({ action: "open", buffer: r.result }, [r.result]);
        } catch (exception) {
            worker.postMessage({ action: "open", buffer: r.result });
        }
    };
    r.readAsArrayBuffer(f);
};

// Save the db to a file
function savedb() {
    worker.onmessage = function(event) {
        toc("Exporting the database");
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
    tic();
    worker.postMessage({ action: "export" });
}
var savedbBtn = document.getElementById("savedb");
savedbBtn.addEventListener("click", savedb, true);

// Open the database
function openDatabase() {
    var dbFileName = "db/example.sqlite"; // Der Name deiner Datenbankdatei
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

function openSelectedDatabase() {
    var selectedDb = selectDbDropdown.value;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", selectedDb, true);
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

var openDbBtn = document.getElementById("opendb");
openDbBtn.addEventListener("click", openSelectedDatabase);

const rectangle = document.getElementById("rectangle");

var clipboardDisplayed = false;

rectangle.addEventListener("click", () => {
    if (!clipboardDisplayed) {
        rectangle.style.left = "50%";
        rectangle.style.transform = "translateX(-50%)";
        clipboardDisplayed = true;
    } else {
        rectangle.style.left = "50%";
        rectangle.style.transform = "none";
        clipboardDisplayed = false;
    }
});