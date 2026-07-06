from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.database import init_db
from app.core.exceptions import AppException, error_response
from app.modules.model.api import router as model_router
from app.modules.knowledge.api import router as knowledge_router

app = FastAPI(title="KnowDo API")


@app.on_event("startup")
def on_startup():
    init_db()


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=200, content=error_response(exc.code, exc.message))


app.include_router(model_router)
app.include_router(knowledge_router)


@app.get("/health")
def health():
    return {"status": "ok"}
