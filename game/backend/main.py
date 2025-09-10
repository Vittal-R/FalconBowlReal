from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()

@router.get("/")
def read_root():
    return {"Hello": "World"}

# Example endpoint for questions (expand as needed)
@router.get("/questions")
def get_questions():
    # You can load questions from a file or database here
    return {"questions": []}

app.include_router(router)