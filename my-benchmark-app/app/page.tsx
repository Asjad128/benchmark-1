'use client';

import { useState, useCallback } from 'react';

interface BenchmarkResult {
  status: string;
  iterations: number;
  result: number;
  duration_ms: number;
  throughput: number;
}

interface BenchmarkStats {
  requests: number;
  success: number;
  avgDuration: number;
  errors: number;
  totalThroughput: number;
}

export default function BenchmarkPage(): React.JSX.Element {
  const [stats, setStats] = useState<BenchmarkStats>({
    requests: 0,
    success: 0,
    avgDuration: 0,
    errors: 0,
    totalThroughput: 0
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [backendUrl, setBackendUrl] = useState<string>('https://benchmark-1.vercel.app/');
  const [individualResults, setIndividualResults] = useState<BenchmarkResult[]>([]);

  const runBenchmark = useCallback(async (
    concurrency: number = 10, 
    iterations: number = 5000000
  ): Promise<void> => {
    setLoading(true);
    setIndividualResults([]);

    const promises: Promise<BenchmarkResult | { error: boolean }>[] = [];
    
    for (let i = 0; i < concurrency; i++) {
      promises.push(
        fetch(`${backendUrl.replace(/\/$/, "")}/benchmark?work=${iterations}`){
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
          .then((res): Promise<BenchmarkResult> => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json() as Promise<BenchmarkResult>;
          })
          .catch(() => ({ error: true } as { error: boolean }))
      );
    }

    const settledResults = await Promise.allSettled(promises);
    const successfulResults: BenchmarkResult[] = settledResults
      .filter((result): result is PromiseFulfilledResult<BenchmarkResult> => 
        result.status === 'fulfilled' && !('error' in result.value)
      )
      .map(result => result.value);

    const successCount = successfulResults.length;
    const durations = successfulResults.map(r => r.duration_ms);
    const avgDuration = durations.length 
      ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
      : 0;
    const totalThroughput = successfulResults.reduce((sum: number, r: BenchmarkResult) => sum + r.throughput, 0);
    const latencies = successfulResults.map(r => r.duration_ms);
    const p95 = latencies.sort((a,b)=>a-b)[Math.floor(latencies.length*0.95)];


    setStats({
      requests: concurrency,
      success: successCount,
      avgDuration,
      errors: concurrency - successCount,
      totalThroughput: Math.round(totalThroughput)
    });
    
    setIndividualResults(successfulResults);
    setLoading(false);
  }, [backendUrl]);

  return (
    <main style={{
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#1e293b' }}>
        FastAPI + Next.js Benchmark
      </h1>
      
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        marginBottom: '2rem'
      }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: 'bold',
          color: '#374151'
        }}>
          FastAPI Backend URL:
        </label>
        <input
          type="url"
          value={backendUrl}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBackendUrl(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '1rem',
            marginBottom: '1rem'
          }}
          placeholder="https://benchmark-1.vercel.app/"
        />
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => runBenchmark(5, 1000000)}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              background: '#10b981',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Light Load (5 reqs)
          </button>
          <button 
            onClick={() => runBenchmark(20, 5000000)}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              background: '#ef4444',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Heavy Load (20 reqs)
          </button>
          <button 
            onClick={() => runBenchmark(50, 10000000)}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              borderRadius: '8px',
              background: '#8b5cf6',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Extreme Load (50 reqs)
          </button>
        </div>
        
        {loading && (
          <div style={{
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: '1rem',
            borderLeft: '4px solid #3b82f6'
          }}>
            Running benchmark... This loads your FastAPI server CPU!
          </div>
        )}
      </div>

      {stats.requests > 0 && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.requests}</div>
              <div>Total Requests</div>
            </div>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{stats.success}</div>
              <div>Success</div>
            </div>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.errors}</div>
              <div>Errors</div>
            </div>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.avgDuration}ms</div>
              <div>Avg Duration</div>
            </div>
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{stats.totalThroughput.toLocaleString()}</div>
              <div>Total Throughput</div>
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
          }}>
            <h2 style={{ marginTop: 0, color: '#1e293b', marginBottom: '1rem' }}>Individual Results</h2>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '0.9rem'
            }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Duration</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Iterations</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Result</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Throughput</th>
                </tr>
              </thead>
              <tbody>
                {individualResults.map((result, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '0.75rem', minWidth: '120px' }}>
                      {result.duration_ms.toFixed(0)}ms
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {result.iterations.toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {Math.round(result.result).toLocaleString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {result.throughput.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
