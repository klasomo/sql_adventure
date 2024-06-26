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
    udpateViews();
    notifyHintManager();
}


function setStepClickEvent(){

    stepsNames.forEach((step, index) => {

        var element = document.getElementById(step.id);
        var template = document.getElementById(`${step.id}-template`);
        console.log("Template: ")
        console.log(template);
        if(index < 4){
            template = document.getElementById("step1-template");
            console.log(template);
        }

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
                const inputs = clonedTemplate.querySelectorAll('input, textarea, select, button');
                inputs.forEach(input => {
                    input.disabled = true;
                });
                initPhone(true);
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
                
                // Lösche vorherigen Inhalt
                modalContent.innerHTML = '';

                // Füge neuen Inhalt hinzu
                modalContent.appendChild(template.cloneNode(true));

                
                modalContent.style.display = 'block';
                modalContent.querySelector('div').style.display = 'block';;
                console.log("INIT2");
                initPhone(false);
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
            InitTatortbericht();
            break;
        case StepIndex.LOGIN:
            unlockView(DbNames.SERVER);
            initPhone(true);
            break;
        case StepIndex.TÜRPROTOKOLL:
            InitTürprotokoll();
            break;
        case StepIndex.ZUGANGSRECHTE:
            initPhone(true);
            zugangsrechtInit();

            break;
        case StepIndex.EMAIL:
            step_modal_box.classList.add("w-8/12", "max-w-5xl");
            step_modal_box.classList.remove("w-auto");  
            initDecryption();
            break;
        case StepIndex.VERANSTALTUNG:
            unlockView(DbNames.MAP);
            step_modal_box.classList.add("w-8/12", "max-w-5xl");
            step_modal_box.classList.remove("w-auto");  
            initCityMap();
            break;
        case StepIndex.BOMBE:
            unlockView(DbNames.BOMB);
            step_modal_box.classList.add("w-8/12", "max-w-5xl");
            step_modal_box.classList.remove("w-auto");  
            initColorPicker();
            break;
        default:
            break;
    }
}

function zugangsrechtInit(){
    if(wasInitialized[StepIndex.ZUGANGSRECHTE]){
        return;
    }
    wasInitialized[StepIndex.ZUGANGSRECHTE] = true; 

    ReciveMessage("Kannst du mir einen Gefallen tun und seine Emails überprüfen.");
}

function closeModal(){
    step_modal_checkbox.checked = false;
}

const Questions = {
    ROOM: "Wenn du herausgefunden hast, in welchem Raum der Vorfall passiert ist, schreib mir bitte die Raumnummer.",
    ABTEILUNG: "Der Täter muss ein Mitarbeiter der Firma Symmex sein. Zu welcher Abteilung gehört unser Verdächtiger wahrscheinlich?",
    TÄTER: "Hast du schon den Täter gefunden?"
}

var currentQuestion = Questions.ROOM;

var sendMessageButton;

function initPhone(lockPhone){

    step_modal_box.classList.remove("w-8/12", "max-w-5xl");
    step_modal_box.classList.add("w-auto");  

    var chatDiv = document.getElementById('phone_chat');
    chatDiv.innerHTML = "";

    // Event Listener für den Senden-Button hinzufügen
    sendMessageButton = document.getElementById('phone_send_message');
    sendMessageButton.addEventListener('click', SendMessage); // Hier: SendMessage ohne ()

    var messageInput = document.getElementById('phone_nachricht_input');

    if(lockPhone){
        sendMessageButton.disabled = true;
        messageInput.disabled = true;
    }else{
        sendMessageButton.disabled = false;
        messageInput.disabled = false;
    }

   
    messageInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            SendMessage();
        }
    });
    console.log("CHAT LOG");
    console.log(chatlogs);

    for(let chatlog of chatlogs){
        addChatMessage(chatlog.message, chatlog.isSender);
    }

}

var wasInitialized = [0,0,0,0,0,0,0];

let chatlogs = [];


// Step 1:
function InitTatortbericht() {


    if(wasInitialized[StepIndex.TARTORTBERICHT]){
        return;
    }
    wasInitialized[StepIndex.TARTORTBERICHT] = true; 
    // Hier könnte auch weitere Initialisierungslogik sein

    // Beispiel: Aufruf von addChatMessage
    ReciveMessage("Hallo, hier ist Kommissar Wolf.");
    ReciveMessage("Ich hoffe, du findest dich in unserer Datenbank zurecht.");
    ReciveMessage(currentQuestion);
}

var messageQueue = [];
var isProcessingMessage = false;

function ReciveMessage(message){
    messageQueue.push(message);
    if(!isProcessingMessage){
        processMessageQueue();
    }
}

function processMessageQueue(){
    if(messageQueue.length > 0){
        isProcessingMessage = true;
        const message = messageQueue.shift();
        const timeoutTime = message.length * 35;
        addChatMessageAndLog(message, false);
        setTimeout(processMessageQueue, timeoutTime);
    }else{
        isProcessingMessage = false;
    }
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
        addChatMessageAndLog(messageText, true);
        checkMessageForSolution(currentQuestion, messageText);
    }

    // Optional: Hier könntest du weitere Logik hinzufügen, z.B. den Input leeren
    messageInput.value = '';
}


function checkMessageForSolution(question, messageText){
    switch(question){
        case Questions.ROOM:
            if(messageText === "404"){
                ReciveMessage("Sehr gut.");
                ReciveMessage(Questions.ABTEILUNG);
                currentQuestion = Questions.ABTEILUNG;
                return;
            }
            break;
        case Questions.ABTEILUNG:
            console.log("check abteilung frage");
            if(messageText.toLowerCase() === "it"){
                ReciveMessage("Alles klar.");
                ReciveMessage("Ich habe dir jetzt Zugang zur Firmendatenbank von Symmex besorgt. Das sollte helfen den Täter zu finden, wenn du nur mehr Zugriffsrechte hättest.");
                incrementStep(StepIndex.TARTORTBERICHT);
                return;
            }
            break;
        case Questions.TÄTER:
            if(messageText.toLowerCase() === "paul huber"){
                ReciveMessage("Sehr gut. Ich werde mir gleich einen Haftbefehl besorgen, um ihn festzunehmen.");
                incrementStep(StepIndex.TÜRPROTOKOLL);
                return;
            }
            break;
        default:
            break;  
    }
    ReciveMessage("???");
}


function addChatMessageAndLog(messageText, isSender){
    if(addChatMessage(messageText, isSender)){

        let chatMessage = {
            isSender: isSender,
            message: messageText
        }

        chatlogs.push(chatMessage);
    }
}

function addChatMessage(messageText, isSender) {
    console.log("start add chat message funktion");
    if(messageText === ""){
        console.log("ADD CHAT WITH EMPTY STRING RETURN");
        return false;
    }
    console.log("addChatMessageCalled");

    // Klasse basierend auf isSender festlegen
    var imagePath = isSender ? 'assets/images/avatar/detective_avatar.png' : 'assets/images/avatar/police_avatar.png'
    var chatClass = isSender ? 'chat-end' : 'chat-start';
    var selfClass = isSender ? 'self-end' : 'self-start';

    // Chat-Nachricht HTML erstellen
    var messageHtml = `
        <div class="chat ${chatClass} ${selfClass}">
            <div class="chat-image avatar">
                <div class="w-10 rounded-full">
                    <img alt="Avatar" src=${imagePath} />
                </div>
            </div>
            <div class="chat-bubble">${messageText}</div>
        </div>`;

    // Zur Chat-Liste hinzufügen
    var chatDiv = document.getElementById('phone_chat');
    chatDiv.innerHTML += messageHtml;


    // Optional: Scrollen zum Ende des Chat-Verlaufs nach dem Hinzufügen der Nachricht
    console.log("SCROLL DOWN CHAT HISTORY");
    chatDiv.scrollTop = chatDiv.scrollHeight;

    return true;
}


//init Türprotkoll
function InitTürprotokoll(){

    
    if(wasInitialized[StepIndex.TÜRPROTOKOLL]){
        return;
    }
    wasInitialized[StepIndex.TÜRPROTOKOLL] = true; 

    // Event-Listener für den Button "Überprüfen" hinzufügen
    currentQuestion = Questions.TÄTER;
    ReciveMessage("Hallo, ich bins nochmal.");
    ReciveMessage(currentQuestion);
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
            button.style.cursor = 'url(assets/images/mouseIcon/cursor_target.cur), default';
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