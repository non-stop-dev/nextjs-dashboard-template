"""
Authentication routes placeholder
Will be implemented in SWA-6
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
async def auth_status():
    """Authentication module status"""
    return {
        "module": "authentication",
        "status": "placeholder",
        "next_task": "SWA-6: Implement Core Authentication Endpoints"
    }