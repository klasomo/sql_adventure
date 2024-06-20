function initDecryption(){
  const t = document.querySelector('.codedText');
  const decryptBtn = document.getElementById("decryptBtn");
  const decrptedMesg = "Diese Nachricht wurde Erfolgreich Entschlüsselt"

  decryptBtn.addEventListener("click", () => {
    if (t) {
      const arr1 = t.value.split('');
      console.log(arr1);
      const arr2 = [];
      arr1.forEach((char, i) => arr2[i] = randChar()); // fill arr2 with random characters

      const tl = gsap.timeline();
      let step = 0;
      tl.fromTo(t, {
        innerHTML: arr2.join(''),
      }, {
        duration: arr1.length / 7, // duration based on text length
        ease: 'power4.in',
        onUpdate: () => {
          const p = Math.floor(tl.progress() * (arr1.length)); // whole number from 0 - text length
          if (step != p) { // throttle the change of random characters
            step = p;
            arr1.forEach((char, i) => arr2[i] = randChar());
            let pt1 = arr1.join('').substring(0, p),
                pt2 = arr2.join('').substring(0, arr2.length - p);
            if (t.classList.contains('fromRight')) {
              pt1 = arr2.join('').substring(0, arr2.length - p);
              pt2 = arr1.join('').substring(0, arr1.length - p);
            }
            t.value = pt1 + pt2; // update text
          }
        }
      });
    }
  });

  function randChar() {
    let c = "abcdefghijklmnopqrstuvwxyz1234567890!@#$^&*()…æ_+-=;[]/~`";
    c = c[Math.floor(Math.random() * c.length)];
    return (Math.random() > 0.5) ? c : c.toUpperCase();
  }
}
