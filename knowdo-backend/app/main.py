from fastapi import FastAPI, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.database import init_db
from app.core.exceptions import AppException, error_response
from app.modules.model.api import router as model_router
from app.modules.knowledge.api import router as knowledge_router
from app.modules.article.api import router as article_router

app = FastAPI(title="KnowDo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=200, content=error_response(exc.code, exc.message))


app.include_router(model_router)
app.include_router(knowledge_router)
app.include_router(article_router)


# ---- Stub routers for frontend-dependent endpoints ----

stub_notification = APIRouter()

@stub_notification.post("/api/notification")
async def notification_handler(request: Request):
    action = (await request.json()).get("action", "list")
    if action == "list":
        return {"code": 0, "data": [], "message": "ok"}
    return {"code": 0, "data": None, "message": "ok"}

stub_tag = APIRouter()

@stub_tag.post("/api/tag")
async def tag_handler(request: Request):
    action = (await request.json()).get("action", "list")
    if action == "list":
        return {"code": 0, "data": [], "message": "ok"}
    return {"code": 0, "data": None, "message": "ok"}

stub_category = APIRouter()

@stub_category.post("/api/category")
async def category_handler(request: Request):
    action = (await request.json()).get("action", "list")
    if action == "list":
        return {"code": 0, "data": [], "message": "ok"}
    return {"code": 0, "data": None, "message": "ok"}

app.include_router(stub_notification)
app.include_router(stub_tag)
app.include_router(stub_category)


@app.get("/health")
def health():
    return {"status": "ok"}
