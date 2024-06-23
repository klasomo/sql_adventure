
let currentStep = 6;

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
    setStepClickEvent();
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
        const element = document.getElementById(step.id);
        if(index < currentStep){
            // Klickbar
            element.addEventListener('click', () => {
                // Öffne das Modal
                step_modal_checkbox.checked = true;
                
                // Füge das spezifische Template ein
                const modalContent = step_modal.querySelector('.modal-box');
                const template = document.getElementById(`${step.id}-template`);
                
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

                initStep();

                console.log(modalContent);
            });

        }
        if(index > currentStep){
            //nicht klickbar
        }
    });
}
function initStep(step){
    switch(currentStep){
        case 1:
            break;
        case 2:
            break;
        case 3:
            break;
        case 4:
            initDecryption();
            break;
        case 5:
            initCityMap();
            break;
        case 6:
            initColorPicker();
            break;
        default:
            break;
    }
}

function closeModal(){
    step_modal_checkbox.checked = false;
}


// Step 1:


//Step Find Location

var selectedCell = [0, 0];
const columns = 16;
const rows = 9;

function initCityMap(){    
    
    const grid = document.querySelector('.grid');

    console.log(grid.childElementCount);

    if(grid.childElementCount != 0){
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
    const correctTargetCords = [4,7]
   
    document.getElementById("checkCityMap").addEventListener('click', function(){
        console.log(selectedCell);
        if(selectedCell[0] == correctTargetCords[0] && selectedCell[1] == correctTargetCords[1]){
            currentStep++;
            updateProgressBar();
            closeModal();
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
        cell.style.backgroundImage = 'url("/assets/images/Crosshair_svg.svg")';
        cell.style.backgroundSize = 'contain';
        cell.style.backgroundRepeat = 'no-repeat';
    } else {
        console.warn(`Element with ID '${cellId}' not found.`);
    }

}