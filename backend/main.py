"""
Quantum Gate Simulation Platform — FastAPI Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from simulation.router import router

app = FastAPI(
    title="Quantum Gate Simulation API",
    description="Simulate quantum circuits with common quantum gates",
    version="0.1.0",
)

# Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root():
    return {"message": "Quantum Gate Simulation API", "version": "0.1.0"}
