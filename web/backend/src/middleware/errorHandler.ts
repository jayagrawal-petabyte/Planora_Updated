import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: err.issues,
      },
    });
  }

  // If it's a known API error with status code
  const status = (err as any).status || 500;
  const message = (err as any).message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    error: {
      message,
    },
  });
};
