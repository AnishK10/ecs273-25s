import os
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_anish

stock_name_collection = db.get_collection("stock_list")
tickers = [
    'XOM', 'CVX', 'HAL',
    'MMM', 'CAT', 'DAL',
    'MCD', 'NKE', 'KO',
    'JNJ', 'PFE', 'UNH',
    'JPM', 'GS', 'BAC',
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META'
]

async def import_tickers_to_mongodb():
    await stock_name_collection.insert_one({"tickers": tickers})

async def import_stock_prices():
    path_root = "./data/stockdata"
    if not os.path.exists(path_root):
        raise FileNotFoundError(f"Directory not found: {path_root}")

    collection = db.get_collection("price_data")
    await collection.delete_many({})

    for ticker in tickers:
        file_path = os.path.join(path_root, f"{ticker}.csv")
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Missing file: {file_path}")
        df = pd.read_csv(file_path)
        df["name"] = ticker
        records = df.to_dict(orient="records")
        if records:
            await collection.insert_many(records)
            print(f"Imported {len(records)} entries for {ticker}")

async def import_news_data():
    news_root = "./data/stocknews"
    if not os.path.exists(news_root):
        raise FileNotFoundError(f"Directory not found: {news_root}")

    news_coll = db.get_collection("news_data")
    await news_coll.delete_many({})

    for ticker in os.listdir(news_root):
        print(f"Processing ticker: {ticker}")
        t_path = os.path.join(news_root, ticker)
        if not os.path.isdir(t_path):
            continue

        for fname in os.listdir(t_path):
            if not fname.endswith(".txt"):
                continue
            full_path = os.path.join(t_path, fname)
            if not os.path.exists(full_path):
                raise FileNotFoundError(f"Missing news file: {full_path}")

            with open(full_path, "r", encoding="utf-8") as f:
                content = f.read().strip()

            date_str = fname[:16]
            title = fname[17:].replace(".txt", "").replace("_", " ").strip()
            await news_coll.insert_one({
                "Stock": ticker,
                "Title": title,
                "Date": date_str,
                "content": content
            })

async def import_tsne_coordinates():
    tsne_path = "./data/tsne.csv"
    if not os.path.exists(tsne_path):
        raise FileNotFoundError(f"Missing file: {tsne_path}")

    collection = db.get_collection("tsne_data")
    await collection.delete_many({})
    df = pd.read_csv(tsne_path)

    for _, row in df.iterrows():
        await collection.insert_one({
            "Stock": row['label'],
            "x": float(row['x']),
            "y": float(row['y']),
            "sector": row['sector']
        })

async def main():
    await import_tickers_to_mongodb()
    await import_stock_prices()
    await import_news_data()
    await import_tsne_coordinates()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
