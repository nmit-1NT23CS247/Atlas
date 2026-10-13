"""Structured application logging configuration."""

import logging
import sys
from typing import Optional

from app.core.config import get_settings


def setup_logging(log_level: Optional[str] = None) -> None:
    """Configure structured application logging."""
    settings = get_settings()
    level_name = log_level or settings.log_level
    numeric_level = getattr(logging, level_name.upper(), logging.INFO)

    log_format = (
        "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    )

    logging.basicConfig(
        level=numeric_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
        ],
        force=True,
    )

    # Configure external library loggers
    logging.getLogger("uvicorn.access").setLevel(numeric_level)
    logging.getLogger("uvicorn.error").setLevel(numeric_level)


def get_logger(name: str = "atlas.backend") -> logging.Logger:
    """Get a named logger instance."""
    return logging.getLogger(name)


logger = get_logger("atlas.backend")
