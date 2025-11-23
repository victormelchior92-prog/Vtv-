
/**
 * VTV STREAMING - Vanilla JS Implementation
 * Generated automatically.
 * No Frameworks. No NPM. Just Pure Code.
 */

// --- STATE MANAGEMENT ---
const store = {
    user: null,
    content: [],
    categories: [],
    suggestions: [],
    view: 'AUTH', // AUTH, ADMIN, USER
    activeTab: 'CONTENT', // For Admin
    searchQuery: '',
    heroIndex: 0,
    API_KEY: '', // User needs to set this for Gemini
};

// --- CONSTANTS ---
const PLANS = {
    'BASIC': { price: "5 500 FCA", name: "Basic" },
    'STANDARD': { price: "10 500 FCA", name: "Standard" },
    'PREMIUM': { price: "15 000 FCA", name: "Premium" },
};
const ADMIN_EMAIL = "victormelchior92@gmail.com";
const ADMIN_PIN = "2008";

// --- STORAGE SERVICE (Local Storage) ---
const db = {
    get: (key, def) => { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; },
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
    loadAll: () => {
        store.users = db.get('vtv_users', []);
        store.content = db.get('vtv_content', []);
        store.categories = db.get('vtv_categories', []);
        store.suggestions = db.get('vtv_suggestions', []);
        store.theme = db.get('vtv_theme', 'DEFAULT');
        
        // Check Session
        const savedUser = localStorage.getItem('vtv_current_user');
        if (savedUser) {
            const u = JSON.parse(savedUser);
            // Refresh from DB to get latest status
            const fresh = store.users.find(user => user.id === u.id);
            if (fresh) store.user = fresh;
            // Admin check
            if (u.email === ADMIN_EMAIL || u.id === 'admin-preview') {
                store.user = u; // Keep mock admin
            }
        }
    }
};

// --- CORE RENDER FUNCTION ---
const app = document.getElementById('app');

function render() {
    // Determine View
    if (!store.user) {
        renderAuth();
    } else if (store.user.email === ADMIN_EMAIL && store.user.id !== 'admin-preview') {
        renderAdmin();
    } else {
        renderUser();
    }
    // Re-initialize icons
    if(window.lucide) lucide.createIcons();
}

// --- VIEW: AUTHENTICATION ---
function renderAuth() {
    app.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=2069')] bg-cover bg-center relative">
            <div class="absolute inset-0 bg-black/80"></div>
            <div class="relative z-10 w-full max-w-md">
                <div class="text-center mb-8">
                    <h1 class="text-6xl font-black text-red-600 tracking-tighter mb-2 logo-shine">VTV</h1>
                    <p class="text-xl font-light text-gray-300">Premium Streaming</p>
                </div>
                
                <div class="bg-neutral-900/90 backdrop-blur-xl p-8 rounded-2xl border border-neutral-800 shadow-2xl">
                    <div id="auth-forms">
                        <!-- Forms injected here -->
                    </div>
                </div>
                
                <div class="mt-4 text-center">
                    <button onclick="toggleAdminLogin()" class="text-xs text-neutral-500 hover:text-white uppercase tracking-widest">Admin Access</button>
                </div>
            </div>
        </div>
    `;
    showLoginForm();
}

function showLoginForm() {
    const container = document.getElementById('auth-forms');
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-2">Connexion</h2>
        <form onsubmit="handleLogin(event)" class="space-y-4">
            <input id="email" type="email" placeholder="Email" class="w-full p-3 bg-black border border-neutral-700 rounded text-white" required>
            <input id="password" type="password" placeholder="Mot de passe" class="w-full p-3 bg-black border border-neutral-700 rounded text-white" required>
            <button type="submit" class="w-full py-3 bg-[#00CEC8] text-black font-bold rounded hover:bg-[#00b5b0]">Se connecter</button>
        </form>
        <p class="mt-4 text-center text-sm text-neutral-400">Nouveau ? <a href="#" onclick="showRegisterForm()" class="text-[#00CEC8]">Créer un compte</a></p>
    `;
}

function showRegisterForm() {
    const container = document.getElementById('auth-forms');
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-2">Inscription</h2>
        <form onsubmit="handleRegister(event)" class="space-y-4">
            <input id="reg-name" type="text" placeholder="Nom complet" class="w-full p-3 bg-black border border-neutral-700 rounded text-white" required>
            <input id="reg-email" type="email" placeholder="Email" class="w-full p-3 bg-black border border-neutral-700 rounded text-white" required>
            <input id="reg-pass" type="password" placeholder="Mot de passe (min 6 chars)" class="w-full p-3 bg-black border border-neutral-700 rounded text-white" required>
            <button type="submit" class="w-full py-3 bg-[#00CEC8] text-black font-bold rounded hover:bg-[#00b5b0]">S'inscrire</button>
        </form>
        <p class="mt-4 text-center text-sm text-neutral-400">Déjà membre ? <a href="#" onclick="showLoginForm()" class="text-[#00CEC8]">Se connecter</a></p>
    `;
}

function toggleAdminLogin() {
    const container = document.getElementById('auth-forms');
    container.innerHTML = `
        <h2 class="text-2xl font-bold mb-2 text-[#00CEC8]">Admin Access</h2>
        <form onsubmit="handleAdminAuth(event)" class="space-y-4">
            <input id="admin-email" type="email" placeholder="Admin Email" class="w-full p-3 bg-black border border-neutral-700 rounded text-white" required>
            <input id="admin-pin" type="password" placeholder="PIN" maxlength="4" class="w-full p-3 bg-black border border-neutral-700 rounded text-white" required>
            <button type="submit" class="w-full py-3 bg-[#00CEC8] text-black font-bold rounded hover:bg-[#00b5b0]">Unlock Dashboard</button>
        </form>
        <p class="mt-4 text-center text-sm"><a href="#" onclick="showLoginForm()" class="text-neutral-500">Retour client</a></p>
    `;
}

// --- AUTH HANDLERS ---
window.handleLogin = (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    const user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user && user.password === pass) {
        store.user = user;
        localStorage.setItem('vtv_current_user', JSON.stringify(user));
        render();
    } else {
        alert("Email ou mot de passe incorrect");
    }
};

window.handleRegister = (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;

    if(store.users.find(u => u.email === email)) return alert("Email déjà utilisé");
    
    const newUser = {
        id: crypto.randomUUID(),
        name, email, password: pass,
        status: 'GUEST',
        dateJoined: new Date().toISOString(),
        plan: null
    };
    
    store.users.push(newUser);
    db.set('vtv_users', store.users);
    store.user = newUser;
    localStorage.setItem('vtv_current_user', JSON.stringify(newUser));
    render();
};

window.handleAdminAuth = (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const pin = document.getElementById('admin-pin').value;
    if (email === ADMIN_EMAIL && pin === ADMIN_PIN) {
        const adminUser = { id: 'admin', name: 'Admin', email: ADMIN_EMAIL, isAdmin: true };
        store.user = adminUser;
        localStorage.setItem('vtv_current_user', JSON.stringify(adminUser));
        render();
    } else {
        alert("Accès refusé");
    }
};

window.logout = () => {
    store.user = null;
    localStorage.removeItem('vtv_current_user');
    render();
};

// --- VIEW: ADMIN DASHBOARD ---
function renderAdmin() {
    app.innerHTML = `
        <div class="min-h-screen flex bg-neutral-900 text-white">
            <!-- Sidebar -->
            <aside class="w-64 bg-black border-r border-neutral-800 flex flex-col">
                <div class="p-6 border-b border-neutral-800">
                    <h1 class="text-2xl font-black text-[#00CEC8] logo-shine">VTV ADMIN</h1>
                </div>
                <nav class="flex-1 p-4 space-y-2">
                    <button onclick="setAdminTab('CONTENT')" class="${store.activeTab === 'CONTENT' ? 'bg-[#00CEC8] text-black' : 'text-neutral-400 hover:bg-neutral-800'} w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-bold">
                        <i data-lucide="film"></i> <span>Contenu</span>
                    </button>
                    <button onclick="setAdminTab('USERS')" class="${store.activeTab === 'USERS' ? 'bg-[#00CEC8] text-black' : 'text-neutral-400 hover:bg-neutral-800'} w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-bold">
                        <i data-lucide="users"></i> <span>Abonnés</span>
                    </button>
                     <button onclick="setAdminTab('REQUESTS')" class="${store.activeTab === 'REQUESTS' ? 'bg-[#00CEC8] text-black' : 'text-neutral-400 hover:bg-neutral-800'} w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-bold">
                        <i data-lucide="message-square"></i> <span>Demandes</span>
                    </button>
                </nav>
                <div class="p-4">
                    <button onclick="logout()" class="w-full py-2 text-neutral-500 hover:text-white flex items-center justify-center gap-2"><i data-lucide="log-out"></i> Déconnexion</button>
                </div>
            </aside>

            <!-- Main -->
            <main class="flex-1 p-8 overflow-y-auto h-screen">
                <div id="admin-content">
                    <!-- Dynamic Tab Content -->
                </div>
            </main>
        </div>
    `;
    renderAdminTabContent();
}

window.setAdminTab = (tab) => {
    store.activeTab = tab;
    render(); // Re-render whole admin view to update classes
};

function renderAdminTabContent() {
    const container = document.getElementById('admin-content');
    
    if (store.activeTab === 'CONTENT') {
        container.innerHTML = `
            <div class="flex justify-between mb-6">
                <h2 class="text-3xl font-bold">Bibliothèque</h2>
                <button onclick="toggleAddModal(true)" class="bg-[#00CEC8] text-black px-4 py-2 rounded font-bold flex items-center gap-2"><i data-lucide="plus"></i> Ajouter</button>
            </div>
            
            <!-- Add Content Modal (Hidden by default) -->
            <div id="add-modal" class="hidden fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div class="bg-neutral-900 p-6 rounded-xl w-full max-w-2xl border border-neutral-700 max-h-[90vh] overflow-y-auto">
                    <h3 class="text-xl font-bold mb-4">Ajouter un Film/Série</h3>
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <input id="new-title" placeholder="Titre" class="bg-black border border-neutral-700 p-2 rounded w-full">
                        <select id="new-type" class="bg-black border border-neutral-700 p-2 rounded w-full">
                            <option value="MOVIE">Film</option>
                            <option value="SERIES">Série</option>
                            <option value="ANIME">Animé</option>
                        </select>
                    </div>
                    <div class="mb-4">
                         <input id="new-poster" placeholder="URL Affiche (Poster)" class="bg-black border border-neutral-700 p-2 rounded w-full mb-2">
                         <input id="new-video" placeholder="URL Vidéo (MP4/WebM)" class="bg-black border border-neutral-700 p-2 rounded w-full mb-2">
                         <textarea id="new-desc" placeholder="Synopsis" class="bg-black border border-neutral-700 p-2 rounded w-full h-24"></textarea>
                    </div>
                    <div class="flex justify-end gap-2">
                        <button onclick="toggleAddModal(false)" class="px-4 py-2 text-neutral-400">Annuler</button>
                        <button onclick="saveContent()" class="px-4 py-2 bg-[#00CEC8] text-black font-bold rounded">Enregistrer</button>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                ${store.content.map(item => `
                    <div class="bg-neutral-800 rounded-lg overflow-hidden group relative">
                        <img src="${item.posterUrl}" class="w-full h-48 object-cover">
                        <div class="p-4">
                            <h3 class="font-bold truncate">${item.title}</h3>
                            <p class="text-xs text-neutral-400">${item.type}</p>
                        </div>
                        <button onclick="deleteContent('${item.id}')" class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="trash-2"></i></button>
                    </div>
                `).join('')}
                ${store.content.length === 0 ? '<p class="col-span-3 text-center text-neutral-500 py-10">Aucun contenu.</p>' : ''}
            </div>
        `;
    } else if (store.activeTab === 'USERS') {
        container.innerHTML = `
            <h2 class="text-3xl font-bold mb-6">Gestion Abonnements</h2>
            <div class="bg-neutral-800 rounded-xl overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-black text-xs uppercase"><tr><th class="p-4">Nom</th><th class="p-4">Plan</th><th class="p-4">Status</th><th class="p-4 text-right">Action</th></tr></thead>
                    <tbody>
                        ${store.users.map(u => `
                            <tr class="border-t border-neutral-700">
                                <td class="p-4">
                                    <div class="font-bold">${u.name}</div>
                                    <div class="text-xs text-neutral-500">${u.email}</div>
                                </td>
                                <td class="p-4">${u.plan || 'Aucun'}</td>
                                <td class="p-4">
                                    <span class="px-2 py-1 rounded text-xs font-bold ${u.status === 'ACTIVE' ? 'bg-green-900 text-green-500' : 'bg-yellow-900 text-yellow-500'}">
                                        ${u.status}
                                    </span>
                                </td>
                                <td class="p-4 text-right">
                                    ${u.status !== 'ACTIVE' ? `
                                        <button onclick="activateUser('${u.id}')" class="bg-[#00CEC8] text-black px-3 py-1 rounded text-xs font-bold">ACTIVER</button>
                                    ` : `
                                        <button onclick="deactivateUser('${u.id}')" class="text-red-500 text-xs font-bold hover:underline">DÉSACTIVER</button>
                                    `}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } else if (store.activeTab === 'REQUESTS') {
        container.innerHTML = `
            <h2 class="text-3xl font-bold mb-6">Demandes Clients</h2>
            <div class="space-y-4">
                ${store.suggestions.map(s => `
                    <div class="bg-neutral-800 p-4 rounded flex justify-between items-center">
                        <div>
                            <h4 class="font-bold">${s.movieName}</h4>
                            <p class="text-sm text-neutral-400">Demandé par ${s.userName}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="deleteSuggestion('${s.id}')" class="text-red-500 hover:text-white"><i data-lucide="trash"></i></button>
                        </div>
                    </div>
                `).join('')}
                ${store.suggestions.length === 0 ? '<p class="text-neutral-500">Aucune demande.</p>' : ''}
            </div>
        `;
    }
}

// --- ADMIN LOGIC ---
window.toggleAddModal = (show) => {
    document.getElementById('add-modal').classList.toggle('hidden', !show);
};

window.saveContent = () => {
    const title = document.getElementById('new-title').value;
    const type = document.getElementById('new-type').value;
    const poster = document.getElementById('new-poster').value || "https://picsum.photos/300/450";
    const video = document.getElementById('new-video').value;
    const desc = document.getElementById('new-desc').value;
    
    if(!title) return alert("Titre requis");
    
    const newItem = {
        id: crypto.randomUUID(),
        title, type, description: desc,
        posterUrl: poster, videoUrl: video,
        cast: [], genres: [], rating: 'N/A', releaseYear: '2024'
    };
    
    store.content.push(newItem);
    db.set('vtv_content', store.content);
    toggleAddModal(false);
    render();
};

window.deleteContent = (id) => {
    if(confirm("Supprimer ?")) {
        store.content = store.content.filter(c => c.id !== id);
        db.set('vtv_content', store.content);
        render();
    }
};

window.activateUser = (id) => {
    const u = store.users.find(user => user.id === id);
    if(u) {
        u.status = 'ACTIVE';
        u.plan = u.plan || 'PREMIUM'; // Force Premium if null
        u.subscriptionStart = new Date().toISOString();
        u.subscriptionEnd = new Date(Date.now() + 30*24*60*60*1000).toISOString();
        db.set('vtv_users', store.users);
        render();
    }
};

window.deactivateUser = (id) => {
    const u = store.users.find(user => user.id === id);
    if(u) {
        u.status = 'BANNED';
        db.set('vtv_users', store.users);
        render();
    }
};

window.deleteSuggestion = (id) => {
    store.suggestions = store.suggestions.filter(s => s.id !== id);
    db.set('vtv_suggestions', store.suggestions);
    render();
};

// --- VIEW: USER INTERFACE ---
function renderUser() {
    // Determine User View State
    if (store.user.status !== 'ACTIVE') {
        renderGuestView();
        return;
    }

    app.innerHTML = `
        <div class="bg-neutral-950 min-h-screen pb-20">
            <!-- Navbar -->
            <nav class="fixed top-0 w-full z-50 bg-gradient-to-b from-black/90 to-transparent px-6 py-4 flex justify-between items-center">
                <div class="text-3xl font-black text-white logo-shine cursor-pointer" onclick="resetUserView()">VTV</div>
                <div class="flex items-center gap-4">
                    <input type="text" placeholder="Rechercher..." oninput="handleSearch(this.value)" class="bg-black/50 border border-neutral-700 rounded-full px-3 py-1 text-sm text-white focus:border-[#00CEC8] outline-none hidden md:block">
                    <button onclick="openAccountModal()" class="flex items-center gap-2 text-sm font-bold hover:text-[#00CEC8]">
                        <div class="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center overflow-hidden">
                             ${store.user.profileImage ? `<img src="${store.user.profileImage}" class="w-full h-full object-cover">` : '<i data-lucide="user"></i>'}
                        </div>
                        <span class="hidden md:inline">${store.user.name}</span>
                    </button>
                </div>
            </nav>

            <!-- Content Area -->
            <div id="user-content">
                <!-- Injected Dynamically -->
            </div>
            
            <!-- Modals Container -->
            <div id="modal-container"></div>
        </div>
    `;
    
    if (store.searchQuery) {
        renderSearchResults();
    } else {
        renderHome();
    }
}

function renderHome() {
    const container = document.getElementById('user-content');
    const featured = store.content[0]; // Simple hero logic
    
    let html = '';
    
    // Hero Section
    if (featured) {
        html += `
            <header class="relative h-[70vh] flex items-end pb-24 px-6 md:px-12 overflow-hidden">
                <div class="absolute inset-0">
                    <img src="${featured.posterUrl}" class="w-full h-full object-cover opacity-60">
                    <div class="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent"></div>
                </div>
                <div class="relative z-10 max-w-2xl">
                    <span class="bg-[#00CEC8] text-black text-xs font-bold px-2 py-1 rounded mb-4 inline-block">À LA UNE</span>
                    <h1 class="text-5xl font-black mb-4 leading-tight">${featured.title}</h1>
                    <p class="text-lg text-neutral-300 line-clamp-3 mb-8">${featured.description}</p>
                    <button onclick="openPlayer('${featured.id}')" class="px-8 py-3 bg-white text-black font-bold rounded hover:bg-neutral-200 flex items-center gap-2 inline-flex">
                        <i data-lucide="play" class="fill-black"></i> Regarder
                    </button>
                </div>
            </header>
        `;
    } else {
        html += `<div class="h-[50vh] flex items-center justify-center text-neutral-500">Aucun contenu disponible.</div>`;
    }

    // Content Grid
    html += `
        <div class="px-6 md:px-12 -mt-10 relative z-20 space-y-12">
            <div>
                <h3 class="text-xl font-bold mb-4">Ajoutés Récemment</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    ${store.content.map(item => `
                        <div onclick="openPlayer('${item.id}')" class="aspect-[2/3] bg-neutral-800 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 group relative border border-neutral-800 hover:border-[#00CEC8]">
                            <img src="${item.posterUrl}" class="w-full h-full object-cover">
                            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <i data-lucide="play" class="text-white w-12 h-12 fill-white"></i>
                            </div>
                            ${item.type === 'SERIES' ? '<span class="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-1 rounded">SÉRIE</span>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderSearchResults() {
    const container = document.getElementById('user-content');
    const results = store.content.filter(c => c.title.toLowerCase().includes(store.searchQuery.toLowerCase()));
    
    container.innerHTML = `
        <div class="pt-32 px-6 min-h-screen">
            <h2 class="text-2xl font-bold mb-6">Résultats pour "${store.searchQuery}"</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                ${results.map(item => `
                    <div onclick="openPlayer('${item.id}')" class="aspect-[2/3] bg-neutral-800 rounded-lg overflow-hidden cursor-pointer">
                        <img src="${item.posterUrl}" class="w-full h-full object-cover">
                    </div>
                `).join('')}
            </div>
            ${results.length === 0 ? '<p class="text-neutral-500">Aucun résultat.</p>' : ''}
        </div>
    `;
}

// --- USER ACTIONS ---
window.handleSearch = (val) => {
    store.searchQuery = val;
    renderUser();
};

window.resetUserView = () => {
    store.searchQuery = '';
    renderUser();
};

window.openPlayer = (id) => {
    const item = store.content.find(c => c.id === id);
    if(!item) return;
    
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div class="fixed inset-0 z-[60] bg-black flex flex-col">
            <div class="relative flex-1 flex items-center justify-center bg-black">
                <video id="video-player" src="${item.videoUrl}" controls autoplay class="w-full h-full max-h-screen"></video>
                <button onclick="closeModal()" class="absolute top-4 right-4 text-white hover:text-[#00CEC8] bg-black/50 p-2 rounded-full">
                    <i data-lucide="x" class="w-8 h-8"></i>
                </button>
            </div>
            <div class="p-6 bg-neutral-900 border-t border-neutral-800">
                <h2 class="text-2xl font-bold">${item.title}</h2>
                <p class="text-neutral-400 mt-2">${item.description}</p>
            </div>
        </div>
    `;
    lucide.createIcons();
};

window.closeModal = () => {
    document.getElementById('modal-container').innerHTML = '';
};

window.openAccountModal = () => {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div class="bg-neutral-900 w-full max-w-md rounded-2xl border border-neutral-800 p-6 relative">
                <button onclick="closeModal()" class="absolute top-4 right-4 text-neutral-500 hover:text-white"><i data-lucide="x"></i></button>
                
                <div class="text-center mb-6">
                    <div class="w-20 h-20 mx-auto rounded-full bg-neutral-800 mb-2 overflow-hidden">
                        ${store.user.profileImage ? `<img src="${store.user.profileImage}" class="w-full h-full object-cover">` : '<i data-lucide="user" class="w-10 h-10 mt-5 text-neutral-500"></i>'}
                    </div>
                    <h3 class="font-bold text-xl">${store.user.name}</h3>
                    <span class="bg-[#00CEC8] text-black text-xs font-bold px-2 py-0.5 rounded">PREMIUM</span>
                </div>

                <div class="space-y-3">
                    <div class="bg-black p-3 rounded flex justify-between items-center">
                        <span class="text-neutral-400">Plan</span>
                        <span class="font-bold text-white">${store.user.plan || 'Standard'}</span>
                    </div>
                    <div class="bg-black p-3 rounded flex justify-between items-center">
                        <span class="text-neutral-400">Expiration</span>
                        <span class="font-bold text-green-500">${store.user.subscriptionEnd ? new Date(store.user.subscriptionEnd).toLocaleDateString() : 'Active'}</span>
                    </div>
                    
                    <button onclick="logout()" class="w-full py-3 border border-red-900/50 text-red-500 hover:bg-red-900/10 rounded font-bold mt-4">Se déconnecter</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
};

function renderGuestView() {
    app.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center text-center p-6">
            <h1 class="text-5xl font-black mb-4 logo-shine">VTV</h1>
            <h2 class="text-2xl font-bold text-white mb-4">Abonnement Requis</h2>
            <p class="text-neutral-400 max-w-md mb-8">Votre compte est créé mais inactif. Veuillez choisir un plan pour accéder au contenu.</p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-8">
                ${Object.keys(PLANS).map(key => `
                    <div class="bg-neutral-900 p-6 rounded-xl border border-neutral-800 hover:border-[#00CEC8] cursor-pointer transition-all" onclick="selectPlan('${key}')">
                        <h3 class="text-lg font-bold text-white">${PLANS[key].name}</h3>
                        <p class="text-2xl font-bold text-[#00CEC8] my-2">${PLANS[key].price}</p>
                        <button class="w-full py-2 bg-white text-black font-bold rounded mt-4">Choisir</button>
                    </div>
                `).join('')}
            </div>
            <button onclick="logout()" class="text-neutral-500 hover:text-white">Se déconnecter</button>
        </div>
    `;
}

window.selectPlan = (plan) => {
    store.user.plan = plan;
    store.user.status = 'PENDING'; // In real app, show payment modal first
    alert("Plan " + plan + " sélectionné. Veuillez effectuer le paiement Mobile Money au " + "+241 07 40 87 064" + " puis contacter l'admin.");
    db.set('vtv_users', store.users);
    // Normally we wait for admin, but for UX demo we might just reload or show pending screen
    app.innerHTML = `
        <div class="min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div class="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6">
                <i data-lucide="clock" class="text-yellow-500 w-10 h-10"></i>
            </div>
            <h2 class="text-2xl font-bold">En attente de validation</h2>
            <p class="text-neutral-400 mt-2">Votre demande d'abonnement (${plan}) est en cours de traitement.</p>
            <button onclick="logout()" class="mt-8 text-[#00CEC8]">Retour</button>
        </div>
    `;
    lucide.createIcons();
};


// --- INITIALIZATION ---
(function init() {
    console.log("VTV Vanilla Loaded");
    db.loadAll();
    render();
})();
