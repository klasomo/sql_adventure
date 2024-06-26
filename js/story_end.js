const flipBook = (elBook) => {
    const pages = elBook.querySelectorAll(".page");
    const totalPages = pages.length;
  
    elBook.style.setProperty("--c", 1); // Setze aktuelle Seite auf 0 (Startseite)
  
    pages.forEach((page, idx) => {
      if(idx === pages.length){
        return;
      }

      page.style.setProperty("--i", idx);

      
      page.addEventListener("click", async (evt) => {
        const curr = evt.target.closest(".back") ? idx : idx + 1;
  
        elBook.style.setProperty("--c", curr);
      });
    });
  };
  
  document.querySelectorAll(".book").forEach(flipBook);

  