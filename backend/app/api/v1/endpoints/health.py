from fastapi import APIRouter

router = APIRouter()


@router.get("/health", summary="Estado de salud del servicio")
def health():
    return {"status": "ok", "version": "1.1.0"}
