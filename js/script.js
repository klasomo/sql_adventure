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
          if (!validateSQLServerLogin(commands_lower)) {
            serverViewError();
            if (callback) callback(false);
            return;
          } else {
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

// // Create an HTML table
// var tableCreate = (function () {
//   function valconcat(vals, tagName) {
//     if (vals.length === 0) return "";
//     var open = "<" + tagName + ">",
//       close = "</" + tagName + ">";
//     return open + vals.join(close + open) + close;
//   }
//   return function (columns, values) {
//     var tbl = document.createElement("table");
//     // Hinzufügen der Klassen "table" und "table-zebra"
//     tbl.classList.add("table", "table-zebra");
//     var html = "<thead>" + valconcat(columns, "th") + "</thead>";
//     var rows = values.map(function (v) {
//       return valconcat(v, "td");
//     });
//     html += "<tbody>" + valconcat(rows, "tr") + "</tbody>";
//     tbl.innerHTML = html;
//     return tbl;
//   };
// })();

var tableCreate = (function () {
  function valconcat(vals, tagName) {
    if (vals.length === 0) return "";
    var open = "<" + tagName + ">",
      close = "</" + tagName + ">";
    var result = "";
    for (var i = 0; i < vals.length; i++) {
      result += open + vals[i] + close;
    }
    return result;
  }

  return function (columns, values) {
    var tbl = document.createElement("table");
    tbl.classList.add("table", "table-zebra");

    var headHtml = "";
    for (var i = 0; i < columns.length; i++) {
      headHtml += "<th>" + columns[i] + "</th>";
    }
    var html = "<thead'>" + headHtml + "</thead>";

    var rowsHtml = "";
    for (var i = 0; i < values.length; i++) {
      var rowHtml = "";
      for (var j = 0; j < values[i].length; j++) {
        if (columns[j].toLowerCase() === "nachricht") {
          rowHtml +=
            "<td class='flex flex-row items-center'>" +
            customCopyElement(i, j) +
            "<div id='copyTarget" +
            i +
            "_" +
            j +
            "'>" +
            values[i][j] +
            "</div>" +
            "</td>";
        } else {
          rowHtml += "<td>" + values[i][j] + "</td>";
        }
      }
      rowsHtml += "<tr>" + rowHtml + "</tr>";
    }
    
    html += "<tbody>" + rowsHtml + "</tbody>";
    tbl.innerHTML = html;
    return tbl;
  };
})();

function customCopyElement(rowIndex, colIndex) {
  // 1. Erstelle das div-Element für den Tooltip
  const tooltipDiv = document.createElement('div');
  tooltipDiv.classList.add('tooltip', 'tooltip-bottom');
  tooltipDiv.setAttribute('data-tip', 'kopieren');

  // 2. Erstelle das Button-Element
  const copy_button = document.createElement("button");
  const target = "#copyTarget" + rowIndex + "_" + colIndex;
  copy_button.className = "btn btn-square btn-outline copyBnt btn-sm mr-2";
  copy_button.setAttribute("data-clipboard-target", target);
  const copy_button_id = "copyBtn" + rowIndex + "_" + colIndex;
  copy_button.id =  copy_button_id;

  // 3. Erstelle das SVG-Icon
  const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const svgIconId = "svgIcon" + rowIndex + "_" + colIndex;
  svgIcon.id = svgIconId;
  svgIcon.setAttribute("width", "25px");
  svgIcon.setAttribute("height", "25px");
  svgIcon.setAttribute("viewBox", "0 0 24 24");
  svgIcon.setAttribute("fill", "none");

  // SVG Path für das ursprüngliche Symbol
  const originalPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  originalPath.setAttribute("d", "M19.53 8L14 2.47C13.8595 2.32931 13.6688 2.25018 13.47 2.25H11C10.2707 2.25 9.57118 2.53973 9.05546 3.05546C8.53973 3.57118 8.25 4.27065 8.25 5V6.25H7C6.27065 6.25 5.57118 6.53973 5.05546 7.05546C4.53973 7.57118 4.25 8.27065 4.25 9V19C4.25 19.7293 4.53973 20.4288 5.05546 20.9445C5.57118 21.4603 6.27065 21.75 7 21.75H14C14.7293 21.75 15.4288 21.4603 15.9445 20.9445C16.4603 20.4288 16.75 19.7293 16.75 19V17.75H17C17.7293 17.75 18.4288 17.4603 18.9445 16.9445C19.4603 16.4288 19.75 15.7293 19.75 15V8.5C19.7421 8.3116 19.6636 8.13309 19.53 8ZM14.25 4.81L17.19 7.75H14.25V4.81ZM15.25 19C15.25 19.3315 15.1183 19.6495 14.8839 19.8839C14.6495 20.1183 14.3315 20.25 14 20.25H7C6.66848 20.25 6.35054 20.1183 6.11612 19.8839C5.8817 19.6495 5.75 19.3315 5.75 19V9C5.75 8.66848 5.8817 8.35054 6.11612 8.11612C6.35054 7.8817 6.66848 7.75 7 7.75H8.25V15C8.25 15.7293 8.53973 16.4288 9.05546 16.9445C9.57118 17.4603 10.2707 17.75 11 17.75H15.25V19ZM17 16.25H11C10.6685 16.25 10.3505 16.1183 10.1161 15.8839C9.8817 15.6495 9.75 15.3315 9.75 15V5C9.75 4.66848 9.8817 4.35054 10.1161 4.11612C10.3505 3.8817 10.6685 3.75 11 3.75H12.75V8.5C12.7526 8.69811 12.8324 8.88737 12.9725 9.02747C13.1126 9.16756 13.3019 9.24741 13.5 9.25H18.25V15C18.25 15.3315 18.1183 15.6495 17.8839 15.8839C17.6495 16.1183 17.3315 16.25 17 16.25Z");
  originalPath.setAttribute("fill", "#ffffff");

  // SVG Path für das geänderte Symbol
  const changedPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  changedPath.setAttribute("d", "M19.7071 6.29289C20.0976 6.68342 20.0976 7.31658 19.7071 7.70711L10.4142 17C9.63316 17.7811 8.36683 17.781 7.58579 17L3.29289 12.7071C2.90237 12.3166 2.90237 11.6834 3.29289 11.2929C3.68342 10.9024 4.31658 10.9024 4.70711 11.2929L9 15.5858L18.2929 6.29289C18.6834 5.90237 19.3166 5.90237 19.7071 6.29289Z");
  changedPath.setAttribute("fill", "#4d8628");

  // Füge den ursprünglichen Path zum SVG-Icon hinzu
  svgIcon.appendChild(originalPath);


  // Füge den Button zum Tooltip-Div hinzu
  tooltipDiv.appendChild(copy_button);

  var clipboard = new ClipboardJS("#"+copy_button_id);

  clipboard.on('success', function(e) {
    console.log("Copy Btn Clicked");
    const changeSvgIcon = document.getElementById(svgIconId);
  
    changeSvgIcon.innerHTML = changedPath.outerHTML;

    setTimeout(function () {
        changeSvgIcon.innerHTML = originalPath.outerHTML;
    }, 1000);
  });

  
  // Füge das SVG-Icon zum Button hinzu
  copy_button.appendChild(svgIcon);
  // 6. Gib den HTML-String des Tooltip-Divs zurück (optional)
  return tooltipDiv.outerHTML;
}


function incrementStep(currentOldStep) {
  if (currentStep === currentOldStep) {
    let nextValue = currentOldStep + 1;
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

      incrementStep(StepIndex.ZUGANGSRECHTE);
      pcState = PcState.UNLOCKED;
      loadServerView();
    } else {
      if (pcState === PcState.UNLOCKED) {
        pcState = PcState.LOGIN;
        loadServerView();
      }
    }
  });
}

function udpateViews() {
  if(currentStep >= StepIndex.TARTORTBERICHT){
    unlockView(DbNames.POLICE);
  }
  if(currentStep >= StepIndex.LOGIN){
    unlockView(DbNames.SERVER);
  }
  if(currentStep >= StepIndex.VERANSTALTUNG){
    unlockView(DbNames.MAP);
  }
  if(currentStep >= StepIndex.BOMBE){
    unlockView(DbNames.BOMB);
  }
}

function unlockView(dbName) {
  switch (dbName) {
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
  if (databases[dbName]) {
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
  } else {
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
