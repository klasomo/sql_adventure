const flipBook = (elBook) => {
  const pages = elBook.querySelectorAll(".page");
  const totalPages = pages.length;
  
  elBook.style.setProperty("--c", 0); // Set current page

  pages.forEach((page, idx) => {
    page.style.setProperty("--i", idx);

    page.addEventListener("click", (evt) => {
      const curr = evt.target.closest(".back") ? idx : idx + 1;
      elBook.style.setProperty("--c", curr);

      // Check if it's the last page
      if (curr === totalPages) {
        window.location.href = 'email.html';
      }
    });
  });
};

document.querySelectorAll(".book").forEach(flipBook);
