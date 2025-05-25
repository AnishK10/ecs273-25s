from typing import Optional, List, Annotated
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator

# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.

PyObjectId = Annotated[str, BeforeValidator(str)]

class StockListModel(BaseModel):
    _id: PyObjectId
    tickers: list[str]

class StockModelUnit(BaseModel):
    date: str
    Open: float
    High: float
    Low: float
    Close: float

class StockModelV2(BaseModel):
    _id: PyObjectId
    name: str
    stock_series: list[StockModelUnit]

class StockNewsModel(BaseModel):
    _id: PyObjectId
    Stock: str
    Title: str
    Date: str
    content: str
    
class tsneDataModel(BaseModel):
    _id: PyObjectId
    Stock: str
    x: float
    y: float
    sector: str