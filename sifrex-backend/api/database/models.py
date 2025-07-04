"""
SQLAlchemy ORM models placeholder
Will be implemented in SWA-5
"""

from sqlalchemy import Column, Integer, String
from database.connection import Base


class PlaceholderModel(Base):
    """Placeholder model - will be replaced in SWA-5"""
    __tablename__ = "placeholder"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50))
    
    def __repr__(self):
        return f"<PlaceholderModel(id={self.id}, name='{self.name}')>"


# All SQLAlchemy models for sifrex_users schema will be implemented in SWA-5:
# - AppUser
# - AppUserAccount
# - AppUserSession
# - AppPasswordReset
# - AppVerificationToken
# - AppRateLimit
# - AppAuditLog
# - AppRoleHistory
# - AppUser2FA
# - AppUserPreference
# - AppUserApiKey
# - AppUserUsage
# - AppUserSavedAnalysis
# - AppUserExport