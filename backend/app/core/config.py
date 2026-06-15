"""Configuración central (12-factor): todo desde variables de entorno."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    env: str = "production"
    database_url: str = "postgresql+psycopg://comparau:comparau@db:5432/comparau"
    redis_url: str = "redis://redis:6379/0"
    api_keys: str = "clave_demo"
    cors_origins: str = "https://comparau.com"
    rate_limit: str = "1000/hour"

    @property
    def api_keys_set(self) -> set[str]:
        return {k.strip() for k in self.api_keys.split(",") if k.strip()}

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
