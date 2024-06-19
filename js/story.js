let currentPage = 1;
  const totalPages = 3; // Anzahl der Seiten

  function handleClick(event) {
    const halfWidth = document.querySelector('.book').offsetWidth / 2; // Halbe Breite des Buches
    const clickX = event.clientX - event.target.getBoundingClientRect().left; // Position des Klicks relativ zum Buch

    if (clickX < halfWidth && currentPage > 1) {
      // Klick auf linke Hälfte und es gibt eine vorherige Seite
      currentPage--;
    } else if (clickX >= halfWidth && currentPage < totalPages) {
      // Klick auf rechte Hälfte und es gibt eine nächste Seite
      currentPage++;
    }

    updateBook();
  }

  function updateBook() {
    const book = document.querySelector('.book');
    book.style.transform = `rotateY(${(currentPage - 1) * -120}deg)`; // Berechnung des Rotationswinkels
  }