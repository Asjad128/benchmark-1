'use client';

import { useState, useCallback } from 'react';

interface BenchmarkResult {
  status: string;
  work_units: number;
  result_hash: number;
  duration_ms: number;
  throughput: number;
  server_pid: number;
}

interface BenchmarkStats {
  requests: number;
  success: number;
  avgDuration: number;
  p95: number;
  errors: number;
  totalThroughput: number;
}

export default function BenchmarkPage(): React.JSX.Element {
  const [stats, setStats] = useState<BenchmarkStats>({
    requests: 0,
    success: 0,
    avgDuration: 0,
    p95: 0,
    errors: 0,
    totalThroughput: 0
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [backendUrl, setBackendUrl] = useState<string>('https://benchmark-1.vercel.app');
  const [individualResults, setIndividualResults] = useState<BenchmarkResult[]>([]);

  const runBenchmark = useCallback(async (concurrency = 10, work = 5_000_000) => {
    setLoading(true);
    setIndividualResults([]);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const promises = Array.from({ length: concurrency }).map(() =>
        fetch(`${backendUrl.replace(/\/$/, "")}/benchmark?work=${work}`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal
        })
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json() as Promise<BenchmarkResult>;
          })
          .catch(() => null)
      );

      const results = await Promise.all(promises);
      const successfulResults = results.filter((r): r is BenchmarkResult => r !== null);

      const durations = successfulResults.map(r => r.duration_ms ?? 0);
      const sorted = [...durations].sort((a, b) => a - b);
      const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;
      const avgDuration = durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      const totalThroughput = successfulResults.reduce((sum, r) => sum + (r.throughput ?? 0), 0);

      setStats({
        requests: concurrency,
        success: successfulResults.length,
        avgDuration,
        p95,
        errors: concurrency - successfulResults.length,
        totalThroughput: Math.round(totalThroughput)
      });

      setIndividualResults(successfulResults);
    } catch {
      setStats(prev => ({ ...prev, errors: concurrency }));
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }, [backendUrl]);

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem' }}>FastAPI + Next.js Benchmark</h1>

      <input
        type="url"
        value={backendUrl}
        onChange={(e) => setBackendUrl(e.target.value)}
        style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
      />

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => runBenchmark(5, 1_000_000)} disabled={loading}>Light</button>
        <button onClick={() => runBenchmark(20, 5_000_000)} disabled={loading}>Heavy</button>
        <button onClick={() => runBenchmark(50, 10_000_000)} disabled={loading}>Extreme</button>
      </div>

      {loading && <p>Running benchmark…</p>}

      {stats.requests > 0 && (
        <>
          <h2>Stats</h2>
          <ul>
            <li>Requests: {stats.requests}</li>
            <li>Success: {stats.success}</li>
            <li>Errors: {stats.errors}</li>
            <li>Avg Duration: {stats.avgDuration} ms</li>
            <li>P95 Latency: {stats.p95} ms</li>
            <li>Total Throughput: {stats.totalThroughput.toLocaleString()}</li>
          </ul>

          <h2>Individual Results</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Duration</th>
                <th>Work</th>
                <th>Result</th>
                <th>Throughput</th>
              </tr>
            </thead>
            <tbody>
              {individualResults.map((r, i) => (
                <tr key={i}>
                  <td>{(r.duration_ms ?? 0).toFixed(0)} ms</td>
                  <td>{(r.work_units ?? 0).toLocaleString()}</td>
                  <td>{(r.result_hash ?? 0).toLocaleString()}</td>
                  <td>{(r.throughput ?? 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}
