from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import time
import math
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "ok", "service": "benchmark-api"}

@app.get("/benchmark")
def benchmark(work: int = Query(5_000_000, ge=1_000_000, le=50_000_000)):
    """
    CPU-bound benchmark task.
    'work' controls intensity but is capped for safety.
    """

    start = time.perf_counter()

    # Heavy floating-point math workload
    acc = 0.0
    for i in range(1, work):
        acc += math.sin(i) * math.cos(i) * math.sqrt(i)

    duration = time.perf_counter() - start

    return {
        "status": "completed",
        "work_units": work,
        "result_hash": round(acc, 2),  # just to prevent optimization
        "duration_ms": round(duration * 1000, 2),
        "throughput": round(work / duration, 2),
        "server_pid": os.getpid()
    }
