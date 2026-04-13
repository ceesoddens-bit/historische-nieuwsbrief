import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc, 
    writeBatch, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyA98pJQz6VkoH3J9Fbkmajh37nHS1bP3Dc",
  authDomain: "historische-nieuwsbrief.firebaseapp.com",
  projectId: "historische-nieuwsbrief",
  storageBucket: "historische-nieuwsbrief.firebasestorage.app",
  messagingSenderId: "782321372",
  appId: "1:782321372:web:875a65cdc02e42496f5619"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

window.uploadImage = async function(file) {
    if (!file) return null;
    try {
        const timestamp = Date.now();
        // Remove spaces and weird chars from filename for safety
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const storageRef = ref(storage, `images/${timestamp}_${safeName}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (e) {
        console.error("Error uploading image to Firebase Storage:", e);
        alert("Fout bij uploaden afbeelding. Check of Storage in Firebase is geactiveerd en de regels goed staan.");
        return null;
    }
};

// Data fetching and mutation functions

window.getArticles = async function() {
    try {
        const q = query(collection(db, "articles"), orderBy("order", "asc"));
        const querySnapshot = await getDocs(q);
        const articles = [];
        querySnapshot.forEach((docSnap) => {
            articles.push({ id: docSnap.id, ...docSnap.data() });
        });
        return articles;
    } catch (error) {
        console.error("Fout bij het ophalen van artikelen:", error);
        return [];
    }
};

window.addArticle = async function(article) {
    try {
        // Bepaal de hoogste order waarde zodat het artikel onderaan komt
        const articles = await window.getArticles();
        const nextOrder = articles.length > 0 ? Math.max(...articles.map(a => a.order || 0)) + 1 : 0;
        
        await addDoc(collection(db, "articles"), {
            ...article,
            order: nextOrder
        });
        return true;
    } catch(e) {
        console.error("Error adding document: ", e);
        return false;
    }
};

window.updateArticle = async function(id, updatedData) {
    try {
        const docRef = doc(db, "articles", id);
        await updateDoc(docRef, updatedData);
        return true;
    } catch (e) {
        console.error("Error updating document: ", e);
        return false;
    }
};

window.deleteArticle = async function(id) {
    try {
        await deleteDoc(doc(db, "articles", id));
        return true;
    } catch (e) {
        console.error("Error deleting document: ", e);
        return false;
    }
}

window.reorderArticles = async function(newOrderIds) {
    try {
        const batch = writeBatch(db);
        newOrderIds.forEach((id, index) => {
            const docRef = doc(db, "articles", id);
            batch.update(docRef, { order: index });
        });
        await batch.commit();
        return true;
    } catch (e) {
        console.error("Error batch updating orders: ", e);
        return false;
    }
}

// Rendering functies

window.renderIndexList = async function() {
    const section = document.getElementById('index-article-section');
    if (!section) return;
    
    section.innerHTML = '<p style="text-align:center; padding: 40px; color: #666;">Artikelen laden...</p>';
    const articles = await window.getArticles();
    section.innerHTML = '';
    
    if (articles.length === 0) {
        section.innerHTML = '<p style="text-align:center; padding: 40px; color: #666;">Geen artikelen gevonden in Firebase.</p>';
        return;
    }
    
    articles.forEach(article => {
        let textPlaceholder = `
                <div class="article-text-1"></div>
                <div class="article-text-2"></div>
                <div class="article-text-3"></div>`;
                
        if (article.content) {
            textPlaceholder = `<p style="margin-bottom:20px; font-size:1.05rem; color:#444;">${article.content.substring(0, 150)}...</p>`;
        }

        const bgStyle = article.image ? `background-image: url('${article.image}'); background-size: cover; background-position: center; border: none;` : '';

        const articleHTML = `
        <article class="article-card">
            <div class="article-image" style="${bgStyle}"></div>
            <div class="article-content">
                <h2 class="article-title-text"><a href="article-detail.html?id=${article.id}">${article.title}</a></h2>
                ${textPlaceholder}
                <a href="article-detail.html?id=${article.id}" class="article-button">Lees meer</a>
            </div>
        </article>
        `;
        section.innerHTML += articleHTML;
    });
}

window.renderAdminList = async function() {
    const list = document.getElementById('admin-article-list');
    if (!list) return;
    
    list.innerHTML = '<div style="padding: 20px; text-align: center;">Laden...</div>';
    const articles = await window.getArticles();
    list.innerHTML = '';
    
    if (articles.length === 0) {
        list.innerHTML = '<div style="padding: 20px; text-align: center;">Geen artikelen. Start met "+ Nieuw Artikel".</div>';
        return;
    }
    
    articles.forEach(article => {
        const div = document.createElement('div');
        div.className = 'draggable-item';
        div.dataset.id = article.id;
        div.innerHTML = `
            <div class="drag-handle" title="Sleep om te verplaatsen">☰</div>
            <a href="article-detail.html?id=${article.id}" class="draggable-title">${article.title}</a>
            <div style="display: flex; gap: 10px;">
                <a href="create-article.html?id=${article.id}" class="article-button" style="padding: 8px 16px; font-size: 0.85rem;">Bewerken</a>
                <button class="article-button delete-btn" data-id="${article.id}" style="padding: 8px 16px; font-size: 0.85rem; background: #dc2626; color: white; border: none; cursor: pointer;">Verwijderen</button>
            </div>
        `;
        list.appendChild(div);
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Weet je zeker dat je dit artikel wilt verwijderen?')) {
                // Toon visueel dat ie bezig is met verwijderen
                e.target.innerText = "Bezig...";
                e.target.style.opacity = "0.5";
                
                await window.deleteArticle(id);
                await window.renderAdminList(); // Refresh list immediately from Firestore
            }
        });
    });
}
