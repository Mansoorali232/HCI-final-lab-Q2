document.addEventListener('DOMContentLoaded', function () {
  const sections = document.querySelectorAll('.section');
  const bookForm = document.getElementById('bookForm');
  const bookList = document.getElementById('bookList');
  const searchInput = document.getElementById('search');
  const filterStatus = document.getElementById('filterStatus');
  const notification = document.getElementById('notification');
  const progressInput = document.getElementById('progress');
  const progressValue = document.getElementById('progressValue');

  let books = JSON.parse(localStorage.getItem('books')) || [];

  progressInput.addEventListener('input', function () {
    progressValue.textContent = this.value + '%';
  });

  window.showSection = function (id) {
    sections.forEach(section => {
      section.classList.remove('active');
      section.setAttribute('aria-hidden', 'true');
    });

    const activeSection = document.getElementById(id);
    activeSection.classList.add('active');
    activeSection.setAttribute('aria-hidden', 'false');

    if (id === 'view') displayBooks();
    if (id === 'stats') displayStats();
  };

  bookForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const category = document.getElementById('category').value;
    const status = document.getElementById('status').value;
    const progress = parseInt(progressInput.value);

    if (!title || !author) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const newBook = {
      id: Date.now(),
      title,
      author,
      category,
      status,
      progress: status === 'Reading' ? progress : (status === 'Finished' ? 100 : 0),
      addedDate: new Date().toISOString()
    };

    books.push(newBook);
    saveBooks();
    bookForm.reset();
    progressValue.textContent = '0%';
    showNotification('Book added successfully!');
  });

  function displayBooks(filteredBooks = books) {
    bookList.innerHTML = '';

    if (filteredBooks.length === 0) {
      bookList.innerHTML = '<p class="no-books">No books found. Try adjusting your filters.</p>';
      return;
    }

    filteredBooks.forEach(book => {
      const card = document.createElement('div');
      card.className = 'book-card';

      let icon, statusClass;
      switch (book.status) {
        case 'Want to Read':
          icon = 'fa-bookmark';
          statusClass = 'want-to-read';
          break;
        case 'Reading':
          icon = 'fa-book-open';
          statusClass = 'reading';
          break;
        case 'Finished':
          icon = 'fa-check-circle';
          statusClass = 'finished';
          break;
      }

      card.innerHTML = `
        <h3>${book.title}</h3>
        <div class="author">by ${book.author}</div>
        <div class="meta">
          <div class="meta-item">${book.category}</div>
          <div class="meta-item">
            <span class="status-pill status-${statusClass}">
              <i class="fas ${icon}"></i> ${book.status}
            </span>
          </div>
        </div>
        ${book.status === 'Reading' ? `
          <div class="progress-container">
            <div class="progress-bar" style="width: ${book.progress}%"></div>
          </div>
          <div class="progress-text">${book.progress}% complete</div>
        ` : ''}
        <div class="actions">
          <button class="delete-btn" onclick="deleteBook(${book.id})" aria-label="Delete ${book.title}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      `;
      bookList.appendChild(card);
    });
  }

  window.deleteBook = function (id) {
    if (confirm("Are you sure you want to delete this book?")) {
      books = books.filter(book => book.id !== id);
      saveBooks();
      displayBooks(getFilteredBooks());
      displayStats();
      showNotification('Book deleted successfully');
    }
  };

  function displayStats() {
    document.getElementById('totalBooks').textContent = books.length;
    document.getElementById('finishedBooks').textContent = books.filter(b => b.status === 'Finished').length;
    document.getElementById('readingBooks').textContent = books.filter(b => b.status === 'Reading').length;
    document.getElementById('wantBooks').textContent = books.filter(b => b.status === 'Want to Read').length;
    updateProgressChart();
  }

  function updateProgressChart() {
    const chart = document.getElementById('progressChart');
    const total = books.length || 1;
    const finished = books.filter(b => b.status === 'Finished').length;
    const reading = books.filter(b => b.status === 'Reading').length;
    const want = books.filter(b => b.status === 'Want to Read').length;

    const existingChart = chart.querySelector('.chart-bars');
    if (existingChart) existingChart.remove();

    const chartBars = document.createElement('div');
    chartBars.className = 'chart-bars';
    chartBars.style.display = 'flex';
    chartBars.style.height = '30px';
    chartBars.style.borderRadius = '4px';
    chartBars.style.overflow = 'hidden';

    if (finished > 0) {
      const finishedBar = document.createElement('div');
      finishedBar.style.width = `${(finished / total) * 100}%`;
      finishedBar.style.backgroundColor = '#66bb6a';
      chartBars.appendChild(finishedBar);
    }

    if (reading > 0) {
      const readingBar = document.createElement('div');
      readingBar.style.width = `${(reading / total) * 100}%`;
      readingBar.style.backgroundColor = '#5c6bc0';
      chartBars.appendChild(readingBar);
    }

    if (want > 0) {
      const wantBar = document.createElement('div');
      wantBar.style.width = `${(want / total) * 100}%`;
      wantBar.style.backgroundColor = '#ffa726';
      chartBars.appendChild(wantBar);
    }

    chart.insertBefore(chartBars, chart.querySelector('.chart-legend'));
  }

  function getFilteredBooks() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusFilter = filterStatus.value;

    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || book.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  function saveBooks() {
    localStorage.setItem('books', JSON.stringify(books));
    displayStats();
  }

  function showNotification(message, type = 'success') {
    notification.innerHTML = `
      <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
      ${message}
    `;
    notification.className = `notification show ${type}`;

    setTimeout(() => {
      notification.classList.remove('show');
    }, 3000);
  }

  searchInput.addEventListener('input', () => displayBooks(getFilteredBooks()));
  filterStatus.addEventListener('change', () => displayBooks(getFilteredBooks()));

  showSection('add');
});
