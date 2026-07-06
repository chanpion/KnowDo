from typing import Any


class AppException(Exception):
    def __init__(self, code: int, message: str):
        self.code = code
        self.message = message


class NotFoundException(AppException):
    def __init__(self, message: str = "资源不存在"):
        super().__init__(code=404, message=message)


class ValidationException(AppException):
    def __init__(self, message: str = "参数校验失败"):
        super().__init__(code=400, message=message)


class ServiceException(AppException):
    def __init__(self, message: str = "服务处理异常"):
        super().__init__(code=500, message=message)


def error_response(code: int, message: str) -> dict[str, Any]:
    return {"code": code, "data": None, "message": message}
