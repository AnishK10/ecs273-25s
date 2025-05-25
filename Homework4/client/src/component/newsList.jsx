import React, { useEffect, useState } from 'react';

function NewsList({ selectedStock }) {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    if (!selectedStock) return;

    fetch(`http://localhost:8000/stocknews/${selectedStock}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch news for ${selectedStock}`);
        }
        return res.json();
      })
      .then(data => {
        const formatted = data.map(article => ({
          title: article.Title || 'Untitled',
          date: article.Date || 'Unknown Date',
          url: '',
          content: article.content || ''
        }));
        setArticles(formatted);
      })
      .catch(err => {
        console.error("Error loading news list:", err);
        setArticles([]);
      });
  }, [selectedStock]);

  return (
    <div>
      {articles.length === 0 ? (
        <p className="text-center text-gray-500">No articles found for {selectedStock}.</p>
      ) : (
        articles.map((art, idx) => (
          <details key={idx} className="border-b p-2">
            <summary className="font-bold cursor-pointer">
              {art.title} ({art.date})
            </summary>
            {art.url && (
              <p className="text-sm text-blue-500 mb-1">
                <a href={art.url} target="_blank" rel="noopener noreferrer">{art.url}</a>
              </p>
            )}
            <p className="whitespace-pre-wrap">{art.content}</p>
          </details>
        ))
      )}
    </div>
  );
}

export default NewsList;
