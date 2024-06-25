const StepIndex = {
    TARTORTBERICHT: 0,
    LOGIN: 1,
    TÜRPROTOKOLL: 2,
    ZUGANGSRECHTE: 3,
    EMAIL: 4,
    VERANSTALTUNG: 5,
    BOMBE: 6
}

let currentStep = StepIndex.TARTORTBERICHT;


const stepsNames = [
    { id: 'step1', message: 'Tatortbericht' },
    { id: 'step2', message: 'Login' },
    { id: 'step3', message: 'Türprotokoll' },
    { id: 'step4', message: 'Zugangsrechte' },
    { id: 'step5', message: 'Email' },
    { id: 'step6', message: 'Veranstaltung' },
    { id: 'step7', message: 'Bombe' },
];


const step_modal = document.getElementById('step_modal');
const step_modal_checkbox = document.getElementById("step_modal_checkbox");

document.addEventListener('DOMContentLoaded', () => {    
    updateProgressBar();
});

function updateProgressBar(){
    var step_progressbar = document.getElementById("step_progressbar");
    var steps = step_progressbar.querySelectorAll('.steps .step');
    
    for(var i = 0; i < steps.length; i++){
        if ( i < currentStep+1){
            steps[i].classList.add('step-primary', 'text-primary');
            steps[i].textContent = stepsNames[i].message;
        }else{
            steps[i].classList.remove('step-primary', 'text-primary');
            steps[i].textContent = "? ? ?";
        }
    }
    setStepClickEvent();
    notifyHintManager();
}

function setStepClickEvent(){

    stepsNames.forEach((step, index) => {

        

        var element = document.getElementById(step.id);
        var template = document.getElementById(`${step.id}-template`);



        if(template === null){
            return;
        }
        if(index < currentStep){
            // Klickbar
            element.addEventListener('click', () => {
                // Öffne das Modal
                step_modal_checkbox.checked = true;
                
                // Füge das spezifische Template ein
                const modalContent = step_modal.querySelector('.modal-box');
                
                
                // Lösche vorherigen Inhalt
                modalContent.innerHTML = '';

                // Füge neuen Inhalt hinzu
                const clonedTemplate = template.cloneNode(true);
                modalContent.appendChild(clonedTemplate);
                modalContent.style.display = 'block';
                clonedTemplate.style.display = 'block';
                
                // Deaktiviere Eingaben und Buttons, wenn index < currentStep
                if (index < currentStep) {
                    const inputs = clonedTemplate.querySelectorAll('input, textarea, select, button');
                    inputs.forEach(input => {
                        input.disabled = true;
                    });
                }
                console.log("INIT1");
                initStep(index);
            });
        }
        if(index === currentStep){
            
            element.addEventListener('click', () => {
                // Öffne das Modal
                step_modal_checkbox.checked = true;
                
                // Füge das spezifische Template ein
                const modalContent = step_modal.querySelector('.modal-box');
                const template = document.getElementById(`${step.id}-template`);
                console.log(template);
                
                // Lösche vorherigen Inhalt
                modalContent.innerHTML = '';

                // Füge neuen Inhalt hinzu
                modalContent.appendChild(template.cloneNode(true));

                
                modalContent.style.display = 'block';
                modalContent.querySelector('div').style.display = 'block';;
                console.log("INIT2");
                initStep(index);

            });

        }
        if(index > currentStep){
            //nicht klickbar
        }
    });
}

function removeEventListeners() {
    stepsNames.forEach((step, index) => {
        const element = document.getElementById(step.id);
        element.removeEventListener('click', clickHandler);
    });
}


function initStep(step){
    const step_modal_box = document.getElementById("step_modal_box");
    switch(step){
        case StepIndex.TARTORTBERICHT:
            step_modal_box.classList.remove("w-8/12", "max-w-5xl");
            step_modal_box.classList.add("w-auto");  
            InitTatortbericht();
            break;
        case StepIndex.TÜRPROTOKOLL:
            console.log("Türprotkoll Index called");
            step_modal_box.classList.add("w-8/12", "max-w-5xl");
            step_modal_box.classList.remove("w-auto");  
            InitTürprotokoll();
            break;
        case StepIndex.ZUGANGSRECHTE:
            step_modal_box.classList.remove("w-8/12", "max-w-5xl");
            step_modal_box.classList.add("w-auto");  
            break;
        case StepIndex.EMAIL:
            step_modal_box.classList.add("w-8/12", "max-w-5xl");
            step_modal_box.classList.remove("w-auto");  
            initDecryption();
            break;
        case StepIndex.VERANSTALTUNG:
            initCityMap();
            break;
        case StepIndex.BOMBE:
            initColorPicker();
            break;
        default:
            break;
    }
}

function closeModal(){
    step_modal_checkbox.checked = false;
}

const Questions = {
    ROOM: "In welchem Raum wurde die Bombe gefunden?",
    ABTEILUNG: "Aus welcher Abteilung Stammt der Verdächtige?",
    TÄTER: "Wer hat die Bombe gelegt?"
}

var currentQuestion = Questions.ROOM;

var sendMessageButton;

// Step 1:
function InitTatortbericht() {
    // Hier könnte auch weitere Initialisierungslogik sein

    // Event Listener für den Senden-Button hinzufügen
    sendMessageButton = document.getElementById('phone_send_message');
    console.log("SendMessage click event was set");
    sendMessageButton.addEventListener('click', SendMessage); // Hier: SendMessage ohne ()

    var messageInput = document.getElementById('phone_nachricht_input');
    messageInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            SendMessage();
        }
    });

    // Beispiel: Aufruf von addChatMessage
    addChatMessage(currentQuestion, false);
}

function SendMessage() {
    var messageInput = document.getElementById('phone_nachricht_input');
    if (!messageInput) {
        console.error("Input element not found!");
        return;
    }
    var messageText = messageInput.value;
    console.log(messageText);
    if(messageText !== ""){
        addChatMessage(messageText, true);
        checkMessageForSolution(currentQuestion, messageText);
    }

    // Optional: Hier könntest du weitere Logik hinzufügen, z.B. den Input leeren
    messageInput.value = '';
}


function checkMessageForSolution(question, messageText){
    var messageToSendBack = "???";
    switch(question){
        case Questions.ROOM:
            if(messageText === "404"){
                messageToSendBack = Questions.ABTEILUNG;
                currentQuestion = Questions.ABTEILUNG;
            }
            break;
        case Questions.ABTEILUNG:
            console.log("check abteilung frage");
            if(messageText.toLowerCase() === "it"){
                messageToSendBack = "Danke du hast jetzt Zugriff auf den Firmen Computer melde dich an!"
                incrementStep(StepIndex.TARTORTBERICHT);
            }
            break;
        case Questions.TÄTER:
            if(messageText.toLowerCase() === "paul huber"){
                messageToSendBack = "Ok, erhöhe deine Zugangsberechtigung um die Emails von Paul Huber zu lesen."
                incrementStep(StepIndex.TÜRPROTOKOLL);
            }
            break;
        default:
            break;  
    }
    addChatMessage(messageToSendBack, false);
}

function addChatMessage(messageText, isSender) {
    console.log("start add chat message funktion");
    if(messageText === ""){
        console.log("ADD CHAT WITH EMPTY STRING RETURN");
        return;
    }
    console.log("addChatMessageCalled");
    // Klasse basierend auf isSender festlegen
    var chatClass = isSender ? 'chat-end' : 'chat-start';
    var selfClass = isSender ? 'self-end' : 'self-start';

    // Chat-Nachricht HTML erstellen
    var messageHtml = `
        <div class="chat ${chatClass} ${selfClass}">
            <div class="chat-image avatar">
                <div class="w-10 rounded-full">
                    <img alt="Avatar" src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.jpg" />
                </div>
            </div>
            <div class="chat-bubble">${messageText}</div>
        </div>`;

    // Zur Chat-Liste hinzufügen
    var chatDiv = document.getElementById('phone_chat');
    chatDiv.innerHTML += messageHtml;

    // Optional: Scrollen zum Ende des Chat-Verlaufs nach dem Hinzufügen der Nachricht
    chatDiv.scrollTop = chatDiv.scrollHeight;
}




function checkTatortbericht() {
    // Input-Feld für Raum Nr.
    const raumNrInput = document.getElementById('step1_input');
    // Select-Feld für Abteilung
    const abteilungInput = document.getElementById('abteilung_input');

    // Wert des Raum Nr. Inputs
    const raumNrValue = raumNrInput.value.trim();
    // Wert des Abteilung Selects
    const abteilungValue = abteilungInput.value;
    console.log(raumNrInput);

    // Überprüfung, ob Raum Nr. "404" ist und Abteilung "IT" ausgewählt wurde
    if (raumNrValue === "404" && abteilungValue === "IT") {
        incrementStep(StepIndex.TARTORTBERICHT);
    } 
}


//init Türprotkoll
function InitTürprotokoll(){
    // Event-Listener für den Button "Überprüfen" hinzufügen
    const checkButton = document.getElementById('doorLog_check');
    console.log()
    checkButton.addEventListener('click', checkTäter);

    function checkTäter() {
        // Input-Feld für den Täter
        const täterInput = document.getElementById('step3_input');
        // Wert des Täter Inputs
        const täterValue = täterInput.value.trim().toLowerCase(); // Vergleich ist case-insensitive
    
        // Zu überprüfender Tätername
        const gesuchterTäter = "paul huber";

        if (täterValue === gesuchterTäter) {
            console.log("richtig täter");
            incrementStep(StepIndex.TÜRPROTOKOLL);
        }
    }
}


//Step Find Location
var selectedCell = [null, null];
const columns = 16;
const rows = 9;

function initCityMap(){    
    
    const grid = document.querySelector('.grid');

    if(grid.childElementCount != 0){
        console.log("selectedCell:" + selectedCell);
        if(selectedCell[0] != null){
            drawTargetOnCell(selectedCell);
        }

        console.log("return init already finished");
        setCellClickEvents();
        return;
    }
    console.log("Init2 City Map");

    const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
            'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];


    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {

            const gridCell = document.createElement('div');
            const button = document.createElement('button');

            button.classList.add('relative', 'flex', 'items-center', 'justify-center');

            if(row == 0){
                //Buchstaben oben mittig
                const rowLabel = document.createElement('span');
                rowLabel.textContent = alphabet[col]
                rowLabel.classList.add('absolute', 'top-0', 'text-center', 'w-full', 'font-bold');
                button.append(rowLabel);
            }
            if(col == 0){
                //Zahl links mittig
                const colLabel = document.createElement('span');
                colLabel.textContent = row + 1;
                colLabel.classList.add('absolute', 'left-0', 'transform', 'translate-x-1/2', 'font-bold');
                button.append(colLabel);
            }
            
            button.id = row + "," + col;
           
            gridCell.appendChild(button);
            grid.appendChild(gridCell);
        }
    }

    setCellClickEvents()
}


function setCellClickEvents(){
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const cellId = row + "," + col;
            const cell = document.getElementById(cellId);

            cell.addEventListener('click', () => {
                console.log("Button Pressed");
                clearCell(selectedCell);
                selectedCell[0] = row;
                selectedCell[1] = col;

                cell.style.backgroundImage = 'url("assets/images/crosshair-1-svgrepo-com.svg")';
                cell.style.backgroundSize = 'contain';
                cell.style.backgroundRepeat = 'no-repeat';
            });
        }
    }
    setCheckButtonCityMap();
}

function clearCell(cellCords) {
    if (cellCords[0] != null) {
        const cellId = cellCords[0] + "," + cellCords[1];
        const cell = document.getElementById(cellId);

        if (cell) { // Überprüfen, ob das Element gefunden wurde
            cell.style.backgroundImage = "";
            console.log("remove background image");
            console.log(cell);
        } else {
            console.warn(`Element with ID '${cellId}' not found.`);
        }
    } else {
        console.warn("cellCords parameter is null or undefined.");
    }
}




//Überprüf button Event H5
function setCheckButtonCityMap(){
    console.log("setCheckButtonCitymap");
    const correctTargetCords = [3,13]
   
    document.getElementById("checkCityMap").addEventListener('click', function(){
        console.log(selectedCell);
        if(selectedCell[0] == correctTargetCords[0] && selectedCell[1] == correctTargetCords[1]){
            incrementStep(StepIndex.VERANSTALTUNG);
            //closeModal();
        }else{
            console.log("Falsch");
        }
    });
}


function clearCell(cellCords) {
    if (cellCords[0] != null) {
        const cellId = cellCords[0] + "," + cellCords[1];
        const cell = document.getElementById(cellId);

        if (cell) { // Überprüfen, ob das Element gefunden wurde
            cell.style.backgroundImage = "";
        } else {
            console.warn(`Element with ID '${cellId}' not found.`);
        }
    }
}

function drawTargetOnCell(cellCords){
    console.log("Draw Function was called");
    const cellId = cellCords[0] + "," + cellCords[1];
    const cell = document.getElementById(cellId);

    if (cell) { // Überprüfen, ob das Element gefunden wurde
        cell.style.backgroundImage = 'url("assets/images/crosshair-1-svgrepo-com.svg")';
        cell.style.backgroundSize = 'contain';
        cell.style.backgroundRepeat = 'no-repeat';
    } else {
        console.warn(`Element with ID '${cellId}' not found.`);
    }

}