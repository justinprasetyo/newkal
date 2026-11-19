class AppError(Exception):
    status = 400
    def __init__(self, message):
        super().__init__(message)
        self.message = message

class NotFound(AppError): status = 404
class Conflict(AppError): status = 409
