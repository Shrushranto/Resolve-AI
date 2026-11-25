from pydantic import BaseModel, EmailStr, field_validator

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "customer"

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("role")
    @classmethod
    def valid_role(cls, v):
        if v not in ("customer", "support_agent", "admin"):
            raise ValueError("Invalid role")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    created_at: str

    model_config = {"from_attributes": True}
