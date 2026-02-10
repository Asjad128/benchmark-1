'use client'

import { useEffect, useState } from 'react'

type Stats = {
  cpu_load: number
  memory_usage: number
  active_users: number
  requests_per_sec: number
  db_ops_per_sec: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const API = 'https://benchmark-1-rl6i.onrender.com'

  // Fetch live stats every 2 seconds
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API}/`)
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error('Server not reachable')
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 2000)
    return () => clearInterval(interval)
  }, [])

  const triggerLoad = async (endpoint: string, body: any) => {
    setLoading(true)
    try {
      await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const resetLoads = async () => {
    await fetch(`${API}/reset`, { method: 'POST' })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">🚀 FastAPI Load Benchmark Dashboard</h1>

      {/* Metrics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Metric title="CPU Load" value={`${stats?.cpu_load ?? 0}%`} />
        <Metric title="Memory Usage" value={`${stats?.memory_usage ?? 0}%`} />
        <Metric title="Active Users" value={stats?.active_users ?? 0} />
        <Metric title="Req/sec" value={stats?.requests_per_sec ?? 0} />
        <Metric title="DB Ops/sec" value={stats?.db_ops_per_sec ?? 0} />
      </div>

      {/* Controls */}
      <div className="grid md:grid-cols-3 gap-6">

        <ControlCard
          title="Simulate CPU Load"
          onClick={() => triggerLoad('/simulate-cpu', { intensity: 80, duration: 30 })}
        />

        <ControlCard
          title="Simulate DB / IO Load"
          onClick={() => triggerLoad('/simulate-io', { queries_per_sec: 200, duration: 30 })}
        />

        <ControlCard
          title="Simulate 1000 Users"
          onClick={() => triggerLoad('/simulate-users', { users: 1000 })}
        />

      </div>

      <div className="mt-8">
        <button
          onClick={resetLoads}
          className="bg-red-600 px-6 py-3 rounded-xl font-semibold hover:bg-red-700"
        >
          🔴 Stop All Loads
        </button>
      </div>

      {loading && <p className="mt-4 text-yellow-400">Applying load...</p>}
    </div>
  )
}

function Metric({ title, value }: { title: string; value: any }) {
  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg text-center">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function ControlCard({ title, onClick }: { title: string; onClick: () => void }) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <button
        onClick={onClick}
        className="bg-blue-600 py-2 rounded-lg hover:bg-blue-700"
      >
        Start
      </button>
    </div>
  )
}
