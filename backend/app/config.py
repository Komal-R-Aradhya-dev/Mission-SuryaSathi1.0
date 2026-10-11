from typing import List

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings


_DEV_TOKEN_SECRET = "local-development-secret-key-please-change-32bytes"


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    API_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
    )
    TOKEN_SECRET_KEY: str = Field(default=_DEV_TOKEN_SECRET, min_length=32)
    PVGIS_TIMEOUT_SECONDS: int = Field(default=8, ge=1, le=30)

    # AWS configuration (optional for local deterministic/manual-entry workflow)
    AWS_REGION: str = "ap-south-1"
    S3_UPLOAD_BUCKET: str = ""
    DYNAMODB_TABLE_NAME: str = ""
    BEDROCK_MODEL_ID: str = "anthropic.claude-3-haiku-20240307-v1:0"

    model_config = {"env_file": ".env", "extra": "ignore"}

    @model_validator(mode="after")
    def require_production_secret(self):
        if self.ENVIRONMENT.lower() in {"prod", "production"}:
            if self.TOKEN_SECRET_KEY == _DEV_TOKEN_SECRET:
                raise ValueError(
                    "TOKEN_SECRET_KEY must be set to a unique secret in production; "
                    "the local development default is not allowed."
                )
            if len(self.TOKEN_SECRET_KEY) < 32:
                raise ValueError("TOKEN_SECRET_KEY must be at least 32 characters in production.")
        return self


settings = Settings()
