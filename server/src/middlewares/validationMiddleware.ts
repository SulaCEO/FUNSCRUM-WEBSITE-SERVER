import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator';

export const validationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const err = validationResult(req);

    if(!err.isEmpty()) {
        return res.sendStatus(400);
    }

    next();
}