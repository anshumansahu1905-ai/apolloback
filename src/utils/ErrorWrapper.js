const ErrorWrapper = function (cb) {
    return async function (req, res, next) {
        try {
            await cb(req, res, next);
        } catch (error) {

            const statusCode =
                Number.isInteger(error?.statusCode) ? error.statusCode : 500;

            res.status(statusCode).json({
                status: statusCode,
                message: error?.message || "Internal Server Error",
                success: false
            });

        }
    };
};

export default ErrorWrapper;