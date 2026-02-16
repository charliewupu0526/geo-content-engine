from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from api.services.supabase_service import get_supabase_service, SupabaseService

router = APIRouter(tags=["auth"])

class UserCredentials(BaseModel):
    email: str
    password: str

@router.post("/signup")
async def signup(credentials: UserCredentials, service: SupabaseService = Depends(get_supabase_service)):
    result = await service.sign_up(credentials.email, credentials.password)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@router.post("/login")
async def login(credentials: UserCredentials, service: SupabaseService = Depends(get_supabase_service)):
    result = await service.sign_in(credentials.email, credentials.password)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
