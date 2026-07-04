from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/my_db"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()
