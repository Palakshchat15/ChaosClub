import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_SECRET_KEY"),
    secure=True,
)

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def upload_image(file_bytes: bytes, folder: str, public_id: str | None = None) -> str:
    """
    Upload an image to Cloudinary and return the secure CDN URL.

    Args:
        file_bytes: Raw bytes of the image file.
        folder: Cloudinary folder path (e.g. 'chaos-club/avatars').
        public_id: Optional explicit public_id (used for upsert/overwrite).

    Returns:
        Secure CDN URL string.

    Raises:
        ValueError: If the upload fails.
    """
    try:
        import io
        file_io = io.BytesIO(file_bytes)
        
        upload_options = {
            "folder": f"chaos-club/{folder}",
            "overwrite": True,
            "quality": "auto",
            "fetch_format": "auto",
        }
        if public_id:
            upload_options["public_id"] = public_id

        result = cloudinary.uploader.upload(file_io, **upload_options)
        return result["secure_url"]
    except Exception as e:
        logger.error(f"Cloudinary upload failed: {e}")
        raise ValueError(f"Image upload failed: {str(e)}")
