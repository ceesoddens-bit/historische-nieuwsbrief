const DEFAULT_ARTICLES = [
    {
        id: "1",
        title: "De Mysterieuze Resten van de Romeinse Brug",
        image: "",
        content: "De Romeinen bouwden een iconische brug over de Maas. Duizenden jaren later worden bij toeval tijdens baggerwerkzaamheden eeuwenoude houten pilaren ontdekt die de fundamenten blijken te zijn van dit imposante bouwwerk.\n\nDeze ontdekking werpt een nieuw licht op de strategische positie van Maastricht als 'Mosa Trajectum'. Archeologen spreken van een ongeëvenaarde vondst in West-Europa die de handel en mobiliteit van de Romeinse legioenen illustreert."
    },
    {
        id: "2",
        title: "Geheimen van de Helpoort en de Eerste Stadsmuur",
        image: "",
        content: "De Helpoort, de oudste nog bestaande stadspoort van Nederland, verbergt vele middeleeuwse geheimen. De poort werd gebouwd kort nadat Hendrik I van Brabant in 1229 toestemming gaf om de stad te omwallen.\n\nMaar wat gebeurde er achter de dikke stenen muren? Nieuw onderzoek toont aan dat de poort veel meer was dan een verdedigingswerk. Het deed dienst als ontmoetingsplaats, en later zelfs als opslag voor kruit. Luister naar de fluisterende wind en herbeleef de vroege verdediging van de stad."
    },
    {
        id: "3",
        title: "Sint Servaas: De Eerste Bisschop van Nederland",
        image: "",
        content: "Sint Servaas reisde in de vierde eeuw naar Maastricht en veranderde voor altijd de loop van de lokale en nationale geschiedenis. Als beschermheilige van de stad groeide zijn graf uit tot een pelgrimsoord van onschatbare waarde.\n\nVan de opgravingen onder de huidige Onze-Lieve-Vrouwebasiliek tot de verhalen en mythen; wie was deze charismatische leider werkelijk? Een diepgaande duik in de vroegchristelijke wortels van Nederland."
    }
];

function getArticles() {
    let articles = localStorage.getItem("hn_articles");
    if (!articles) {
        localStorage.setItem("hn_articles", JSON.stringify(DEFAULT_ARTICLES));
        return DEFAULT_ARTICLES;
    }
    return JSON.parse(articles);
}

function saveArticles(articles) {
    try {
        localStorage.setItem("hn_articles", JSON.stringify(articles));
        return true;
    } catch (e) {
        console.error("Storage error:", e);
        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            alert("Fout: Je hebt de limiet van je browseropslag bereikt (ca. 5MB). Verwijder eerst wat oude artikelen met grote foto's.");
        } else {
            alert("Er ging iets mis bij het opslaan van deze data.");
        }
        return false;
    }
}

function addArticle(article) {
    const articles = getArticles();
    articles.push({
        id: Date.now().toString(),
        ...article
    });
    return saveArticles(articles);
}

function updateArticle(id, updatedData) {
    const articles = getArticles();
    const index = articles.findIndex(a => a.id === id);
    if (index !== -1) {
        articles[index] = { ...articles[index], ...updatedData };
        return saveArticles(articles);
    }
    return false;
}

function deleteArticle(id) {
    const articles = getArticles();
    const updated = articles.filter(a => a.id !== id);
    saveArticles(updated);
}

function reorderArticles(newOrderIds) {
    const articles = getArticles();
    const ordered = newOrderIds.map(id => articles.find(a => a.id === id)).filter(Boolean);
    saveArticles(ordered);
}

// Generates the correct aesthetic for index.html dynamically
function renderIndexList() {
    const section = document.getElementById('index-article-section');
    if (!section) return;
    
    section.innerHTML = '';
    const articles = getArticles();
    
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

// Generates the simple aesthetic list for admin.html dynamically
function renderAdminList() {
    const list = document.getElementById('admin-article-list');
    if (!list) return;
    
    list.innerHTML = '';
    const articles = getArticles();
    
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
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('Weet je zeker dat je dit artikel wilt verwijderen?')) {
                deleteArticle(id);
                renderAdminList(); // Refresh list immediately
            }
        });
    });
}
