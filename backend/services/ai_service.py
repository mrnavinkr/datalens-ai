"""
ai_service.py — Sections 18, 19, 34.

Gemini is used ONLY to explain, summarize, and narrate numbers that were
already computed by profiling_service/visualization_service. The backend
never asks Gemini to calculate a statistic, and every prompt embeds the
structured analysis JSON so the model has no reason to invent figures.

Architecture (Section 34):
  Uploaded Dataset -> Pandas/NumPy -> Statistical Analysis -> Data Health
  Calculation -> Structured Analysis JSON -> Google Gemini -> Natural
  Language Insights -> Recommendations
"""
from __future__ import annotations

import json
from typing import Any

import httpx

from config import settings

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

CHAT_MODES = {
    "explorer": (
        "You are the Data Explorer assistant. Answer factual questions about the dataset "
        "using ONLY the structured analysis JSON provided. If the answer isn't in the data, say so."
    ),
    "health": (
        "You are the Data Health Assistant. Focus on missing values, duplicates, invalid values, "
        "consistency issues, and overall data quality. Be specific about which columns are affected."
    ),
    "visualization": (
        "You are the Visualization Assistant. Suggest useful, specific charts for this dataset "
        "(chart type + which columns), and briefly explain why each would be informative."
    ),
    "insight": (
        "You are the Insight Assistant. Explain interesting statistical patterns in the dataset "
        "(correlations, distributions, skew, outliers) in plain, non-technical language."
    ),
    "recommendation": (
        "You are the Recommendation Assistant. Suggest what the user should check or clean next, "
        "in priority order, based on the analysis JSON."
    ),
    "report": (
        "You are the Report Assistant. Generate a concise, human-readable summary of the dataset "
        "suitable for a written report: overview, key findings, and recommendations."
    ),
}

SYSTEM_PREAMBLE = (
    "You are the AI layer of DataLens AI, a data profiling and data-health platform. "
    "You are given a structured JSON object containing statistics that were already computed "
    "by a Python/Pandas backend. Never invent, estimate, or guess any number that is not present "
    "in this JSON — if you don't have a figure, say the analysis doesn't cover it. "
    "Keep answers concise and specific to this dataset. Do not suggest machine learning, "
    "model training, or predictions — this platform is for data profiling and health only."
)


class AIServiceError(Exception):
    pass


def _build_prompt(mode: str, analysis_context: dict[str, Any], question: str, history: list[dict[str, str]]) -> list[dict]:
    mode_instruction = CHAT_MODES.get(mode, CHAT_MODES["explorer"])
    context_json = json.dumps(analysis_context, indent=2, default=str)

    contents = []
    for turn in history[-10:]:  # keep prompt bounded
        role = "user" if turn["role"] == "user" else "model"
        contents.append({"role": role, "parts": [{"text": turn["content"]}]})

    user_turn = (
        f"{SYSTEM_PREAMBLE}\n\n{mode_instruction}\n\n"
        f"DATASET ANALYSIS (structured, computed by the backend):\n{context_json}\n\n"
        f"User question: {question}"
    )
    contents.append({"role": "user", "parts": [{"text": user_turn}]})
    return contents


async def ask_gemini(mode: str, analysis_context: dict[str, Any], question: str, history: list[dict[str, str]] | None = None) -> str:
    if not settings.GEMINI_API_KEY:
        raise AIServiceError(
            "The AI assistant isn't configured yet. Set GEMINI_API_KEY in the backend .env file."
        )

    history = history or []
    contents = _build_prompt(mode, analysis_context, question, history)
    url = GEMINI_ENDPOINT.format(model=settings.GEMINI_MODEL)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                params={"key": settings.GEMINI_API_KEY},
                json={"contents": contents, "generationConfig": {"temperature": 0.3}},
            )
        response.raise_for_status()
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            raise AIServiceError("The AI assistant returned no response. Please try again.")
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "".join(p.get("text", "") for p in parts).strip()
        if not text:
            raise AIServiceError("The AI assistant returned an empty response. Please try again.")
        return text
    except httpx.HTTPStatusError as exc:
        raise AIServiceError(f"The AI assistant is temporarily unavailable ({exc.response.status_code}).") from exc
    except httpx.RequestError as exc:
        raise AIServiceError("Could not reach the AI assistant. Please check your connection and try again.") from exc
