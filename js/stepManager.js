document.addEventListener('DOMContentLoaded', () => {
    const steps = [
        { id: 'step1', message: 'step1 wurde geklickt!' },
        { id: 'step2', message: 'step2 wurde geklickt!' },
        { id: 'step3', message: 'step3 wurde geklickt!' },
        { id: 'step4', message: 'step4 wurde geklickt!' },
        { id: 'step5', message: 'step5 wurde geklickt!' },
        { id: 'step6', message: 'step6 wurde geklickt!' },
        { id: 'step7', message: 'step7 wurde geklickt!' },
    ];

    const modal = document.getElementById('step_modal');

    steps.forEach(step => {
        const element = document.getElementById(step.id);

        element.addEventListener('click', () => {
            // Öffne das Modal
            modal.showModal();
            
            // Optionale Anpassung des Modalinhalts
            const modalTitle = modal.querySelector('.modal-box h3');
            const modalContent = modal.querySelector('.modal-box p');
            modalTitle.textContent = `Hallo! ${step.message}`;
            modalContent.textContent = `Sie haben ${step.id} geklickt.`;
        });
    });
});