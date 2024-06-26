const flipBook = (elBook) => {
  const pages = elBook.querySelectorAll(".page");
  const totalPages = pages.length;

  elBook.style.setProperty("--c", 0); // Setze aktuelle Seite auf 0 (Startseite)

  pages.forEach((page, idx) => {
    page.style.setProperty("--i", idx);
    if (idx === 0) {
      return;
    }

    page.addEventListener("click", async (evt) => {
      const curr = evt.target.closest(".back") ? idx : idx + 1;
      if (curr === totalPages) {
        return;
      }

      elBook.style.setProperty("--c", curr);

      // Überprüfe, ob es sich um die letzte Seite handelt
      if (curr === totalPages - 1) {
        await sleep(1000);
        elBook.style.width = "55vw"; // Setze die Breite des Buches auf 55vh
        await sleep(250);
        window.location.href = "email.html"; // Weiterleitung zur email.html
      }
    });
  });
};

document.querySelectorAll(".book").forEach(flipBook);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Funktion zur Weiterleitung zur nächsten Seite
function goToPage(pageNr) {
  var elBook = document.getElementById("book");
  elBook.style.setProperty("--c", pageNr);
}
