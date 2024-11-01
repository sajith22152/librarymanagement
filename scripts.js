// IndexedDB initialization
let db;
const DB_NAME = 'LibraryDB';
const DB_VERSION = 1;
const STORE_NAME = 'books';

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = (event) => {
    console.error("Database error: " + event.target.error);
};

request.onupgradeneeded = (event) => {
    db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'accessionNo' });
        store.createIndex('bookName', 'bookName', { unique: false });
    }
};

request.onsuccess = (event) => {
    db = event.target.result;
    loadBooks();
};

// Form handling
const acquisitionForm = document.getElementById('acquisitionForm');
let currentAccessionNo = null;

acquisitionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const bookData = {
        accessionNo: document.getElementById('acquisitionNumber').value,
        entryDate: document.getElementById('dateEntry').value,
        classNo: document.getElementById('classNumber').value,
        bookName: document.getElementById('bookTitle').value,
        publisher: document.getElementById('publisher').value,
        publishDate: document.getElementById('publicationDate').value,
        pages: document.getElementById('pages').value,
        price: document.getElementById('price').value,
        medium: document.getElementById('medium').value,
        withdrawDate: document.getElementById('dateReturn').value,
        notes: document.getElementById('notes').value,
        studentName: document.getElementById('studentName').value,
        studentClass: document.getElementById('studentClass').value,
        borrowDate: document.getElementById('borrowDate').value,
        returnDate: document.getElementById('dueDate').value
    };

    if (currentAccessionNo) {
        updateBook(bookData);
    } else {
        saveBook(bookData);
    }
});

// Save new book
function saveBook(bookData) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.add(bookData);
    
    request.onsuccess = () => {
        alert('පොත සාර්ථකව ඇතුලත් කරන ලදී');
        acquisitionForm.reset();
        loadBooks();
    };
    
    request.onerror = () => {
        alert('දෝෂයකි: පරිග්‍රහණ අංකය දැනටමත් පවතී');
    };
}

// Update existing book
function updateBook(bookData) {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put(bookData);
    
    request.onsuccess = () => {
        alert('පොත සාර්ථකව යාවත්කාලීන කරන ලදී');
        acquisitionForm.reset();
        currentAccessionNo = null;
        loadBooks();
    };
}

// Load books to table
function loadBooks() {
    const tbody = document.querySelector('#acquisitionTableBody');
    tbody.innerHTML = '';
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();
    
    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cursor.value.accessionNo}</td>
                <td>${cursor.value.bookName}</td>
                <td>${cursor.value.publisher}</td>
                <td>${cursor.value.price}</td>
                <td>${cursor.value.studentName || '-'}</td>
                <td>${cursor.value.borrowDate || '-'}</td>
                <td>${cursor.value.returnDate || '-'}</td>
                <td>
                    <button onclick="editBook('${cursor.value.accessionNo}')">සංස්කරණය</button>
                    <button onclick="deleteBook('${cursor.value.accessionNo}')">මකන්න</button>
                </td>
            `;
            tbody.appendChild(tr);
            cursor.continue();
        }
    };
}

// Edit book
function editBook(accessionNo) {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(accessionNo);
    
    request.onsuccess = () => {
        const book = request.result;
        currentAccessionNo = accessionNo;
        
        document.getElementById('acquisitionNumber').value = book.accessionNo;
        document.getElementById('dateEntry').value = book.entryDate;
        document.getElementById('classNumber').value = book.classNo;
        document.getElementById('bookTitle').value = book.bookName;
        document.getElementById('publisher').value = book.publisher;
        document.getElementById('publicationDate').value = book.publishDate;
        document.getElementById('pages').value = book.pages;
        document.getElementById('price').value = book.price;
        document.getElementById('medium').value = book.medium;
        document.getElementById('dateReturn').value = book.withdrawDate;
        document.getElementById('notes').value = book.notes;
        document.getElementById('studentName').value = book.studentName;
        document.getElementById('studentClass').value = book.studentClass;
        document.getElementById('borrowDate').value = book.borrowDate;
        document.getElementById('dueDate').value = book.returnDate;
    };
}

// Delete book
function deleteBook(accessionNo) {
    if (confirm('ඔබට මෙම පොත මැකීමට අවශ්‍ය බව විශ්වාසද?')) {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(accessionNo);
        
        request.onsuccess = () => {
            alert('පොත සාර්ථකව මකා දමන ලදී');
            loadBooks();
        };
    }
}

// Search functionality
function searchRecords() {
    const searchTerm = document.getElementById('searchBox').value.toLowerCase();
    const tbody = document.querySelector('#acquisitionTableBody');
    tbody.innerHTML = '';
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.openCursor();
    
    request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
            const book = cursor.value;
            if (book.accessionNo.toLowerCase().includes(searchTerm) || 
                book.bookName.toLowerCase().includes(searchTerm) ||
                (book.studentName && book.studentName.toLowerCase().includes(searchTerm))) {
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${book.accessionNo}</td>
                    <td>${book.bookName}</td>
                    <td>${book.publisher}</td>
                    <td>${book.price}</td>
                    <td>${book.studentName || '-'}</td>
                    <td>${book.borrowDate || '-'}</td>
                    <td>${book.returnDate || '-'}</td>
                    <td>
                        <button onclick="editBook('${book.accessionNo}')">සංස්කරණය</button>
                        <button onclick="deleteBook('${book.accessionNo}')">මකන්න</button>
                    </td>
                `;
                tbody.appendChild(tr);
            }
            cursor.continue();
        }
    };
}

// Print functionality
function printRecords() {
    window.print();
}

// Backup and Restore functionality
function backupData() {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
        const data = request.result;
        const dataStr = JSON.stringify(data);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportLink = document.createElement('a');
        exportLink.setAttribute('href', dataUri);
        exportLink.setAttribute('download', `library_backup_${new Date().toISOString().split('T')[0]}.json`);
        exportLink.click();
    };
}

function restoreData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (confirm('මෙම ක්‍රියාව මගින් දැනට ඇති සියලුම දත්ත මකා දැමෙනු ඇත. ඔබට විශ්වාසද?')) {
                    const transaction = db.transaction([STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(STORE_NAME);
                    
                    store.clear().onsuccess = () => {
                        data.forEach(book => store.add(book));
                        loadBooks();
                    };
                }
            } catch (error) {
                alert('අවලංගු backup ගොනුවකි');
            }
        };
        reader.readAsText(file);
    }
}
