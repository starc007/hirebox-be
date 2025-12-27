import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendValidationError } from "@services/responseService";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        }));
        sendValidationError(res, "Validation failed", errors);
        return;
      }
      next(error);
    }
  };
}
