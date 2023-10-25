// import { Router, Request, Response } from "express";
// import { body } from "express-validator";
// import { validationMiddleware } from "../middlewares/validationMiddleware";
// import bcrypt from 'bcrypt';
// import { authMiddleware } from "../middlewares/authMiddleware";
// import { createJwtTokens } from "../services/tokenService";
// const db = require('./../db/db');

// export const authRouter = () => {
//     const router = Router();

//     router.get('/', (req: Request, res: Response) => {
//         res.json('auth');
//     });

//     router.post('/register', 
//         body('email').trim().isLength({min: 5}),
//         body('password').trim().isLength({min: 5}),
//         validationMiddleware,
//         async (req: Request, res: Response) => {
//             try{
//                 const { email, password } = req.body;

//                 const findUserWithSameEmail = await db.query('select * from customer where email=$1', [email]);
//                 if(findUserWithSameEmail.rows.length) return res.sendStatus(400);

//                 const hashPassword = await bcrypt.hash(password, 10);

//                 const user = await db.query('insert into customer (email, password, followers, role) values ($1, $2, 0, $3) returning *;', [email, hashPassword, 'user']);

//                 const accessToken = createJwtTokens({
//                     id: user.rows[0].id,
//                     email: user.rows[0].email,
//                     role: user.rows[0].role 
//                 });

//                 res.json(accessToken);
//             }catch(err){
//                 res.sendStatus(500);
//             }
//     });
//     router.post('/login', 
//         body('email').trim().isLength({min: 5}),
//         body('password').trim().isLength({min: 5}),
//         validationMiddleware,
//         async (req: Request, res: Response) => {
//             try{
//                 const { email, password } = req.body;

//                 const findUser = await db.query('select * from customer where email=$1;', [email]);
//                 if(!findUser.rows.length) return res.sendStatus(400);

//                 const comparePasswords = await bcrypt.compare(password, findUser.rows[0].password);
//                 if(!comparePasswords) return res.sendStatus(400);

//                 const accessToken = createJwtTokens({
//                     id: findUser.rows[0].id,
//                     email: findUser.rows[0].email,
//                     role: findUser.rows[0].role 
//                 })
                
//                 res.json(accessToken);
//             }catch(err){
//                 res.sendStatus(500);
//             }
//         }
//     );
//     router.get('/auth', authMiddleware, async (req: any, res: Response) => {
//         try{
//             const accessToken = createJwtTokens({
//                 id: req.user.id,
//                 email: req.user.email,
//                 role: req.user.role 
//             });

//             res.json(accessToken);
//         }catch(err){
//             res.sendStatus(500);
//         }
//     });


//     return router;
// }

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
                // res.cookie('accessToken', tokens?.accessToken, {httpOnly: true, maxAge: 15*60*1000});
                res.cookie('accessToken', tokens?.accessToken, {httpOnly: true, maxAge: 15*1000});
                // res.cookie('refreshToken', tokens?.refreshToken, {httpOnly: true, maxAge: 30*24*60*60*1000});
                res.cookie('refreshToken', tokens?.refreshToken, {httpOnly: true, maxAge: 30*1000});

                res.json({
                    user: userDto(user.rows[0])
                    // accessToken: tokens?.accessToken
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
                // res.cookie('accessToken', tokens?.accessToken, {httpOnly: true, maxAge: 15*60*1000});
                res.cookie('accessToken', tokens?.accessToken, {httpOnly: true, maxAge: 15*1000});
                // res.cookie('refreshToken', tokens?.refreshToken, {httpOnly: true, maxAge: 30*24*60*60*1000});
                res.cookie('refreshToken', tokens?.refreshToken, {httpOnly: true, maxAge: 30*1000});

                res.json({
                    user: userDto(findUser.rows[0]),
                    // accessToken: tokens?.accessToken
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
            // res.cookie('accessToken', tokens?.accessToken, {httpOnly: true, maxAge: 15*60*1000});
            res.cookie('accessToken', tokens?.accessToken, {httpOnly: true, maxAge: 15*1000});
                // res.cookie('refreshToken', tokens?.refreshToken, {httpOnly: true, maxAge: 30*24*60*60*1000});
                res.cookie('refreshToken', tokens?.refreshToken, {httpOnly: true, maxAge: 30*1000});

            res.json({
                // @ts-ignore
                user: userDto(user)
            });
        }catch(err){
            return res.sendStatus(401);
        }
    });
    router.get('/list', 
        checkRoleMiddleware('admin'),
        async (req: Request, res: Response) => {
            try{
                let list = await db.query('select * from customer;');

                res.json(list.rows);
            }catch(err){
                return res.sendStatus(500);
            }
        }
    );

    return router;
}