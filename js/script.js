
const DbNames = {
  POLICE: "police",
  SERVER: "server_locked",
  MAP: "map",
  BOMB: "bomb",
};

const PcState = {
  LOCKED: 0,
  GUEST: 1,
  UNLOCKED: 2,
  LOGIN: 3,
};

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

function clearSuccessMessage() {
  var successAlert = document.getElementById("successAlert");

  successAlert.classList.add("hidden");
}

function successMessage() {
  var successAlert = document.getElementById("successAlert");

  successAlert.classList.remove("hidden");
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

function validateSQLServerLogin(sql) {
  const restrictedTable = "email";
  const allowedTable = "mitarbeiter";
  const allowedColumns = [
    "mitarbeiter_id",
    "name",
    "zugangsberechtigung",
    "arbeitsplatz",
  ];
  const blockedColumns = ["geschlecht", "email_adresse", "abteilung"];
  const unrestrictedTable = "türprotokoll";

  const sqlLower = sql.toLowerCase();

  // Blockiert alle Zugriffe auf die Tabelle "Email"
  if (sqlLower.includes(restrictedTable)) {
    return false;
  }

  const selectPattern = new RegExp(
    `select\\s+(.*)\\s+from\\s+${allowedTable}`,
    "i"
  );
  const insertPattern = new RegExp(
    `insert\\s+into\\s+${allowedTable}\\s+\\((.*)\\)`,
    "i"
  );
  const updatePattern = new RegExp(
    `update\\s+${allowedTable}\\s+set\\s+(.*)`,
    "i"
  );
  const deletePattern = new RegExp(`delete\\s+from\\s+${allowedTable}`, "i");

  // Überprüft SELECT-Befehle auf der Tabelle "Mitarbeiter"
  if (selectPattern.test(sql)) {
    const columns = selectPattern
      .exec(sql)[1]
      .split(",")
      .map((col) => col.trim());
    return columns.every((col) => allowedColumns.includes(col.toLowerCase()));
  }

  // Erlaubt UPDATE-Befehle auf der Tabelle "Mitarbeiter"
  // if (updatePattern.test(sql)) {
  //   const setClauses = sql.match(updatePattern)[1].split(",").map(clause => clause.trim().split("=")[0]);
  //   return setClauses.every(col => allowedColumns.includes(col.toLowerCase()));
  // }

  // Blockiert INSERT und DELETE-Befehle auf der Tabelle "Mitarbeiter"
  if (insertPattern.test(sql) || deletePattern.test(sql)) {
    return false;
  }

  // Überprüft SELECT-Befehle auf der Tabelle "Türprotokoll"
  if (sqlLower.includes(unrestrictedTable)) {
    return true;
  }

  // Standardmäßig false zurückgeben
  return true;
}

function validateSQLServerGuest(sql) {
  const restrictedTables = ["email", "türprotokolle"];
  const restrictedTable = "mitarbeiter";
  const allowedColumns = ["mitarbeiter_id", "name", "arbeitsplatz"];
  const blockedColumns = [
    "zugangsberechtigung",
    "geschlecht",
    "email_adresse",
    "abteilung",
  ];

  const sqlLower = sql.toLowerCase();

  // Blockiert alle Zugriffe auf die Tabellen "Email" und "Türprotokolle"
  if (restrictedTables.some((table) => sqlLower.includes(table))) {
    return false;
  }

  const selectPattern = new RegExp(
    `select\\s+(.*)\\s+from\\s+${restrictedTable}`,
    "i"
  );
  const insertPattern = new RegExp(
    `insert\\s+into\\s+${restrictedTable}\\s+\\((.*)\\)`,
    "i"
  );
  const updatePattern = new RegExp(
    `update\\s+${restrictedTable}\\s+set\\s+(.*)`,
    "i"
  );
  const deletePattern = new RegExp(`delete\\s+from\\s+${restrictedTable}`, "i");

  // Überprüft SELECT-Befehle
  if (selectPattern.test(sql)) {
    const columns = selectPattern
      .exec(sql)[1]
      .split(",")
      .map((col) => col.trim());
    return columns.every((col) => allowedColumns.includes(col.toLowerCase()));
  }

  // Blockiert INSERT, UPDATE und DELETE-Befehle auf der Tabelle "Mitarbeiter"
  if (
    insertPattern.test(sql) ||
    updatePattern.test(sql) ||
    deletePattern.test(sql)
  ) {
    return false;
  }

  // Standardmäßig false zurückgeben
  return false;
}

// Modifizierte execute-Funktion zum Ausführen von Befehlen in der ausgewählten Datenbank
function execute(commands, outputElement, callback) {
  // Konvertiert den SQL-Befehl in Kleinbuchstaben
  var commands_lower = commands.toLowerCase();

  // Überprüft, ob eine aktuelle Datenbank ausgewählt und geöffnet ist
  if (!currentDatabase || !databases[currentDatabase]) {
    console.error("No database selected or database not opened.");
    outputElement.innerHTML =
      "Error: No database selected or database not opened.";
    if (callback) callback(false);
    return;
  }

  // Validiert die SQL-Befehle vor der Ausführung
  if (currentDatabase === DbNames.SERVER) {
    switch (pcState) {
      case PcState.GUEST:
        if (!validateSQLServerGuest(commands_lower)) {
          serverViewError();
          if (callback) callback(false);
          return;
        }
      case PcState.LOGIN:
        if (accessLevel <= 5) {
          console.log("validateSQLServerLogin");
          if (!validateSQLServerLogin(commands_lower)) {
            serverViewError();
            if (callback) callback(false);
            return;
          } else {
            console.log("validateSQLServerLogin Else");
          }
        }
    }
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
    clearSuccessMessage();

    // Leert das Ausgabeelement
    outputElement.innerHTML = "";

    if (results.length === 0) {
      successMessage();
    }

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

var accessLevel = 0;

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

function incrementStep(currentOldStep) {
  console.log(currentStep);
  console.log(currentOldStep);
  if (currentStep === currentOldStep) {
    let nextValue = currentOldStep + 1;
    console.log("increment currentStep: " + nextValue);
    currentStep = nextValue;
  }
  updateProgressBar();
  //closeModal();
}

function checkAccessLevel() {
  var sqlCommand =
    'select Zugangsberechtigung from Mitarbeiter where name like "Max Brandt";';
  executeSqlIntern(sqlCommand, DbNames.SERVER, function (results) {
    var value = results[0].values[0][0];
    accessLevel = value;
    if (value >= 5) {
      if (pcState === PcState.UNLOCKED) {
        return;
      }
      console.log("accessLevel high enough");
      incrementStep(StepIndex.ZUGANGSRECHTE);
      pcState = PcState.UNLOCKED;
      loadServerView();
    } else {
      if (pcState === PcState.UNLOCKED) {
        pcState = PcState.LOGIN;
        loadServerView();
        console.log("set pc State to login");
      }
    }
  });
}

function udpateViews(){
  switch(currentStep){
    case StepIndex.TARTORTBERICHT:
      unlockView(DbNames.POLICE);
      break;
    case StepIndex.LOGIN:
      unlockView(DbNames.SERVER);
      break;
    case StepIndex.VERANSTALTUNG:
      unlockView(DbNames.VERANSTALTUNG);
      break;
    case StepIndex.BOMBE:
      unlockView(DbNames.BOMB);
      break;
  }
}


function unlockView(dbName){
  switch(dbName){
    case DbNames.POLICE:
      btnPolice.classList.remove("btn-disabled");
      var svgPath = btnPolice.querySelector("svg");
      svgPath.setAttribute("fill", "#ffffff");
      break;
    case DbNames.SERVER:
      btnServer.classList.remove("btn-disabled");
      var svgPath = btnServer.querySelector("path");
      svgPath.setAttribute("stroke", "#ffffff");
      break;
    case DbNames.MAP:
      btnMap.classList.remove("btn-disabled");
      var svgPath = btnMap.querySelector("path");
      svgPath.setAttribute("stroke", "#ffffff");
      break;
    case DbNames.BOMB:
      btnBomb.classList.remove("btn-disabled");
      var svgPath = btnBomb.querySelector("path");
      svgPath.setAttribute("fill", "#ffffff");
      break;
    default:
      break;

  }
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
      if (
        currentDatabase === DbNames.SERVER &&
        pcState !== PcState.GUEST &&
        pcState !== PcState.LOCKED
      ) {
        checkAccessLevel();
      }
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

var maxLines = 2;

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



function openDatabaseFromDbName(dbName) {
  var dbPath = "";
  switch (dbName) {
    case DbNames.POLICE:
      dbPath = "./db/police.sqlite";
      break;
    case DbNames.SERVER:
      dbPath = "./db/firma.sqlite";
      break;
    case DbNames.MAP:
      dbPath = "./db/veranstaltung.sqlite";
      break;
    case DbNames.BOMB:
      dbPath = "./db/bombe.sqlite";
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
        DbNames.SERVER,
        "./assets/images/background/computer_login.png"
      );
      hideLoginDiv(false);
      hideSqlDiv(true);
      break;
    case PcState.GUEST:
      handleButtonClick(
        1,
        DbNames.SERVER,
        "./assets/images/background/computer_gast.png"
      );
      hideLoginDiv(true);
      hideSqlDiv(false);
      break;
    case PcState.LOGIN:
      hideLoginDiv(true);
      hideSqlDiv(false);
      handleButtonClick(
        1,
        DbNames.SERVER,
        "./assets/images/background/computer.png"
      );
      break;
    case PcState.UNLOCKED:
      hideLoginDiv(true);
      hideSqlDiv(false);

      handleButtonClick(
        1,
        DbNames.SERVER,
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
  pcState = PcState.LOCKED;
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

function hideSqlDiv(isVisible) {
  const sqlDiv = document.getElementById("sqlDiv");
  if (isVisible) {
    sqlDiv.classList.add("hidden");
  } else {
    sqlDiv.classList.remove("hidden");
  }
}

let pcPassword = "qtr-Ch3n-wy";
let pcUsername = "max.brandt";

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

// Funktion, die checklogin() aufruft, wenn Enter gedrückt wird
function handleEnterKey(event) {
  if (event.key === "Enter") {
    checkServerLogin();
  }
}

// Event Listener zu den Eingabefeldern hinzufügen
document
  .getElementById("inputUsername")
  .addEventListener("keydown", handleEnterKey);
document
  .getElementById("inputPassword")
  .addEventListener("keydown", handleEnterKey);

function checkServerLogin() {
  var inputUsername = document
    .getElementById("inputUsername")
    .value.toLowerCase();
  var inputPassword = document.getElementById("inputPassword").value;
  var loginError = document.getElementById("loginError");

  loginError.classList.add("invisible");

  if (inputUsername != pcUsername) {
    pcState = PcState.LOCKED;
    loginError.innerHTML = "Falscher Nutzername!";
    loginError.classList.remove("invisible");
  } else if (inputPassword != pcPassword) {
    loginError.innerHTML = "Falsches Passwort!";
    pcState = PcState.LOCKED;
    loginError.classList.remove("invisible");
  } else {
    incrementStep(StepIndex.LOGIN);
    pcState = PcState.LOGIN;
    loadServerView();
  }
}

document.getElementById("btnLogin").addEventListener("click", function () {
  checkServerLogin();
});
