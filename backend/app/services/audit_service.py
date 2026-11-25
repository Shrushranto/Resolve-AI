from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

class AuditService:
    def __init__(self, db: Session):
        self.db = db

    def log(self, event_type: str, actor_id: str, resource_type: str, resource_id: str, details: dict = None):
        entry = AuditLog(
            event_type=event_type,
            actor_id=actor_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
        )
        self.db.add(entry)
        self.db.commit()
