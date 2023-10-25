import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from "express";

export const checkRoleMiddleware = (role: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try{
            // const token = req.headers.authorization?.split(' ')[1];
            const accessToken = req.cookies.accessToken;
            if(!accessToken) return res.sendStatus(401);
    
            if(process.env.ACCESS_KEY){
                const decode = jwt.verify(accessToken, process.env.ACCESS_KEY);
        
                if(!decode) return res.sendStatus(401);

                // @ts-ignore
                if(decode.role.toLowerCase() !== role.toLowerCase()) return res.sendStatus(400);
    
                // @ts-ignore
                req.user = decode;
    
                next();
            }
        }catch(err){
            return res.sendStatus(401);
        }
    }
}