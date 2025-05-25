import React, { useState } from 'react';
import RenderOptions from './component/options';
import StockOverview from './component/stockOverview';
import TSNEScatter from './component/TSNEscatter';
import NewsList from './component/newsList';

function App() {
  const [selectedStock, setSelectedStock] = useState('JPM');

  return (
    <div className="flex flex-col h-full w-full">
      <header className="bg-zinc-400 text-white p-2 flex flex-row items-center">
        <h2 className="text-2xl">Homework 3</h2>
        <label htmlFor="bar-select" className="mx-4 text-lg">
          Select a stock:
          <select
            id="bar-select"
            className="bg-white text-black p-2 rounded mx-2"
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            {RenderOptions()}
          </select>
        </label>
      </header>

      <div className="flex flex-row h-full w-full gap-4 px-4 py-2">
        <div className="flex flex-col w-2/3 gap-4">
          <div className="h-[320px] w-full">
            <h3 className="text-left text-xl mb-1">Stock Overview</h3>
            <div className="border-2 border-gray-300 rounded-xl h-full w-full p-2">
              <StockOverview selectedStock={selectedStock} />
            </div>
          </div>

          <div className="h-[500px] w-full">
            <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] w-full p-2">
              <TSNEScatter selectedStock={selectedStock} />
            </div>
            <h3 className="text-left text-xl mt-2">t-SNE Scatterplot</h3>
          </div>
        </div>

        <div className="w-1/3 h-full">
          <h3 className="text-left text-xl h-[2rem]">News List</h3>
          <div className="border-2 border-gray-300 rounded-xl h-[calc(100%_-_2rem)] overflow-y-scroll p-2">
            <NewsList selectedStock={selectedStock} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
