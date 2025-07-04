"""
User management routes placeholder
Will be implemented in SWA-8
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
async def users_status():
    """User management module status"""
    return {
        "module": "user_management",
        "status": "placeholder", 
        "next_task": "SWA-8: Implement User Management Endpoints"
    }