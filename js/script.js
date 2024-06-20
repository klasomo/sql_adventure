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
    var errorAlert = document.getElementById("errorAlert");
    var errorMessage = document.getElementById("errorMessage");
    if (errorAlert && errorMessage) {
        errorMessage.textContent = e.message || "An error occurred"; // Setze den Text der Fehlermeldung
        errorAlert.classList.remove("hidden"); // Entferne die 'hidden'-Klasse, um das Element sichtbar zu machen
    }
}

function noerror() {
    var errorAlert = document.getElementById("errorAlert");
    if (errorAlert) {
        errorAlert.classList.add("hidden"); // Füge die 'hidden'-Klasse wieder hinzu, um das Element auszublenden
    }
}

var commandArray = [];
var commandHistories = {}; // Objekt zur Speicherung der Befehls-Historien für jede Datenbank

var queryOutput = "";

// Modified execute function to run commands on the selected database
function execute(commands, outputElement, callback) {
    if (!currentDatabase || !databases[currentDatabase]) {
      console.error("No database selected or database not opened.");
      outputElement.innerHTML = "Error: No database selected or database not opened.";
      if (callback) callback(false);
      return;
    }
  
    var worker = databases[currentDatabase]; // Zugriff auf den Worker der aktuellen Datenbank
  
    worker.onmessage = function (event) {
      var results = event.data.results;
      if (!results) {
        error({ message: event.data.error });
        if (callback) callback(false);
        return;
      }
  
      outputElement.innerHTML = ""; // Leeren des Output-Elements
  
      for (var i = 0; i < results.length; i++) {
        outputElement.appendChild(
          tableCreate(results[i].columns, results[i].values)
        );
      }
      if (callback) callback(true);
    };
    worker.postMessage({ action: "exec", sql: commands });
  }

// Create an HTML table
var tableCreate = (function () {
  function valconcat(vals, tagName) {
    if (vals.length === 0) return "";
    var open = "<" + tagName + ">",
      close = "</" + tagName + ">";
    return open + vals.join(close + open) + close;
  }
  return function (columns, values) {
    var tbl = document.createElement("table");
    // Hinzufügen der Klassen "table" und "table-zebra"
    tbl.classList.add("table", "table-zebra");
    var html = "<thead>" + valconcat(columns, "th") + "</thead>";
    var rows = values.map(function (v) {
      return valconcat(v, "td");
    });
    html += "<tbody>" + valconcat(rows, "tr") + "</tbody>";
    tbl.innerHTML = html;
    return tbl;
  };
})();

// Execute the commands when the button is clicked
function execEditorContents() {
    outputElm.innerHTML = "";
    execute(sqlInput.getValue(), outputElm, function(success) {
      if (success) {
        if (!commandHistories[currentDatabase]) {
          commandHistories[currentDatabase] = []; // Initialisieren des Arrays, falls es noch nicht existiert
        }
        commandHistories[currentDatabase].push(sqlInput.getValue()); // Speichern des Befehls in der Historie der aktuellen Datenbank
        noerror();
      }
    });
  }
var execBtn = document.getElementById("execute");
execBtn.addEventListener("click", execEditorContents, true);

// Add syntax highlighting to the textarea

var maxLines = 5;

var sqlInput = CodeMirror.fromTextArea(document.getElementById("commands"), {
  theme: "3024-night",
  viewportMargin: 100,
  lineNumbers: true,
  lineWrapping: true,
  extraKeys: {
    Enter: function (cm) {
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
  worker.onmessage = function (event) {
    var arraybuff = event.data.buffer;
    var blob = new Blob([arraybuff]);
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.href = window.URL.createObjectURL(blob);
    a.download = "sql.db";
    a.onclick = function () {
      setTimeout(function () {
        window.URL.revokeObjectURL(a.href);
      }, 1500);
    };
    a.click();
  };
  worker.postMessage({ action: "export" });
}

// Open the database
var databases = {}; // Objekt zur Speicherung der geöffneten Datenbanken
var currentDatabase = null; // Variable zur Speicherung der aktuellen Datenbank

function openDatabase(dbPath, dbName) {
    if (databases[dbName]) {
      console.log(`Database ${dbName} already opened.`);
      return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("GET", dbPath, true);
    xhr.responseType = "blob";

    xhr.onload = function (event) {
      var blob = xhr.response;
      var fileReader = new FileReader();

      fileReader.onload = function () {
        var buffer = this.result;
        var worker = new Worker("js/sqlite/worker.sql-wasm.js");
        worker.postMessage({ action: "open", buffer: buffer }, [buffer]);
        databases[dbName] = worker; // Speichern des Workers in dem Objekt
        if (!currentDatabase) {
          currentDatabase = dbName; // Setze die erste geöffnete DB als aktuelle DB
        }
        console.log(`Database ${dbName} opened.`);
        console.log(databases);
      };

      fileReader.readAsArrayBuffer(blob);
    };
    xhr.send();
  }

var btnMap = document.getElementById("btnMap");
var btnPolice = document.getElementById("btnPolice");
var btnServer = document.getElementById("btnServer");
var btnBomb = document.getElementById("btnBomb");

//index 0 = Police 1=Server 2=Map 3=Bomb
const sqlInputCache = ["", "", "", ""];
var currentViewIndex = 0;

function saveAndLoadSqlCommand(viewIndex) {
  sqlInputCache[currentViewIndex] = sqlInput.getValue();
  outputElm.innerHTML = "";
  noerror();
  currentViewIndex = viewIndex;
  sqlInput.setValue(sqlInputCache[currentViewIndex]);
}

function openDatabaseFromDbName(dbName){
    var dbPath = "";
    switch(dbName){
        case "police":
            dbPath = "./db/police.sqlite"
            break;
        case "server":
             dbPath = "./db/firma.sqlite"
            break;
        case "map":
             dbPath = "./db/veranstaltung.sqlite"
            break;
        case "bomb":
             dbPath = "./db/bombe.sqlite"
            break;
    }
    openDatabase(dbPath, dbName);
}


// Function to handle button clicks and open databases
function handleButtonClick(viewIndex, dbName, backgroundImage) {
    hideLoginDiv(true);
    hideSqlDiv(false);
    saveAndLoadSqlCommand(viewIndex);
    changeBackgroundImage(backgroundImage);
    openDatabaseFromDbName(dbName);
    currentDatabase = dbName; // Set the current database when button is clicked
    console.log(`Current database set to ${dbName}`);
  }

  function loadPoliceView(){
    handleButtonClick(0, "police", "./assets/images/background/pinboard.png");
  }



  function loadServerView(){
    //if(isPcUnlocked){
    if(true){
      handleButtonClick(1, "server", "./assets/images/background/computer.png");

    }
    else{
      handleButtonClick(1, "server", "./assets/images/background/computer_login.png");
      hideLoginDiv(false);
      hideSqlDiv(true);
    }
  }

  function loadMapView(){
    handleButtonClick(2, "map", "./assets/images/background/map.png");
  }

  function loadBombView(){
    handleButtonClick(3, "bomb","./assets/images/background/bomb.png");
  }
  
  // Example of opening databases
  btnPolice.addEventListener("click", function () {
    loadPoliceView();
  });
  
  btnServer.addEventListener("click", function () {
    loadServerView();
  });
    
  btnMap.addEventListener("click", function () {
    loadMapView();
  });
  
  btnBomb.addEventListener("click", function () {
    loadBombView();
  });

function changeBackgroundImage(imagePath) {
  document.body.style.backgroundImage = `url('${imagePath}')`;
}

var btnCommandHistory = document.getElementById("commandHistory");

btnCommandHistory.addEventListener("click", function () {
    outputElm.innerHTML = "";
  
    // Erstellen eines Container-Divs für die Historie
    var containerDiv = document.createElement("div");
    containerDiv.classList.add("p-5");
  
    // Überprüfen, ob es eine Historie für die aktuelle Datenbank gibt
    if (!commandHistories[currentDatabase]) {
      commandHistories[currentDatabase] = []; // Initialisieren des Arrays, falls es noch nicht existiert
    }
  
    // Iteriere über die Befehlshistorie der aktuellen Datenbank
    for (var i = 0; i < commandHistories[currentDatabase].length; i++) {
      // Erstellen des collapse-div
      var collapseDiv = document.createElement("div");
      collapseDiv.classList.add(
        "collapse",
        "bg-base-200",
        "mb-2",
        "collapse-arrow"
      );
  
      // Erstellen des input-Elements
      var input = document.createElement("input");
      input.type = "checkbox";
  
      // Erstellen des collapse-title
      var titleDiv = document.createElement("div");
      titleDiv.classList.add("collapse-title", "text-xl", "font-medium");
      titleDiv.textContent = commandHistories[currentDatabase][i];
  
      // Erstellen des collapse-content
      var contentDiv = document.createElement("div");
      contentDiv.classList.add("collapse-content");
      contentDiv.innerHTML = "<p>Ergebnisse werden geladen...</p>"; // Platzhalter-Text
  
      // Event-Listener zum Ausführen des SQL-Befehls beim ersten Öffnen des collapse-Elements
      input.addEventListener(
        "change",
        (function (cmd, contentElement, inputElement) {
          return function () {
            if (inputElement.checked && !contentElement.dataset.loaded) {
              execute(cmd, contentElement);
              contentElement.dataset.loaded = true; // Markiere als geladen
            }
          };
        })(commandHistories[currentDatabase][i], contentDiv, input)
      );
  
      // Zusammenbauen der Elemente
      collapseDiv.appendChild(input);
      collapseDiv.appendChild(titleDiv);
      collapseDiv.appendChild(contentDiv);
      containerDiv.appendChild(collapseDiv);
    }
  
    // Hinzufügen des Container-Divs zum Output-Element
    outputElm.appendChild(containerDiv);
  });

window.onload = function () {
    loadPoliceView();
};

window.onbeforeunload = function () {
  //savedb();
};

// Verhindert das Zoomen mit STRG + Mausrad
document.addEventListener(
  "wheel",
  function (event) {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  },
  { passive: false }
);

// Verhindert das Zoomen mit Gesten auf Touchscreen-Geräten
document.addEventListener(
  "touchstart",
  function (event) {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  },
  { passive: false }
);

// Verhindert das Zoomen mit Tastaturkombinationen
document.addEventListener("keydown", function (event) {
  if (
    event.ctrlKey &&
    (event.key === "+" || event.key === "-" || event.key === "0")
  ) {
    event.preventDefault();
  }
});

// Setzt den Zoom-Level zurück, falls er sich ändert
const resetZoom = () => {
  document.body.style.transform = "scale(1)";
  document.body.style.transformOrigin = "0 0";
};

//Überwacht Änderungen des Zoom-Levels
const observer = new MutationObserver(resetZoom);
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["style"],
});

// Überwacht Änderungen der Fenstergröße
window.addEventListener("resize", resetZoom);

//FÜR ENTWICKLUNG AUSKOMMENTIERT

// window.addEventListener('beforeunload', function (e) {
//     // Cancel the event
//     e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
//     // Chrome requires returnValue to be set
//     e.returnValue = '';
//   });



document.getElementById('resetBtn').addEventListener('click', function() {
    if (confirm('Möchten Sie die Datenbank wirklich neu laden? Alle Änderungen gehen verloren.')) {
      removeFromDatabases(currentDatabase);
      openDatabaseFromDbName(currentDatabase);
    }
  });

  function removeFromDatabases(dbName) {
    if (databases[dbName]) {
      delete databases[dbName];
      console.log(`Database ${dbName} removed from databases.`);
    } else {
      console.log(`Database ${dbName} not found in databases.`);
    }
  }


let isPcUnlocked = false;
let pcPassword = "qtr-Ch3n-wy";
let pcUsername = "max.brandt";


function hideSqlDiv(isVisible) {
  const sqlDiv = document.getElementById('sqlDiv');
  if (isVisible) {
    sqlDiv.classList.add('hidden');
  } else {
    sqlDiv.classList.remove('hidden');
  }
}

function hideLoginDiv(isVisible){
  const pcLogin = document.getElementById('pcLogin');
  if(isVisible){
    pcLogin.classList.add('hidden');
  }else{
    pcLogin.classList.remove('hidden');
  }
}


document.getElementById('btnLogin').addEventListener('click', function(){
  var inputUsername = document.getElementById("inputUsername").value.toLowerCase() ;
  var inputPassword = document.getElementById("inputPassword").value;



  if(inputUsername == pcUsername && inputPassword == pcPassword){
    isPcUnlocked = true;
    loadServerView();
  }
});

