"use client";
import { useState } from "react";

const API = "https://benchmark-1-rl6i.onrender.com/"; // 🔁 put Render URL

type AnyResult = Record<string, any>;

export default function BenchmarkSuite() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, AnyResult>>({});
  const [error, setError] = useState("");

  const callAPI = async (endpoint: string, label: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}${endpoint}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResults(prev => ({ ...prev, [label]: data }));
    } catch {
      setError(`Failed to call ${label}`);
    }
    setLoading(false);
  };

  const runAll = async () => {
    setResults({});
    await Promise.all([
      callAPI("/cpu-benchmark", "CPU Benchmark"),
      callAPI("/db-benchmark", "DB Benchmark"),
      callAPI("/memory-benchmark", "Memory Benchmark"),
      callAPI("/mixed-benchmark", "Mixed Benchmark"),
      callAPI("/concurrency-check", "Concurrency Check")
    ]);
  };

  return (
    <div className="p-10 font-mono max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Hosting Benchmark Suite</h1>

      <div className="flex flex-wrap gap-4 mb-6">
        <button onClick={() => callAPI("/", "Health")}
          className="bg-gray-700 text-white px-4 py-2 rounded">
          Health Check
        </button>

        <button onClick={() => callAPI("/cpu-benchmark", "CPU Benchmark")}
          className="bg-blue-600 text-white px-4 py-2 rounded">
          CPU Test
        </button>

        <button onClick={() => callAPI("/memory-benchmark", "Memory Benchmark")}
          className="bg-purple-600 text-white px-4 py-2 rounded">
          Memory Test
        </button>

        <button onClick={() => callAPI("/db-benchmark", "DB Benchmark")}
          className="bg-yellow-600 text-white px-4 py-2 rounded">
          DB Test
        </button>

        <button onClick={() => callAPI("/mixed-benchmark", "Mixed Benchmark")}
          className="bg-pink-600 text-white px-4 py-2 rounded">
          Mixed Test
        </button>

        <button onClick={() => callAPI("/concurrency-check", "Concurrency Check")}
          className="bg-red-600 text-white px-4 py-2 rounded">
          Concurrency Test
        </button>

        <button onClick={runAll}
          className="bg-green-700 text-white px-4 py-2 rounded font-bold">
          Run All
        </button>
      </div>

      {loading && <p className="text-blue-500">Running benchmark...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="grid gap-6">
        {Object.entries(results).map(([name, data]) => (
          <div key={name} className="border rounded p-4 shadow">
            <h2 className="text-xl font-bold mb-2">{name}</h2>
            <pre className="bg-black text-green-400 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
