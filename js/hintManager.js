const hints = [
    // Step 1
    [
        {
            chapterTitle: 'Tatortbericht',
            hints: [
                'Nutze die Datenbank "Tatortbericht", um herauszufinden, was sich bei der Firma Symmex am 27.06. ereignet hat.',
                'SELECT * FROM Tatortbericht WHERE ort = "Symmex";'
            ]
        },
        {
            chapterTitle: 'Zeugenaussage',
            hints: [
                'Nutze die Datenbank "Zeugenaussage", um herauszufinden, was sich am Tatort ereignet hat.',
                'Was weißt du bereits über den Tatort? Wer war der Ermittler und wann ist die Tat geschehen?',
                'Suche mithilfe eines Select-Befehls nach dem Ermittler "Alexander Wolf" und dem Datum "27.06.2024".',
                'SELECT * FROM Zeugenaussage WHERE Ermittler = "Alexander Wolf" AND Datum = "27.06.2024";'
            ]
        }
    ],
    // Step 2
    [
        {
            chapterTitle: 'Einloggen',
            hints: [
                'Als Gast hast du keinen Zugriff auf alle Daten, vielleicht solltest du dich einloggen.',
                'Auf dem Computerbildschirm klebt ein Aufkleber mit den Zahlen "204-03". Wo hast du diese schon mal gesehen?',
                'Finde heraus, wem der Arbeitsplatz "204-03" gehört und melde dich mit seinem Namen und dem am Computerbildschirm hängenden Passwort an.',
                'SELECT name FROM Mitarbeiter WHERE Arbeitsplatz = "204-03";'
            ]
        }
    ],
    // Step 3
    [
        {
            chapterTitle: 'Türprotokoll',
            hints: [
                'Vielleicht kannst du mithilfe des Türprotokolls herausfinden, wer den Raum 404 am Tag der Tat besucht hat.',
                'Eine Zeugin sagt etwas davon, dass eine verdächtige Person den Raum 404 am 27.06.24 sehr häufig besucht hätte. Vielleicht kannst du mit der Datenbank "Türprotokoll" herausfinden, um welchen Mitarbeiter es sich dabei handelt.',
                'SELECT count(*), * FROM Türprotokoll where Tür_id is "404" GROUP BY mitarbeiter_id;'
            ]
        }
    ],
    // Step 4
    [
        {
            chapterTitle: 'Zugangsberechtigung',
            hints: [
                'Dein Zugangsberechtigung reicht nicht aus, um auf die gesamte Datenbank zuzugreifen. Vielleicht kannst du sie irgendwie updaten?',
                'UPDATE Mitarbeiter SET Zugangsberechtigung = "5" WHERE Name = "Max Brandt";'
            ]
        }
    ],
    // Step 5
    [
        {
            chapterTitle: 'Emails',
            hints: [
                'Nutze die Datenbank "Email", um herauszufinden, was der Täter geplant hat.',
                'Suche nach den Emails, die vom Täter gesendet und empfangen wurden.',
                'SELECT * FROM Email WHERE Absender = "p.huber@symmex.it" or Empfänger = "p.huber@symmex.it";'
            ]
        }
    ],
    // Step 6
    [
        {
            chapterTitle: 'Veranstaltungsort',
            hints: [
                'Nutze die Datenbank "Veranstaltung", um herauszufinden, wo die zweite Bombe platziert wurde. Schau dir dazu nochmal die Informationen aus den Emails der Täter an.',
                'Die Bombe soll an dem Ort hochgehen, wo am 27.06. die meisten Menschen anwesend sind.',
                'SELECT * FROM Veranstaltung WHERE Datum = "27.06.2024" ORDER BY Personenanzahl DESC;'
            ]
        }
    ],
    // Step 7
    [
        {
            chapterTitle: 'Bombe',
            hints: [
                'Nutze die Datenbank "Bombe", um herauszufinden, wie du die Bombe entschärfen kannst.',
                'Schau dir mal den Blueprint der Bombe an, vielleicht kannst du auf diese Weise Informationen erhalten, die dir helfen, die richtige Bombe zu finden.',
                'Suche in der Datenbank "Bombe" die Bombe, mit der Modellnummer, die die Zeichen _74B_0 enthält.',
                'SELECT * FROM Bombe WHERE Modellnummer = "%74B_0";'
            ]
        }
    ]
];

let hintIndex = 0;
let stepIndex = 0;

const hintModalCheckbox = document.getElementById("hint_modal_checkbox");
hintModalCheckbox.checked = false;
const hintModal = document.getElementById("hint_modal");
const hintModalContent = hintModal.querySelector('.modal-box');

document.getElementById("btn_hint").addEventListener('click', () => {
    hintModalCheckbox.checked = true;
    hintModalContent.innerHTML = "";

    const containerDiv = document.createElement("div");
    containerDiv.classList.add("p-5");

    hints[currentStep].forEach(chapter => {
        const chapterTitle = document.createElement("h2");
        chapterTitle.textContent = chapter.chapterTitle;
        chapterTitle.classList.add("text-2xl", "font-bold", "my-4", "flex", "justify-center");

        containerDiv.appendChild(chapterTitle);

        chapter.hints.forEach((hint, index) => {
            const collapseDiv = document.createElement("div");
            collapseDiv.classList.add("collapse", "bg-base-200", "mb-2", "collapse-arrow");

            const input = document.createElement("input");
            input.type = "checkbox";

            const titleDiv = document.createElement("div");
            titleDiv.classList.add("collapse-title", "text-xl", "font-medium");
            titleDiv.textContent = (index === chapter.hints.length - 1) ? "Lösung" : `Tipp ${index + 1}`;

            const contentDiv = document.createElement("div");
            contentDiv.classList.add("collapse-content");
            contentDiv.innerHTML = `<p>${hint}</p>`;

            collapseDiv.appendChild(input);
            collapseDiv.appendChild(titleDiv);
            collapseDiv.appendChild(contentDiv);
            containerDiv.appendChild(collapseDiv);
        });
    });
    hintModalContent.appendChild(containerDiv);
});

function notifyHintManager(newStepIndex) {
    if (newStepIndex !== stepIndex) {
        stepIndex = newStepIndex;
        hintIndex = 0;
    }
}


