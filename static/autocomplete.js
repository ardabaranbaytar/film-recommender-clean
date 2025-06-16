document.addEventListener("DOMContentLoaded", function () {
    const input = document.getElementById("movie-input");
    const suggestions = document.getElementById("suggestions");
    const favoritesList = document.getElementById("favorites");
    const recommendationList = document.getElementById("recommendation-list");
    const getRecommendationsBtn = document.getElementById("recommend-btn");

    let movies = [];
    let selectedMovies = [];

    // Film listesini yükle
    fetch("/static/movies.json")
        .then(response => {
            if (!response.ok) throw new Error("HTTP error " + response.status);
            return response.json();
        })
        .then(data => {
            movies = data;
            console.log("🎬 Film verisi yüklendi:", movies.slice(0, 5));
        })
        .catch(err => console.error("🚨 JSON yüklenemedi:", err));

    // Autocomplete işlemi
    input.addEventListener("input", function () {
        const query = input.value.toLowerCase();
        suggestions.innerHTML = "";

        if (query.length < 2) return;

        const filtered = movies
            .filter(movie => movie.title.toLowerCase().includes(query))
            .slice(0, 5);

        filtered.forEach(movie => {
            const li = document.createElement("li");
            li.textContent = movie.title;
            li.classList.add("suggestion-item");

            li.addEventListener("click", () => {
                const selectedTitle = movie.title;

                if (!selectedMovies.includes(selectedTitle)) {
                    selectedMovies.push(selectedTitle);
                    updateFavoritesList();
                }

                input.value = "";
                suggestions.innerHTML = "";
            });

            suggestions.appendChild(li);
        });
    });

    // Favori film listesini güncelle
    function updateFavoritesList() {
        favoritesList.innerHTML = "";
        selectedMovies.forEach(title => {
            const li = document.createElement("li");
            li.textContent = title;
            favoritesList.appendChild(li);
        });
    }

    // Önerileri getir
    getRecommendationsBtn.addEventListener("click", () => {
        if (selectedMovies.length === 0) {
            alert("Lütfen en az bir favori film seçin.");
            return;
        }

        fetch("/recommend", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ favorites: selectedMovies })
        })
        .then(response => {
            if (!response.ok) throw new Error("Sunucu hatası: " + response.status);
            return response.json();
        })
        .then(data => {
            console.log("🎯 Önerilen filmler:", data.recommendations);

            recommendationList.innerHTML = "";

            if (data.recommendations && data.recommendations.length > 0) {
                data.recommendations.forEach(title => {
                    const li = document.createElement("li");
                    li.textContent = title;
                    recommendationList.appendChild(li);
                });
            } else {
                const li = document.createElement("li");
                li.textContent = "Hiç öneri bulunamadı.";
                recommendationList.appendChild(li);
            }
        })
        .catch(err => {
            console.error("🚨 Öneri alınırken hata:", err);
            recommendationList.innerHTML = "";
            const li = document.createElement("li");
            li.textContent = "Sunucudan cevap alınamadı.";
            recommendationList.appendChild(li);
        });
    });
});
