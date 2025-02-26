import { useState } from "react";

function YouTubeSummarizer() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSummary("");

    try {
      const response = await fetch(`${import.meta.env.VITE_APP_BACKEND_BASE_URL}/api/v1/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error("Error:", error);
      setSummary("Failed to fetch summary.");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-2">YouTube Video Summarizer</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube URL"
          className="w-full p-2 border"
        />
        <button type="submit" className="mt-2 p-2 bg-blue-500 text-white">
          Summarize
        </button>
      </form>
      {loading && <p>Summarizing...</p>}
      {summary && <p className="mt-4">{summary}</p>}
    </div>
  );
}

export default YouTubeSummarizer;
