
let currentStep = 3;

const modal = document.getElementById('step_modal');



const steps = [
    { id: 'step1', message: 'step1 wurde geklickt!' },
    { id: 'step2', message: 'step2 wurde geklickt!' },
    { id: 'step3', message: 'step3 wurde geklickt!' },
    { id: 'step4', message: 'step4 wurde geklickt!' },
    { id: 'step5', message: 'step5 wurde geklickt!' },
    { id: 'step6', message: 'step6 wurde geklickt!' },
    { id: 'step7', message: 'step7 wurde geklickt!' },
];

document.addEventListener('DOMContentLoaded', () => {    
    updateProgressBar();
    setStepClickEvent();
});

// Progressbar 
function updateProgressBar(){
    var steps = document.querySelectorAll('.steps .step');
    
    for(var i = 0; i < steps.length; i++){
        if ( i < currentStep+1){
            steps[i].classList.add('step-primary', 'text-primary');
        }else{
            steps[i].classList.remove('step-primary', 'text-primary');
        }
    }
}

function removeClickEvent(){

}

function addClickEvent(){

}

function setStepClickEvent(){
    steps.forEach((step, index) => { // Hier füge ich 'index' als zweites Argument hinzu
        const element = document.getElementById(step.id);
        if(index < currentStep){
            //klickbar aber not editable
        }
        if(index === currentStep){
            //klickbar und editable
            element.addEventListener('click', () => {
                // Öffne das Modal
                modal.showModal();
                
                // Optionale Anpassung des Modalinhalts
                const modalTitle = modal.querySelector('.modal-box h3');
                const modalContent = modal.querySelector('.modal-box p');
                modalTitle.textContent = `Hallo! ${step.message}`;
                modalContent.textContent = `Sie haben Schritt ${index + 1} geklickt.`; // Hier verwende ich den Index
            });
        }
        if(index > currentStep){
            //nicht klickbar
        }
    });
}