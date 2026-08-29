"""
routers/chat.py — Sections 18 & 19: AI Data Analyst, multi-mode chat.

The AI is never given the raw dataframe — only the structured analysis
JSON already computed and persisted by the profiling pipeline. This is
what makes "never let the AI invent statistics" enforceable: the numbers
it can talk about are exactly the numbers in this JSON.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User, ChatSession, ChatMessage, DatasetColumn
from schemas import ChatRequest, ChatResponse, ChatMessageOut
from services.ai_service import ask_gemini, AIServiceError, CHAT_MODES
from routers.analysis import _get_ready_dataset, _get_analysis

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _build_context(dataset, analysis, columns) -> dict:
    return {
        "dataset_name": dataset.display_name,
        "total_rows": dataset.total_rows,
        "total_columns": dataset.total_columns,
        "quality_score": analysis.quality_score,
        "usability_score": analysis.usability_score,
        "usability_status": analysis.usability_status,
        "missing_percentage": analysis.missing_percentage,
        "duplicate_percentage": analysis.duplicate_percentage,
        "strengths": analysis.strengths,
        "problems": analysis.problems,
        "key_findings": analysis.key_findings,
        "recommended_actions": analysis.recommended_actions,
        "correlations": analysis.correlations,
        "columns": [
            {
                "name": c.name,
                "data_type": c.data_type,
                "null_percentage": c.null_percentage,
                "unique_count": c.unique_count,
                "unique_percentage": c.unique_percentage,
                "mean": c.mean_value,
                "median": c.median_value,
                "std": c.std_value,
                "min": c.min_value,
                "max": c.max_value,
                "outlier_count": c.outlier_count,
                "most_frequent_value": c.most_frequent_value,
                "top_categories": c.top_categories,
                "high_cardinality": c.high_cardinality,
            }
            for c in columns
        ],
    }


@router.post("", response_model=ChatResponse)
async def send_message(payload: ChatRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.mode not in CHAT_MODES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown chat mode '{payload.mode}'.")

    dataset = _get_ready_dataset(payload.dataset_id, current_user, db)
    analysis = _get_analysis(dataset, db)
    columns = db.query(DatasetColumn).filter(DatasetColumn.dataset_id == dataset.id).all()
    context = _build_context(dataset, analysis, columns)

    if payload.session_id:
        session = db.get(ChatSession, payload.session_id)
        if not session or session.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found.")
    else:
        session = ChatSession(dataset_id=dataset.id, user_id=current_user.id, mode=payload.mode)
        db.add(session)
        db.commit()
        db.refresh(session)

    history = [
        {"role": m.role, "content": m.content}
        for m in db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at).all()
    ]

    user_message = ChatMessage(session_id=session.id, role="user", content=payload.message)
    db.add(user_message)
    db.commit()

    try:
        reply_text = await ask_gemini(payload.mode, context, payload.message, history)
    except AIServiceError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc))

    assistant_message = ChatMessage(session_id=session.id, role="assistant", content=reply_text)
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    return ChatResponse(session_id=session.id, reply=ChatMessageOut.model_validate(assistant_message))


@router.get("/{dataset_id}", response_model=list[ChatMessageOut])
def get_chat_history(dataset_id: str, session_id: str | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = _get_ready_dataset(dataset_id, current_user, db)
    query = db.query(ChatSession).filter(ChatSession.dataset_id == dataset.id, ChatSession.user_id == current_user.id)
    if session_id:
        query = query.filter(ChatSession.id == session_id)
    session = query.order_by(ChatSession.created_at.desc()).first()
    if not session:
        return []
    return db.query(ChatMessage).filter(ChatMessage.session_id == session.id).order_by(ChatMessage.created_at).all()
