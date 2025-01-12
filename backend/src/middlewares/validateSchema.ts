import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Middleware to validate request bodies against a Zod schema.
 * @param schema - Zod schema to validate the request body.
 */
export const validateSchema = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).json({ error: err.message });
      }
    }
  };
};
