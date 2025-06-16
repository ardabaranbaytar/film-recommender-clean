from flask import Flask, render_template, request, jsonify
from tensorflow.keras.models import load_model
import numpy as np
import pandas as pd

app = Flask(__name__)

# Model yükleniyor (derleme yapılmadı çünkü sadece tahmin yapılacak)
model = load_model("model/mlp_model.h5", compile=False)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        data = request.get_json()
        selected_titles = data.get("favorites", [])  # frontend ile uyumlu hale getirildi

        # Film verisi okunuyor
        df_movies = pd.read_csv("data/movies.csv")

        # Seçilen filmlerin ID'leri bulunuyor
        selected_ids = df_movies[df_movies["title"].isin(selected_titles)]["movieId"].tolist()

        if not selected_ids:
            return jsonify({"recommendations": [], "message": "Seçilen filmler eşleşmedi."})

        # Geriye kalan tüm filmlerden öneri yapılacak
        candidates = df_movies[~df_movies["movieId"].isin(selected_ids)].copy()
        candidate_ids = candidates["movieId"].tolist()

        if not candidate_ids:
            return jsonify({"recommendations": [], "message": "Önerilecek film kalmadı."})

        # Sahte kullanıcı ID'si ile tahmin yapılacak
        user_id = 1
        user_ids_array = np.array([user_id] * len(candidate_ids))
        movie_ids_array = np.array(candidate_ids)

        # MLP modeli tahmin yapıyor
        predictions = model.predict([user_ids_array, movie_ids_array], verbose=0).flatten()
        candidates["predicted_rating"] = predictions

        # En yüksek tahmin değerine sahip ilk 10 film öneriliyor
        top_recommendations = candidates.sort_values(by="predicted_rating", ascending=False).head(10)
        top_titles = top_recommendations["title"].tolist()

        return jsonify({"recommendations": top_titles})

    except Exception as e:
        print("🚨 /recommend endpoint HATASI:", e)
        return jsonify({"recommendations": [], "error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)


