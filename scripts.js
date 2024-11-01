// Database configuration and initialization
let db;
let isEditing = false;
let editAcquisitionNumber = null;

const DB_NAME = "LibraryDatabase";
const DB_VERSION = 1;
const STORE_NAME = "acquisitions";

// Initialize IndexedDB
const initDatabase = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "acquisitionNumber" });
            }
        };
    });
};

// Message handling
const showMessage = (message, isSuccess = true) => {
    const messageBox = document.getElementById("messageBox");
    messageBox.textContent = message;
    messageBox.className = `message-box ${isSuccess ? 'success' : 'error'}`;
    messageBox.style.display = "block";

    setTimeout(() => {
        messageBox.style.display = "none";
    }, 3000);
};

// Form handling
const getFormData = () => {
    return {
        acquisitionNumber: document.getElementById("acquisitionNumber").value,
        dateEntry: document.getElementById("dateEntry").value,
        classNumber: document.getElementById("classNumber").value,
        bookTitle: document.getElementById("bookTitle").value,
        publisher: document.getElementById("publisher").value,
        publicationDate: document.getElementById("publicationDate").value,
        pages: document.getElementById("pages").value,
        price: document.getElementById("price").value,
        medium: document.getElementById("medium").value,
        dateReturn: document.getElementById("dateReturn").value,
        notes: document.getElementById("notes").value,
        studentName: document.getElementById("studentName").value,
        studentClass: document.getElementById("studentClass").value,
        borrowDate: document.getElementById("borrowDate").value,
        dueDate: document.getElementById("dueDate").value
    };
};

const resetForm = () => {
    document.getElementById("acquisitionForm").reset();
    isEditing = false;
    editAcquisitionNumber = null;
};

// Database operations
const addOrUpdateEntry = async (entry) => {
    try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        
        await new Promise((resolve, reject) => {
            const request = isEditing ? store.put(entry) : store.add(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        showMessage(isEditing ? "දත්ත යාවත්කාලීන කිරීම සාර්ථකයි!" : "නව දත්ත ඇතුලත් කිරීම සාර්ථකයි!");
        resetForm();
        await displayRecords();
    } catch (error) {
        showMessage("දත්ත සුරැකීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

const deleteEntry = async (acquisitionNumber) => {
    if (!confirm("ඔබට මෙම පොත මකා දැමීමට අවශ්‍ය බව විශ්වාසද?")) {
        return;
    }

    try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        
        await new Promise((resolve, reject) => {
            const request = store.delete(acquisitionNumber);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        showMessage("දත්ත මකා දැමීම සාර්ථකයි!");
        await displayRecords();
    } catch (error) {
        showMessage("දත්ත මකා දැමීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

// Display and UI handling
const createTableRow = (entry) => {
    const row = document.createElement("tr");
    
    // Add main columns
    const mainColumns = [
        "acquisitionNumber",
        "bookTitle",
        "publisher",
        "price",
        "studentName",
        "borrowDate",
        "dueDate"
    ];

    mainColumns.forEach(key => {
        const cell = document.createElement("td");
        cell.textContent = entry[key];
        row.appendChild(cell);
    });

    // Add action buttons
    const actionCell = document.createElement("td");
    actionCell.className = "action-cell";

    // Edit button
    const editButton = document.createElement("button");
    editButton.className = "btn btn-primary";
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.onclick = () => editEntry(entry);
    actionCell.appendChild(editButton);

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-accent";
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.onclick = () => deleteEntry(entry.acquisitionNumber);
    actionCell.appendChild(deleteButton);

    row.appendChild(actionCell);
    return row;
};

const displayRecords = async () => {
    try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        
        const records = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const tableBody = document.getElementById("acquisitionTableBody");
        tableBody.innerHTML = "";
        records.forEach(entry => {
            tableBody.appendChild(createTableRow(entry));
        });
    } catch (error) {
        showMessage("දත්ත පෙන්වීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

const editEntry = (entry) => {
    isEditing = true;
    editAcquisitionNumber = entry.acquisitionNumber;

    // Fill form with entry data
    Object.keys(entry).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = entry[key];
        }
    });

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
};

// Search functionality
const searchRecords = async () => {
    const searchValue = document.getElementById("searchBox").value.toLowerCase();
    
    try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        
        const records = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const filteredRecords = records.filter(entry => 
            Object.values(entry).some(value => 
                String(value).toLowerCase().includes(searchValue)
            )
        );

        const tableBody = document.getElementById("acquisitionTableBody");
        tableBody.innerHTML = "";
        filteredRecords.forEach(entry => {
            tableBody.appendChild(createTableRow(entry));
        });
    } catch (error) {
        showMessage("සෙවීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

// Backup and restore functionality
const backupData = async () => {
    try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        
        const records = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const jsonData = JSON.stringify(records, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `library_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showMessage("Backup සාර්ථකව සිදු විය!");
    } catch (error) {
        showMessage("Backup සිදු කිරීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

const restoreData = async (event) => {
    try {
        const file = event.target.files[0];
        const jsonData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(JSON.parse(e.target.result));
            reader.readAsText(file);
        });

        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        await Promise.all(jsonData.map(item => 
            new Promise((resolve, reject) => {
                const request = store.put(item);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            })
        ));

        showMessage("Backup සාර්ථකව ප්‍රතිස්ථාපනය කරන ලදී!");
        await displayRecords();
    } catch (error) {
        showMessage("Backup ප්‍රතිස්ථාපනයේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

// Print functionality
const printRecords = () => {
    const printWindow = window.open('', '_blank');
    const tableClone = document.querySelector('table').cloneNode(true);
    
    // Remove action buttons from print view
    tableClone.querySelectorAll('.action-cell').forEach(cell => cell.remove());

    const styles = `
        <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
                th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
            }
        </style>
    `;

    printWindow.document.write(`
        <html>
            <head>
                <title>පුස්තකාල වාර්තාව</title>
                ${styles}
            </head>
            <body>
                <h1>පුස්තකාල පොත් ලැයිස්තුව</h1>
                ${tableClone.outerHTML}
            </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.print();
};

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDatabase();
        await displayRecords();
    } catch (error) {
        showMessage("පද්ධතිය ආරම්භ කිරීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
});

document.getElementById("acquisitionForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = getFormData();
    await addOrUpdateEntry(formData);
});

// Add debounce to search
let searchTimeout;
document.getElementById("searchBox").addEventListener("input", (event) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchRecords();
    }, 300);
});// Database configuration and initialization
let db;
let isEditing = false;
let editAcquisitionNumber = null;

const DB_NAME = "LibraryDatabase";
const DB_VERSION = 1;
const STORE_NAME = "acquisitions";

// Initialize IndexedDB
const initDatabase = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "acquisitionNumber" });
            }
        };
    });
};

// Message handling
const showMessage = (message, isSuccess = true) => {
    const messageBox = document.getElementById("messageBox");
    messageBox.textContent = message;
    messageBox.className = `message-box ${isSuccess ? 'success' : 'error'}`;
    messageBox.style.display = "block";

    setTimeout(() => {
        messageBox.style.display = "none";
    }, 3000);
};

// Form handling
const getFormData = () => {
    return {
        acquisitionNumber: document.getElementById("acquisitionNumber").value,
        dateEntry: document.getElementById("dateEntry").value,
        classNumber: document.getElementById("classNumber").value,
        bookTitle: document.getElementById("bookTitle").value,
        publisher: document.getElementById("publisher").value,
        publicationDate: document.getElementById("publicationDate").value,
        pages: document.getElementById("pages").value,
        price: document.getElementById("price").value,
        medium: document.getElementById("medium").value,
        dateReturn: document.getElementById("dateReturn").value,
        notes: document.getElementById("notes").value,
        studentName: document.getElementById("studentName").value,
        studentClass: document.getElementById("studentClass").value,
        borrowDate: document.getElementById("borrowDate").value,
        dueDate: document.getElementById("dueDate").value
    };
};

const resetForm = () => {
    document.getElementById("acquisitionForm").reset();
    isEditing = false;
    editAcquisitionNumber = null;
};

// Database operations
const addOrUpdateEntry = async (entry) => {
    try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        
        await new Promise((resolve, reject) => {
            const request = isEditing ? store.put(entry) : store.add(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        showMessage(isEditing ? "දත්ත යාවත්කාලීන කිරීම සාර්ථකයි!" : "නව දත්ත ඇතුලත් කිරීම සාර්ථකයි!");
        resetForm();
        await displayRecords();
    } catch (error) {
        showMessage("දත්ත සුරැකීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

const deleteEntry = async (acquisitionNumber) => {
    if (!confirm("ඔබට මෙම පොත මකා දැමීමට අවශ්‍ය බව විශ්වාසද?")) {
        return;
    }

    try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        
        await new Promise((resolve, reject) => {
            const request = store.delete(acquisitionNumber);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });

        showMessage("දත්ත මකා දැමීම සාර්ථකයි!");
        await displayRecords();
    } catch (error) {
        showMessage("දත්ත මකා දැමීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

// Display and UI handling
const createTableRow = (entry) => {
    const row = document.createElement("tr");
    
    // Add main columns
    const mainColumns = [
        "acquisitionNumber",
        "bookTitle",
        "publisher",
        "price",
        "studentName",
        "borrowDate",
        "dueDate"
    ];

    mainColumns.forEach(key => {
        const cell = document.createElement("td");
        cell.textContent = entry[key];
        row.appendChild(cell);
    });

    // Add action buttons
    const actionCell = document.createElement("td");
    actionCell.className = "action-cell";

    // Edit button
    const editButton = document.createElement("button");
    editButton.className = "btn btn-primary";
    editButton.innerHTML = '<i class="fas fa-edit"></i>';
    editButton.onclick = () => editEntry(entry);
    actionCell.appendChild(editButton);

    // Delete button
    const deleteButton = document.createElement("button");
    deleteButton.className = "btn btn-accent";
    deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
    deleteButton.onclick = () => deleteEntry(entry.acquisitionNumber);
    actionCell.appendChild(deleteButton);

    row.appendChild(actionCell);
    return row;
};

const displayRecords = async () => {
    try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        
        const records = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const tableBody = document.getElementById("acquisitionTableBody");
        tableBody.innerHTML = "";
        records.forEach(entry => {
            tableBody.appendChild(createTableRow(entry));
        });
    } catch (error) {
        showMessage("දත්ත පෙන්වීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

const editEntry = (entry) => {
    isEditing = true;
    editAcquisitionNumber = entry.acquisitionNumber;

    // Fill form with entry data
    Object.keys(entry).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            element.value = entry[key];
        }
    });

    // Scroll to form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
};

// Search functionality
const searchRecords = async () => {
    const searchValue = document.getElementById("searchBox").value.toLowerCase();
    
    try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        
        const records = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const filteredRecords = records.filter(entry => 
            Object.values(entry).some(value => 
                String(value).toLowerCase().includes(searchValue)
            )
        );

        const tableBody = document.getElementById("acquisitionTableBody");
        tableBody.innerHTML = "";
        filteredRecords.forEach(entry => {
            tableBody.appendChild(createTableRow(entry));
        });
    } catch (error) {
        showMessage("සෙවීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

// Backup and restore functionality
const backupData = async () => {
    try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        
        const records = await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        const jsonData = JSON.stringify(records, null, 2);
        const blob = new Blob([jsonData], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `library_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        showMessage("Backup සාර්ථකව සිදු විය!");
    } catch (error) {
        showMessage("Backup සිදු කිරීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

const restoreData = async (event) => {
    try {
        const file = event.target.files[0];
        const jsonData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(JSON.parse(e.target.result));
            reader.readAsText(file);
        });

        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);

        await Promise.all(jsonData.map(item => 
            new Promise((resolve, reject) => {
                const request = store.put(item);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            })
        ));

        showMessage("Backup සාර්ථකව ප්‍රතිස්ථාපනය කරන ලදී!");
        await displayRecords();
    } catch (error) {
        showMessage("Backup ප්‍රතිස්ථාපනයේ දෝෂයක් ඇති විය: " + error.message, false);
    }
};

// Print functionality
const printRecords = () => {
    const printWindow = window.open('', '_blank');
    const tableClone = document.querySelector('table').cloneNode(true);
    
    // Remove action buttons from print view
    tableClone.querySelectorAll('.action-cell').forEach(cell => cell.remove());

    const styles = `
        <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            @media print {
                th { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
            }
        </style>
    `;

    printWindow.document.write(`
        <html>
            <head>
                <title>පුස්තකාල වාර්තාව</title>
                ${styles}
            </head>
            <body>
                <h1>පුස්තකාල පොත් ලැයිස්තුව</h1>
                ${tableClone.outerHTML}
            </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.print();
};

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDatabase();
        await displayRecords();
    } catch (error) {
        showMessage("පද්ධතිය ආරම්භ කිරීමේ දෝෂයක් ඇති විය: " + error.message, false);
    }
});

document.getElementById("acquisitionForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = getFormData();
    await addOrUpdateEntry(formData);
});

// Add debounce to search
let searchTimeout;
document.getElementById("searchBox").addEventListener("input", (event) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchRecords();
    }, 300);
});