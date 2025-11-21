import pickle
import numpy as np
import pandas as pd
import re

VECTORIZER_PATH = r"C:\Users\anura\OneDrive\Desktop\NPN Hackathon\Project\backend\models\tfidf_vectorizer.pkl"
MODEL_PATH = r"C:\Users\anura\OneDrive\Desktop\NPN Hackathon\Project\backend\models\xgboost_model.pkl"
TRAIN_DATA_PATH = r"C:\Users\anura\OneDrive\Desktop\NPN Hackathon\Project\backend\models\data\data.csv"

with open(VECTORIZER_PATH, "rb") as f:
    tfidf_vectorizer = pickle.load(f)

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)


def clean_money(x):
    if pd.isna(x):
        return np.nan
    if isinstance(x, str):
        x = re.sub(r"[^\d.]", "", x)  # remove $, commas, words
        return float(x) if x != "" else np.nan
    return x


def process_userinput(user_input):
    """
    Processes user input for movie metascore prediction.
    Ensures consistency with training dataset.
    """
    # Convert user input to a DataFrame
    new_data_df = pd.DataFrame([user_input])
    df = pd.read_csv(TRAIN_DATA_PATH)

    # Add missing columns
    for col in df.columns:
        if col not in new_data_df.columns:
            new_data_df[col] = np.nan

    # Reorder columns
    new_data_df = new_data_df[df.columns]

    # Clean numeric fields
    new_data_df["budget"] = new_data_df["budget"].apply(clean_money)
    new_data_df["opening weekend"] = new_data_df["opening weekend"].apply(clean_money)

    new_data_df["year"] = pd.to_numeric(new_data_df["year"], errors="coerce")
    new_data_df["imdb user rating"] = pd.to_numeric(new_data_df["imdb user rating"], errors="coerce")
    new_data_df["number of imdb user votes"] = pd.to_numeric(new_data_df["number of imdb user votes"], errors="coerce")

    return new_data_df


def predict_metascore(preprocessed_data):
    """
    Predicts the metascore for preprocessed movie data.

    Args:
        preprocessed_data: A pandas DataFrame from process_userinput()

    Returns:
        A NumPy array of predicted metascores.
    """
    num_features = ["year", "imdb user rating", "number of imdb user votes", "budget", "opening weekend"]
    X_num_new = preprocessed_data[num_features].fillna(0)

    X_text_new = tfidf_vectorizer.transform(preprocessed_data["text"].fillna("")).toarray()

    X_new = np.hstack([X_num_new.values, X_text_new])

    predictions = model.predict(X_new)
    return predictions

