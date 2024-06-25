let currentEmailStep = 0;
let encryptedValues = {};
let textareaCache = "";
let textInput = ["","",""];
// const encryptedText = [
//   "gK@8?P}@r6$yL4[kS}2mA8c7cg84&2QbDCfMRvhzhaVfFd876qtHU(?2;{HjB6XkrW,n#5g/{kkw?*jW:=aC=ZHPY&V9t@x%b_CWC#D{R&-bgS&)HYWimzK[gn-1yKeG+",
//    "X/aqkWC;StJ!]g/k%ahR3n71(t[]rVq{Hfx#J:ZCASAL)fg_yH:3$M*Gh04JW:0DhVw:J//2XV}#DeX!RyQ7tSxXNexT).7w7}zW/[m#-w1!N%p?B0f#W}-6VttQzinnd3bRg3L@@Pjdx[qU8U6!HirQ[]rf2n3jp:P:,Z]Uvh_&,C]*wVGh1X/qR36Ck4wSrfHyV4mZ3qWkYa}kM0cEKJYLxi3c%c4!:w8633SAL)fg2n3jK", 
//    "CWM&SZ,K_KW.rR2@G.BeT_k!yc$jh;beUeRxD)cB)nyX$uGvQBzgmpn}wKbbH70z(TP1B2TD;4=3LPfzSjhcfBZmhBNeHZCgyA&p;E9VG+VEm/A.KeRy_SAxrw;2bh[4cP314nare.JPAA6]XDY"];
const decryptedText = [
  "Hallo Paul, die Bauteile sollten nun auf dem Weg zu Dir sein. Jetzt muss du noch den Teil deiner Abmachung einhalten. Gruß Sophie",
  "Hallo Paul, wie abgemacht. Die erste Bombe soll in der Firma Symmex platziert werden, die du seit einigen Monaten infiltriert hast. Die zweite Bombe soll an dem Ort hoch gehen, wo an besagtem Tag, die meisten Menschen versammelt sind. Gruß Sophie",
  "Hallo Sophie, die Abmachung steht. Ich habe deine Lieferung zusammengestellt und werde sie am 27.06. ausliefern, sobald ich den Ort erhalte. Viele Grüße Paul",
];
const encryptedText = ["1","2","3"];


function checkIfAllAreDecrypted(){
  console.log("TextInput: ");
  console.log(textInput);
  for(let i = 0; i < encryptedText.length; i++){
    if(textInput[i] != encryptedText[i]){
      return false;
    }
  }
  console.log("all are decrypted");
  return true;
}


function updateEmailProgressbar() {
  console.log("Current Email Step:" + currentEmailStep);
  const email_steps = document.querySelectorAll(".step.email");
  if (email_steps.length > 0) {
    email_steps.forEach((li, index) => {
      if (index == currentEmailStep) {
        li.addEventListener("click", () => {
          enableTextareaAndButton();
          email_title.textContent = li.textContent;
          textarea.value = "";
          console.log(
            "Clicked Email Step " + li.innerHTML + " Index: " + index
          );
        });
        li.classList.add("step-primary");
        textarea.value="";

      }

      if (index < currentEmailStep) {
        li.addEventListener("click", () => {
          disableTextareaAndButton();
          console.log(
            "Clicked Email old Step " + li.innerHTML + " Index: " + index
          );
          textarea.value = decryptedText[index];
          email_title.textContent = li.textContent;
        });
        li.classList.add("step-primary");

      }
    });
  } else {
    console.log("Element mit ID 'email_steps' nicht gefunden.");
  }
}

var decryptBtn, textarea, email_steps,email_title;

function initDecryption() {

  decryptBtn = document.getElementById("decryptBtn");
  textarea = document.getElementById("encryptedText");
  email_steps = document.querySelectorAll(".step.email");
  email_title = document.getElementById("email_title");
  console.log(email_steps);
  const t = document.querySelector(".codedText");
  const decrptedMesg = "Diese Nachricht wurde Erfolgreich Entschlüsselt";


  updateEmailProgressbar();
  email_title.textContent = email_steps[currentEmailStep].textContent;
  enableTextareaAndButton();

  decryptBtn.addEventListener("click", () => {
    if (t) {
      const inputText = t.value.trim(); // den Eingabetext trimmen

      let wasAlreadyDecrypted = false;
      let isValidEncryptedText = false;
      console.log("Text Input");
      console.log(textInput);
      for (let j = 0; j < textInput.length; j++) {
        if (inputText === textInput[j]) {
          console.log("was already once decrypted");
          wasAlreadyDecrypted = true;
          console.log("wasAlreadyDecrypted: "  + wasAlreadyDecrypted);
        }
      }
      for (let i = 0; i < encryptedText.length; i++) {
        if (inputText === encryptedText[i]) {
          isValidEncryptedText = true;
          console.log("isvalidEncryptedText: " + isValidEncryptedText);

          if(isValidEncryptedText && !wasAlreadyDecrypted){
            currentEmailStep++;
            t.value = decryptedText[i];
            textInput[i] = inputText;
          }
        }
      }


      const arr1 = t.value.split("");
      const arr2 = [];
      arr1.forEach((char, i) => (arr2[i] = randChar())); // fill arr2 with random characters

      const tl = gsap.timeline();
      let step = 0;
      tl.fromTo(
        t,
        {
          innerHTML: arr2.join(""),
        },
        {
          duration: arr1.length / 7, // duration based on text length
          ease: "power4.in",
          onUpdate: () => {
            const p = Math.floor(tl.progress() * arr1.length); // whole number from 0 - text length
            if (step != p) {
              // throttle the change of random characters
              step = p;
              arr1.forEach((char, i) => (arr2[i] = randChar()));
              let pt1 = arr1.join("").substring(0, p),
                pt2 = arr2.join("").substring(0, arr2.length - p);
              if (t.classList.contains("fromRight")) {
                pt1 = arr2.join("").substring(0, arr2.length - p);
                pt2 = arr1.join("").substring(0, arr1.length - p);
              }
              t.value = pt1 + pt2; // update text
            }
          },
        }
      );
      if(isValidEncryptedText && !wasAlreadyDecrypted){
        updateEmailProgressbar();
        disableTextareaAndButton();
        if(checkIfAllAreDecrypted()){
          incrementStep(StepIndex.EMAIL);
        }
      }
    }
  });

  function randChar() {
    let c = "abcdefghijklmnopqrstuvwxyz1234567890!@#$^&*()…æ_+-=;[]/~`";
    c = c[Math.floor(Math.random() * c.length)];
    return Math.random() > 0.5 ? c : c.toUpperCase();
  }


}


  // Funktion zum Deaktivieren von Textarea und Decrypt Button
  function disableTextareaAndButton() {
    textarea.disabled = true;
    decryptBtn.disabled = true;
  }

  // Funktion zum Aktivieren von Textarea und Decrypt Button
  function enableTextareaAndButton() {
    textarea.disabled = false;
    decryptBtn.disabled = false;
  }

  // Funktion zum Löschen des Textinhalts der Textarea
  function clearTextarea() {
    textarea.value = "";
  }
