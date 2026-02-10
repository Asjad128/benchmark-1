from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import time
import math
import os
import sqlite3
import random

app = FastAPI(title="Hosting Benchmark Suite")

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "benchmark.db"


# ------------------------------------------------
# INIT DB (simulate dashboard storage)
# ------------------------------------------------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("CREATE TABLE IF NOT EXISTS test (id INTEGER, value REAL)")
    conn.commit()
    conn.close()

init_db()


# ------------------------------------------------
# HEALTH CHECK
# ------------------------------------------------
@app.get("/")
def health():
    return {"status": "ok", "service": "benchmark-suite", "pid": os.getpid()}


# ------------------------------------------------
# CPU BENCHMARK
# ------------------------------------------------
@app.get("/cpu-benchmark")
def cpu_benchmark(work: int = Query(5_000_000, ge=1_000_000, le=50_000_000)):
    start = time.perf_counter()

    acc = 0.0
    for i in range(1, work):
        acc += math.sin(i) * math.cos(i) * math.sqrt(i)

    duration = time.perf_counter() - start

    return {
        "type": "cpu",
        "work_units": work,
        "duration_ms": round(duration * 1000, 2),
        "throughput": round(work / duration, 2),
        "pid": os.getpid()
    }


# ------------------------------------------------
# DB BENCHMARK (Dashboard-like queries)
# ------------------------------------------------
@app.get("/db-benchmark")
def db_benchmark(rows: int = Query(5000, ge=1000, le=20000)):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Insert rows (simulate writes)
    cur.executemany(
        "INSERT INTO test VALUES (?, ?)",
        [(random.randint(1, 1_000_000), random.random()) for _ in range(rows)]
    )
    conn.commit()

    start = time.perf_counter()
    cur.execute("SELECT AVG(value), SUM(value), COUNT(*) FROM test")
    result = cur.fetchone()
    duration = time.perf_counter() - start

    conn.close()

    return {
        "type": "db",
        "rows_inserted": rows,
        "duration_ms": round(duration * 1000, 2),
        "result": result,
        "pid": os.getpid()
    }


# ------------------------------------------------
# MEMORY BENCHMARK (large JSON)
# ------------------------------------------------
@app.get("/memory-benchmark")
def memory_benchmark(size: int = Query(100_000, ge=10_000, le=500_000)):
    start = time.perf_counter()

    data = [{"id": i, "value": math.sqrt(i)} for i in range(size)]

    duration = time.perf_counter() - start

    return {
        "type": "memory",
        "items": len(data),
        "duration_ms": round(duration * 1000, 2),
        "pid": os.getpid()
    }


# ------------------------------------------------
# MIXED BENCHMARK (Real App Simulation)
# ------------------------------------------------
@app.get("/mixed-benchmark")
def mixed_benchmark():
    start_total = time.perf_counter()

    # CPU work
    cpu_start = time.perf_counter()
    cpu_val = sum(math.sqrt(i) for i in range(1_000_000))
    cpu_time = time.perf_counter() - cpu_start

    # Memory work
    mem_start = time.perf_counter()
    arr = [i * 2 for i in range(100_000)]
    mem_time = time.perf_counter() - mem_start

    # DB work
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    db_start = time.perf_counter()
    cur.execute("SELECT COUNT(*) FROM test")
    count = cur.fetchone()[0]
    db_time = time.perf_counter() - db_start
    conn.close()

    total_time = time.perf_counter() - start_total

    return {
        "type": "mixed",
        "total_duration_ms": round(total_time * 1000, 2),
        "cpu_ms": round(cpu_time * 1000, 2),
        "memory_ms": round(mem_time * 1000, 2),
        "db_ms": round(db_time * 1000, 2),
        "db_rows": count,
        "pid": os.getpid()
    }


# ------------------------------------------------
# CONCURRENCY CHECK
# ------------------------------------------------
@app.get("/concurrency-check")
def concurrency_check():
    return {
        "message": "Request handled",
        "pid": os.getpid(),
        "time": time.time()
    }
