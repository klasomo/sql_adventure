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

function serverViewError() {
  // Fehlermeldung und zugehörige Elemente abrufen
  const errorAlert = document.getElementById("errorAlert");
  const errorMessage = document.getElementById("errorMessage");

  // Fehlermeldungstext setzen
  errorMessage.innerHTML = `Als Gastbenutzer können Sie nur auf die Spalten 'Mitarbeiter_id', 'Name' und 'Arbeitsplatz' zugreifen. Um mehr Daten abzurufen, geben Sie bitte Ihren SELECT-Befehl präziser an <span class="underline text-blue-500 cursor-pointer">oder loggen Sie sich mit entsprechenden Berechtigungen ein</span>.`;

  // Event Listener für den klickbaren Text hinzufügen
  const clickableText = errorMessage.querySelector(".underline");
  clickableText.addEventListener("click", function () {
    pcState = PcState.LOCKED;
    loadServerView();
  });

  // Fehlermeldung anzeigen, indem die Klasse 'hidden' entfernt wird
  errorAlert.classList.remove("hidden");
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

// Funktion zur Validierung der SQL-Befehle für die eingeschränkte Tabelle
function validateSQL(sql, restrictedTable, allowedColumns) {
  const allowedColumnsLowerCase = allowedColumns.map((col) =>
    col.toLowerCase()
  );

  const selectPattern = new RegExp(
    `select\\s+(.*)\\s+from\\s+${restrictedTable}`,
    "i"
  );
  const updatePattern = new RegExp(
    `update\\s+${restrictedTable}\\s+set\\s+(.*)`,
    "i"
  );
  const deletePattern = new RegExp(`delete\\s+from\\s+${restrictedTable}`, "i");

  // Blockiert die Tabelle "EMAIL" komplett
  const emailTablePattern = new RegExp(`\\bemail\\b`, "i");

  if (emailTablePattern.test(sql)) {
    return false; // Blockiert den Befehl vollständig
  }

  if (selectPattern.test(sql)) {
    const columns = selectPattern
      .exec(sql)[1]
      .split(",")
      .map((col) => col.trim());
    return columns.every((col) =>
      allowedColumnsLowerCase.includes(col.toLowerCase())
    );
  } else if (updatePattern.test(sql)) {
    const setClauses = updatePattern
      .exec(sql)[1]
      .split(",")
      .map((clause) => clause.split("=")[0].trim());
    return setClauses.every((col) =>
      allowedColumnsLowerCase.includes(col.toLowerCase())
    );
  } else if (deletePattern.test(sql)) {
    // Zusätzliche Logik für DELETE kann bei Bedarf hinzugefügt werden
    return true; // Im Beispiel wird angenommen, dass keine Überprüfungen für DELETE erforderlich sind
  }
  return true;
}

// Modifizierte execute-Funktion zum Ausführen von Befehlen in der ausgewählten Datenbank
function execute(commands, outputElement, callback) {
  // Konvertiert den SQL-Befehl in Kleinbuchstaben
  var commands_lower = commands.toLowerCase();

  const restrictedTable = "mitarbeiter";
  const allowedColumns = [
    "Mitarbeiter_ID",
    "Name",
    "Zugangsberechtigung",
    "Arbeitsplatz",
  ];

  // Überprüft, ob eine aktuelle Datenbank ausgewählt und geöffnet ist
  if (!currentDatabase || !databases[currentDatabase]) {
    console.error("No database selected or database not opened.");
    outputElement.innerHTML =
      "Error: No database selected or database not opened.";
    if (callback) callback(false);
    return;
  }

  // Validiert die SQL-Befehle vor der Ausführung
  if (
    !validateSQL(commands_lower, restrictedTable, allowedColumns) &&
    currentDatabase === DbNames.SERVER_LOCKED
  ) {
    serverViewError();
    if (callback) callback(false);
    return;
  }

  // Holt den Worker für die aktuelle Datenbank
  var worker = databases[currentDatabase];

  // Definiert den onmessage-Handler für den Worker
  worker.onmessage = function (event) {
    var results = event.data.results;
    if (!results) {
      // Bei einem Fehler, loggt diesen und aktualisiert das Ausgabeelement
      error({ message: event.data.error });
      if (callback) callback(false);
      return;
    }

    // Leert das Ausgabeelement
    outputElement.innerHTML = "";

    // Durchläuft die Ergebnisse und fügt Tabellen dem Ausgabeelement hinzu
    for (var i = 0; i < results.length; i++) {
      outputElement.appendChild(
        tableCreate(results[i].columns, results[i].values)
      );
    }
    // Ruft das Callback mit true für Erfolg auf
    if (callback) callback(true);
  };

  // Sendet die SQL-Befehle an den Worker
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


function checkAccessLevel(){
  var sqlCommand = 'select Zugangsberechtigung from Mitarbeiter where name like "Max Brandt";'
  executeSqlIntern(sqlCommand, DbNames.SERVER_UNLOCKED,function (results) {
    var value = results[0].values[0][0];
    if(value == 5){
      currentStep++;
      updateProgressBar();
    }else{
      console.log("Access Level not large enough!");
    }
  });
}

// Execute the commands when the button is clicked
function execEditorContents() {
  outputElm.innerHTML = "";
  execute(sqlInput.getValue(), outputElm, function (success) {
    if (success) {
      if (!commandHistories[currentDatabase]) {
        commandHistories[currentDatabase] = []; // Initialisieren des Arrays, falls es noch nicht existiert
      }
      commandHistories[currentDatabase].push(sqlInput.getValue()); // Speichern des Befehls in der Historie der aktuellen Datenbank
      noerror();
      checkAccessLevel();
    }
  });
}

function executeSqlIntern(sqlCommand, database, callback) {
  // Konvertiert den SQL-Befehl in Kleinbuchstaben

  // Überprüft, ob eine aktuelle Datenbank ausgewählt und geöffnet ist
  if (!databases[database]) {
    console.error("No database selected or database not opened.");
    return;
  }
  // Holt den Worker für die aktuelle Datenbank
  var worker = databases[database];

  // Definiert den onmessage-Handler für den Worker
  worker.onmessage = function (event) {
    var results = event.data.results;
    if (!results) {
      // Bei einem Fehler, loggt diesen und aktualisiert das Ausgabeelement
      console.log(event.data.error);
      return;
    }

     // Ruft das Callback mit true für Erfolg auf
    if (callback) callback(results);
  };

  // Sendet die SQL-Befehle an den Worker
  worker.postMessage({ action: "exec", sql: sqlCommand });
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

// Open the database
var databases = {}; // Objekt zur Speicherung der geöffneten Datenbanken
var currentDatabase = null; // Variable zur Speicherung der aktuellen Datenbank

function openDatabase(dbPath, dbName) {
  console.log(`Open Database ${dbName}`);
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
        console.log(currentDatabase);
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

const DbNames = {
  POLICE: "police",
  SERVER_LOCKED: "server_locked",
  SERVER_UNLOCKED: "server_unlocked",
  MAP: "map",
  BOMB: "bomb",
};

const PcState = {
  LOCKED: 0,
  GUEST: 1,
  UNLCOKED: 2,
};

function openDatabaseFromDbName(dbName) {
  var dbPath = "";
  switch (dbName) {
    case DbNames.POLICE:
      dbPath = "./db/police.sqlite";
      break;
    case DbNames.SERVER_LOCKED:
      dbPath = "./db/firma.sqlite";
      break;
    case DbNames.SERVER_UNLOCKED:
      dbPath = "./db/firma_unlocked.sqlite";
      break;
    case DbNames.MAP:
      dbPath = "./db/veranstaltung.sqlite";
      break;
    case DbNames.BOMB:
      dbPath = "./db/bombe.sqlite";
      break;
  }

  openDatabase(dbPath, dbName);
  openDatabase("./db/firma_unlocked.sqlite", DbNames.SERVER_UNLOCKED);
}

// Function to handle button clicks and open databases
function handleButtonClick(viewIndex, dbName, backgroundImage) {
  hideLoginDiv(true);
  hideSqlDiv(false);
  saveAndLoadSqlCommand(viewIndex);
  changeBackgroundImage(backgroundImage);
  openDatabaseFromDbName(dbName);
  currentDatabase = dbName; // Set the current database when button is clicked
}

function loadPoliceView() {
  handleButtonClick(
    0,
    DbNames.POLICE,
    "./assets/images/background/pinboard.png"
  );
}

let pcState = PcState.LOCKED;

function loadServerView() {
  switch (pcState) {
    case PcState.LOCKED:
      handleButtonClick(
        1,
        DbNames.SERVER_LOCKED,
        "./assets/images/background/computer_login.png"
      );
      hideLoginDiv(false);
      hideSqlDiv(true);
      break;
    case PcState.GUEST:
      handleButtonClick(
        1,
        DbNames.SERVER_LOCKED,
        "./assets/images/background/computer.png"
      );
      hideLoginDiv(true);
      hideSqlDiv(false);
      break;
    case PcState.UNLCOKED:
      hideLoginDiv(true);
      hideSqlDiv(false);
      handleButtonClick(
        1,
        DbNames.SERVER_UNLOCKED,
        "./assets/images/background/computer_unlocked.png"
      );
      break;
  }
}

function loadMapView() {
  handleButtonClick(2, DbNames.MAP, "./assets/images/background/map.png");
}

function loadBombView() {
  handleButtonClick(3, DbNames.BOMB, "./assets/images/background/bomb.png");
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
  noerror();

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

document.getElementById("resetBtn").addEventListener("click", function () {
  if (
    confirm(
      "Möchten Sie die Datenbank wirklich neu laden? Alle Änderungen gehen verloren."
    )
  ) {
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

let pcPassword = "qtr-Ch3n-wy";
let pcUsername = "max.brandt";

function hideSqlDiv(isVisible) {
  const sqlDiv = document.getElementById("sqlDiv");
  if (isVisible) {
    sqlDiv.classList.add("hidden");
  } else {
    sqlDiv.classList.remove("hidden");
  }
}

function hideLoginDiv(isVisible) {
  const pcLogin = document.getElementById("pcLogin");
  if (isVisible) {
    pcLogin.classList.add("hidden");
  } else {
    pcLogin.classList.remove("hidden");
  }
}

document
  .getElementById("guestLoginText")
  .addEventListener("click", function () {
    pcState = PcState.GUEST;
    loadServerView();
  });

document.getElementById("btnLogin").addEventListener("click", function () {
  var inputUsername = document
    .getElementById("inputUsername")
    .value.toLowerCase();
  var inputPassword = document.getElementById("inputPassword").value;
  var loginError = document.getElementById("loginError");

  if (inputUsername == pcUsername && inputPassword == pcPassword) {
    currentStep++;
    updateProgressBar();
    pcState = PcState.UNLCOKED;
    loginError.classList.add("invisible");
    loadServerView();
  } else {
    pcState = PcState.LOCKED;
    loginError.classList.remove("invisible");
  }
});
