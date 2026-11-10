// ===================================================
// DOM ELEMENTS & GLOBAL VARIABLES
// ===================================================
const titleInput = document.getElementById('title');
const priceInput = document.getElementById('price');
const taxesInput = document.getElementById('taxes');
const adsInput = document.getElementById('ads');
const discountInput = document.getElementById('discount');
const totalDisplay = document.getElementById('totalDisplay');
const totalBar = document.getElementById('totalBar');
const countInput = document.getElementById('count');
const categoryInput = document.getElementById('category');

const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const searchInput = document.getElementById('searchInput');
const searchTitleBtn = document.getElementById('searchTitleBtn');
const searchCategoryBtn = document.getElementById('searchCategoryBtn');
const productsTbody = document.getElementById('productsTbody');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const noDataMessage = document.getElementById('noDataMessage');

// KPIs
const kpiTotalItems = document.getElementById('kpiTotalItems');
const kpiTotalValue = document.getElementById('kpiTotalValue');
const kpiCategoriesCount = document.getElementById('kpiCategoriesCount');

// State Variables
let productList = JSON.parse(localStorage.getItem('products')) || [];
let editIndex = null;
let searchMode = 'title'; // 'title' or 'category'

// ===================================================
// INITIALIZATION
// ===================================================
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    setupEventListeners();
    loadThemePreference();
});

// ===================================================
// EVENT LISTENERS
// ===================================================
function setupEventListeners() {
    // Dynamic Total Calculation
    [priceInput, taxesInput, adsInput, discountInput].forEach(input => {
        input.addEventListener('input', calculateTotal);
    });

    // Main Submit Action
    submitBtn.addEventListener('click', handleProductSubmit);

    // Cancel Edit
    cancelEditBtn.addEventListener('click', resetForm);

    // Search Mode Switchers
    searchTitleBtn.addEventListener('click', () => setSearchMode('title'));
    searchCategoryBtn.addEventListener('click', () => setSearchMode('category'));

    // Realtime Search Input
    searchInput.addEventListener('input', searchProducts);

    // Delete All
    deleteAllBtn.addEventListener('click', deleteAllProducts);

    // Export CSV
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);

    // Theme Switcher
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
}

// ===================================================
// CALCULATION LOGIC
// ===================================================
function calculateTotal() {
    const price = parseFloat(priceInput.value) || 0;
    const taxes = parseFloat(taxesInput.value) || 0;
    const ads = parseFloat(adsInput.value) || 0;
    const discount = parseFloat(discountInput.value) || 0;

    if (price > 0) {
        const result = (price + taxes + ads) - discount;
        totalDisplay.textContent = result.toFixed(2) + ' ج.م';
        
        if (result > 0) {
            totalBar.classList.add('active');
        } else {
            totalBar.classList.remove('active');
        }
        return result;
    } else {
        totalDisplay.textContent = '0.00 ج.م';
        totalBar.classList.remove('active');
        return 0;
    }
}

// ===================================================
// CRUD OPERATIONS
// ===================================================

// 1. Create & Update
function handleProductSubmit() {
    const title = titleInput.value.trim();
    const price = parseFloat(priceInput.value);
    const category = categoryInput.value.trim();

    if (!title || isNaN(price) || !category) {
        showToast('برجاء ملء الخانات الأساسية (الاسم، السعر، القسم)', 'error');
        return;
    }

    const singleTotal = calculateTotal();
    const newProduct = {
        title: title,
        price: price,
        taxes: parseFloat(taxesInput.value) || 0,
        ads: parseFloat(adsInput.value) || 0,
        discount: parseFloat(discountInput.value) || 0,
        total: singleTotal,
        category: category
    };

    if (editIndex === null) {
        // Create Mode (Supports Count)
        const count = parseInt(countInput.value) || 1;
        for (let i = 0; i < count; i++) {
            productList.push({ ...newProduct });
        }
        showToast(`تم إضافة ${count} منتج بنجاح!`);
    } else {
        // Update Mode
        productList[editIndex] = newProduct;
        showToast('تم تعديل بيانات المنتج بنجاح!');
    }

    saveToLocalStorage();
    resetForm();
    renderProducts();
}

// 2. Read & Render
function renderProducts(itemsToRender = productList) {
    productsTbody.innerHTML = '';

    if (itemsToRender.length === 0) {
        noDataMessage.classList.remove('hidden');
    } else {
        noDataMessage.classList.add('hidden');
        itemsToRender.forEach((prod, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${prod.title}</strong></td>
                <td>${prod.price}</td>
                <td>${prod.taxes}</td>
                <td>${prod.ads}</td>
                <td>${prod.discount}</td>
                <td style="color:#d4af37; font-weight:700;">${prod.total.toFixed(2)}</td>
                <td><span style="background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px;">${prod.category}</span></td>
                <td><button onclick="prepareUpdate(${index})" class="btn btn-outline btn-sm">تعديل ✏️</button></td>
                <td><button onclick="deleteSingleProduct(${index})" class="btn btn-danger btn-sm">حذف 🗑️</button></td>
            `;
            productsTbody.appendChild(tr);
        });
    }

    updateKPIs();
    updateDeleteAllButton();
}

// 3. Prepare Update
function prepareUpdate(index) {
    const prod = productList[index];
    titleInput.value = prod.title;
    priceInput.value = prod.price;
    taxesInput.value = prod.taxes;
    adsInput.value = prod.ads;
    discountInput.value = prod.discount;
    categoryInput.value = prod.category;
    
    calculateTotal();
    
    // Hide count input during update
    countInput.parentElement.style.display = 'none';
    
    submitBtn.textContent = 'تحديث البيانات';
    cancelEditBtn.classList.remove('hidden');
    editIndex = index;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 4. Delete Single
function deleteSingleProduct(index) {
    if (confirm('هل أنت تأكد من حذف هذا المنتج؟')) {
        productList.splice(index, 1);
        saveToLocalStorage();
        renderProducts();
        showToast('تم حذف المنتج بنجاح');
    }
}

// 5. Delete All
function deleteAllProducts() {
    if (confirm(`هل أنت تأكد من حذف جميع المنتجات (${productList.length})؟`)) {
        productList = [];
        saveToLocalStorage();
        renderProducts();
        showToast('تم مسح جميع المنتجات');
    }
}

// ===================================================
// SEARCH & FILTER
// ===================================================
function setSearchMode(mode) {
    searchMode = mode;
    if (mode === 'title') {
        searchTitleBtn.classList.add('active');
        searchCategoryBtn.classList.remove('active');
        searchInput.placeholder = 'البحث باسم المنتج...';
    } else {
        searchCategoryBtn.classList.add('active');
        searchTitleBtn.classList.remove('active');
        searchInput.placeholder = 'البحث بالقسم / التصنيف...';
    }
    searchInput.value = '';
    renderProducts();
    searchInput.focus();
}

function searchProducts() {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = productList.filter(prod => {
        if (searchMode === 'title') {
            return prod.title.toLowerCase().includes(query);
        } else {
            return prod.category.toLowerCase().includes(query);
        }
    });
    renderProducts(filtered);
}

// ===================================================
// HELPER FUNCTIONS
// ===================================================
function resetForm() {
    titleInput.value = '';
    priceInput.value = '';
    taxesInput.value = '';
    adsInput.value = '';
    discountInput.value = '';
    countInput.value = '1';
    categoryInput.value = '';
    
    countInput.parentElement.style.display = 'flex';
    submitBtn.textContent = 'إضافة المنتج';
    cancelEditBtn.classList.add('hidden');
    editIndex = null;
    
    calculateTotal();
}

function updateKPIs() {
    kpiTotalItems.textContent = productList.length;
    
    const totalVal = productList.reduce((acc, item) => acc + item.total, 0);
    kpiTotalValue.textContent = totalVal.toFixed(2) + ' ج.م';

    const categories = new Set(productList.map(item => item.category.toLowerCase()));
    kpiCategoriesCount.textContent = categories.size;
}

function updateDeleteAllButton() {
    if (productList.length > 0) {
        deleteAllBtn.textContent = `حذف الكل (${productList.length})`;
        deleteAllBtn.classList.remove('hidden');
    } else {
        deleteAllBtn.classList.add('hidden');
    }
}

function saveToLocalStorage() {
    localStorage.setItem('products', JSON.stringify(productList));
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Export CSV Feature
function exportToCSV() {
    if (productList.length === 0) {
        showToast('لا توجد بيانات للتصدير!', 'error');
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "الاسم,السعر,الضرائب,الإعلانات,الخصم,الإجمالي,القسم\n";

    productList.forEach(p => {
        csvContent += `"${p.title}",${p.price},${p.taxes},${p.ads},${p.discount},${p.total},"${p.category}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Dark / Light Theme Toggle
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}