"""
Authentication Pydantic models placeholder
Will be implemented in SWA-6
"""

from pydantic import BaseModel


class AuthStatusResponse(BaseModel):
    """Placeholder auth status response"""
    module: str
    status: str
    next_task: str