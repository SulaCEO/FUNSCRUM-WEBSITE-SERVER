"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middlewares/validationMiddleware");
const bcrypt_1 = __importDefault(require("bcrypt"));
const tokenService_1 = require("../services/tokenService");
const userDto_1 = require("../dtos/userDto");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const db = require('./../db/db');
const authRouter = () => {
    const router = (0, express_1.Router)();
    router.get('/', (req, res) => {
        res.json('AUTH');
    });
    router.post('/register', (0, express_validator_1.body)('email').trim().isLength({ min: 5 }), (0, express_validator_1.body)('password').trim().isLength({ min: 5 }), validationMiddleware_1.validationMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            // check if user exists with the same email
            const findUser = yield db.query('select * from customer where email = $1;', [email]);
            if (findUser.rows.length)
                return res.sendStatus(400);
            // hash password
            const hashPassword = bcrypt_1.default.hashSync(password, 10);
            // add data into psqr table
            let user = yield db.query("insert into customer (email, password, role) values ($1, $2, 'user') returning *;", [email, hashPassword]);
            // create jwt tokens
            const tokens = (0, tokenService_1.createJwtTokens)((0, userDto_1.userDto)(user.rows[0]));
            // save tokens in db
            // @ts-ignore
            yield (0, tokenService_1.saveRefreshToken)(user.rows[0].id, tokens === null || tokens === void 0 ? void 0 : tokens.refreshToken);
            // save tokens in cookie
            res.cookie('accessToken', tokens === null || tokens === void 0 ? void 0 : tokens.accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
            res.cookie('refreshToken', tokens === null || tokens === void 0 ? void 0 : tokens.refreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
            res.json({
                user: (0, userDto_1.userDto)(user.rows[0])
                // accessToken: tokens?.accessToken
            });
        }
        catch (err) {
            return res.sendStatus(500);
        }
    }));
    router.post('/login', (0, express_validator_1.body)('email').trim().isLength({ min: 5 }), (0, express_validator_1.body)('password').trim().isLength({ min: 5 }), validationMiddleware_1.validationMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            // check if user exists with the same email
            const findUser = yield db.query('select * from customer where email = $1;', [email]);
            if (!findUser.rows[0])
                return res.sendStatus(401);
            // compare password from res.body and hash password
            const comparePasswords = bcrypt_1.default.compareSync(password, findUser.rows[0].password);
            if (!comparePasswords)
                return res.sendStatus(400);
            // create jwt tokens
            const tokens = (0, tokenService_1.createJwtTokens)((0, userDto_1.userDto)(findUser.rows[0]));
            // save tokens in db
            // @ts-ignore
            yield (0, tokenService_1.saveRefreshToken)(findUser.rows[0].id, tokens === null || tokens === void 0 ? void 0 : tokens.refreshToken);
            // save tokens in cookie
            res.cookie('accessToken', tokens === null || tokens === void 0 ? void 0 : tokens.accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
            res.cookie('refreshToken', tokens === null || tokens === void 0 ? void 0 : tokens.refreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
            res.json({
                user: (0, userDto_1.userDto)(findUser.rows[0]),
                // accessToken: tokens?.accessToken
            });
        }
        catch (err) {
            return res.sendStatus(500);
        }
    }));
    router.get('/auth', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken)
                return res.sendStatus(401);
            // check refreshToken
            const user = (0, tokenService_1.validateRefreshToken)(refreshToken);
            // const refreshTokenDb = await db.query('select * from customer_token where refresh = $1;', [refreshToken]);
            // if(!user && !refreshTokenDb.rows.length) return res.sendStatus(401);
            if (!user)
                return res.sendStatus(401);
            // create jwt tokens
            // @ts-ignore
            const tokens = (0, tokenService_1.createJwtTokens)((0, userDto_1.userDto)(user));
            // save tokens in db
            // @ts-ignore
            yield (0, tokenService_1.saveRefreshToken)(user.id, tokens === null || tokens === void 0 ? void 0 : tokens.refreshToken);
            // save tokens in cookie
            res.cookie('accessToken', tokens === null || tokens === void 0 ? void 0 : tokens.accessToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
            res.cookie('refreshToken', tokens === null || tokens === void 0 ? void 0 : tokens.refreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
            res.json({
                // @ts-ignore
                user: (0, userDto_1.userDto)(user)
            });
        }
        catch (err) {
            return res.sendStatus(401);
        }
    }));
    router.get('/list', authMiddleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let list = yield db.query('select * from customer;');
            res.json(list.rows);
        }
        catch (err) {
            return res.sendStatus(500);
        }
    }));
    return router;
};
exports.authRouter = authRouter;
