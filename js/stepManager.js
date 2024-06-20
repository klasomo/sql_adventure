
let currentStep = 4;

const stepsNames = [
    { id: 'step1', message: 'Fall Übersicht' },
    { id: 'step2', message: 'Am PC anmelden' },
    { id: 'step3', message: 'Täter' },
    { id: 'step4', message: 'Zugangsberechtigung erhöhen' },
    { id: 'step5', message: 'Step5' },
    { id: 'step6', message: 'Standort Lokalisieren' },
    { id: 'step7', message: 'Bombe entschärfen' },
];


const modal = document.getElementById('step_modal');
const modal_checkbox = document.getElementById("step_modal_checkbox");

document.addEventListener('DOMContentLoaded', () => {    
    updateProgressBar();
    setStepClickEvent();
});

function updateProgressBar(){
    var steps = document.querySelectorAll('.steps .step');
    
    for(var i = 0; i < steps.length; i++){
        if ( i < currentStep+1){
            steps[i].classList.add('step-primary', 'text-primary');
            steps[i].textContent = stepsNames[i].message;
        }else{
            steps[i].classList.remove('step-primary', 'text-primary');
            steps[i].textContent = "? ? ?";
            console.log(steps[i]);
        }
    }
}

function setStepClickEvent(){
    stepsNames.forEach((step, index) => {
        const element = document.getElementById(step.id);
        if(index < currentStep){
            // Klickbar
            element.addEventListener('click', () => {
                // Öffne das Modal
                modal_checkbox.checked = true;
                
                // Füge das spezifische Template ein
                const modalContent = modal.querySelector('.modal-box');
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
                modal_checkbox.checked = true;
                
                // Füge das spezifische Template ein
                const modalContent = modal.querySelector('.modal-box');
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

function initStep(){
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
            break;
        case 6:
            initColorPicker();
            break;
        default:
            break;
    }
}

// Step 1:
function checkStepInput(){
    
}