from datetime import datetime
from fastapi import FastAPI
from fastapi import HTTPException
from pydantic.functional_validators import BeforeValidator
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List

from fastapi.middleware.cors import CORSMiddleware

from data_scheme import StockListModel, StockModelV2, StockNewsModel, tsneDataModel

# MongoDB connection (localhost, default port)
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.stock_anish # please replace the database name with stock_[your name] to avoid collision at TA's side
            
app = FastAPI(
    title="Stock tracking API",
    summary="An aplication tracking stock prices and respective news"
)

# Enables CORS to allow frontend apps to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/stock_list", 
         response_model=StockListModel
    )
async def get_stock_list():
    """
    Get the list of stocks from the database
    """
    stock_name_collection = db.get_collection("stock_list")
    stock_list = await stock_name_collection.find_one()
    return stock_list

@app.get("/stocknews/{stock_name}", response_model=list[StockNewsModel])
async def get_stock_news(stock_name: str):
    cursor = db.news_data.find({"Stock": stock_name.upper()})
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if isinstance(doc.get("Date"), datetime):
            doc["Date"] = doc["Date"].strftime("%Y-%m-%d %H:%M:%S")
        results.append(doc)
    
    if not results:
        raise HTTPException(status_code=404, detail="No news found for this stock")
    
    return results


@app.get("/stock/{stock_name}", 
        response_model=StockModelV2
    )
async def get_stock(stock_name : str):
    """
    Get the stock data for a specific stock
    Parameters:
    - stock_name: The name of the stock
    """
    cursor = db.price_data.find({"name": stock_name}).sort("Date", 1)
    records = await cursor.to_list(length=None)
    if not records:
        raise HTTPException(status_code=404, detail="Stock not found")
    return {
        "_id": str(records[0].get("_id")) if records else "0",
        "name": stock_name,
        "stock_series": [
            {
                "date": r["Date"],
                "Open": r["Open"],
                "High": r["High"],
                "Low": r["Low"],
                "Close": r["Close"]
            }
            for r in records]
    }


@app.get("/tsne/",
        response_model=list[tsneDataModel]
    )
async def get_tsne():
    """
    Get the t-SNE data for a specific stock
    """
    tsne_collection = db.get_collection("tsne_data")
    results = await tsne_collection.find({}).to_list(length=None)
    for r in results:
        r["_id"] = str(r["_id"])
    return results