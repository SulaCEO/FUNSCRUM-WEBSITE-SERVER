import { Router, Request, Response } from "express";
import { body } from "express-validator";
import { validationMiddleware } from "../middlewares/validationMiddleware";
import bcrypt from 'bcrypt';
import { createJwtTokens, saveRefreshToken, validateRefreshToken } from "../services/tokenService";
import { userDto } from "../dtos/userDto";
import { authMiddleware } from "../middlewares/authMiddleware";
import { payloadT } from "../models/auth-model";
import { checkRoleMiddleware } from "../middlewares/checkRoleMiddleware";
const db = require('./../db/db');

export const authRouter = () => {
    const router = Router();

    router.get('/', (req: Request, res: Response) => {
        res.json('AUTH');
    });
    router.get('/sui', (req: Request, res: Response) => {
        res.json('sui');
    });
    
    router.post('/register',
        body('email').trim().isLength({min: 5}),
        body('password').trim().isLength({min: 5}),
        validationMiddleware, 
        async (req: Request, res: Response) => {
            try{
                const { email, password } = req.body;

                // check if user exists with the same email
                const findUser = await db.query('select * from customer where email = $1;', [email]);
                if(findUser.rows.length) return res.sendStatus(400);

                // hash password
                const hashPassword = bcrypt.hashSync(password, 10);

                // add data into psqr table
                let user = await db.query("insert into customer (email, password, role) values ($1, $2, 'user') returning *;", [email, hashPassword]);

                // create jwt tokens
                const tokens = createJwtTokens(userDto(user.rows[0]));

                // save tokens in db
                // @ts-ignore
                await saveRefreshToken(user.rows[0].id, tokens?.refreshToken);

                // save tokens in cookie
                res.cookie('accessToken', tokens?.accessToken, {httpOnly: true, maxAge: 15*60*1000});
                res.cookie('refreshToken', tokens?.refreshToken, {httpOnly: true, maxAge: 30*24*60*60*1000});

                res.json({
                    user: userDto(user.rows[0]),
                    accessToken: tokens?.accessToken
                });
            }catch(err){
                return res.sendStatus(500);
            }
        }
    );
    router.post('/login', 
        body('email').trim().isLength({min: 5}),
        body('password').trim().isLength({min: 5}),
        validationMiddleware,
        async (req: Request, res: Response) => {
            try{
                const { email, password } = req.body;

                // check if user exists with the same email
                const findUser = await db.query('select * from customer where email = $1;', [email]);
                if(!findUser.rows[0]) return res.sendStatus(401);

                // compare password from res.body and hash password
                const comparePasswords = bcrypt.compareSync(password, findUser.rows[0].password);
                if(!comparePasswords) return res.sendStatus(400);

                // create jwt tokens
                const tokens = createJwtTokens(userDto(findUser.rows[0]));

                // save tokens in db
                // @ts-ignore
                await saveRefreshToken(findUser.rows[0].id, tokens?.refreshToken);

                // save tokens in cookie
                res.cookie('accessToken', tokens?.accessToken, {httpOnly: true, maxAge: 15*60*1000});
                res.cookie('refreshToken', tokens?.refreshToken, {httpOnly: true, maxAge: 30*24*60*60*1000});

                res.json({
                    user: userDto(findUser.rows[0]),
                    accessToken: tokens?.accessToken
                });
            }catch(err){
                return res.sendStatus(500);
            }
        }
    );
    router.get('/auth', async (req: any, res: Response) => {
        try{
            const { refreshToken } = req.cookies;
            if(!refreshToken) return res.sendStatus(401);

            // check refreshToken
            const user = validateRefreshToken(refreshToken);
            // const refreshTokenDb = await db.query('select * from customer_token where refresh = $1;', [refreshToken]);
            // if(!user && !refreshTokenDb.rows.length) return res.sendStatus(401);
            if(!user) return res.sendStatus(401);

            // create jwt tokens
            // @ts-ignore
            const tokens = createJwtTokens(userDto(user));

            // save tokens in db
            // @ts-ignore
            await saveRefreshToken(user.id, tokens?.refreshToken);

            // save tokens in cookie
            res.cookie('accessToken', tokens?.accessToken, {httpOnly: true, maxAge: 15*60*1000});
            res.cookie('refreshToken', tokens?.refreshToken, {httpOnly: true, maxAge: 30*24*60*60*1000});

            res.json({
                // @ts-ignore
                user: userDto(user)
            });
        }catch(err){
            return res.sendStatus(401);
        }
    });
    router.get('/list', 
        authMiddleware,
        async (req: Request, res: Response) => {
            try{
                let list = await db.query('select * from customer;');

                res.json(list.rows);
            }catch(err){
                return res.sendStatus(500);
            }
        }
    );

    router.get('/:id/delete', async (req: Request, res: Response) => {
        const deletedUserToken = await db.query('delete from customer_token where customer_id = $1', [req.params.id]);
        const deletedUser = await db.query('delete from customer where id = $1', [req.params.id]);

        res.json(deletedUser.rows[0]);
    })

    return router;
}