print("Hello")
from fastapi import FastAPI, APIRouter

app = FastAPI()

router = APIRouter()
@router.get("/")
def read_root():
    return {"Hello": "World"}

app.include_router(router)
