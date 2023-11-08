"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        // const token = req.headers.authorization?.split(' ')[1];
        const accessToken = req.cookies.accessToken;
        if (!accessToken)
            return res.sendStatus(401);
        if (process.env.ACCESS_KEY) {
            const decode = jsonwebtoken_1.default.verify(accessToken, process.env.ACCESS_KEY);
            if (!decode)
                return res.sendStatus(401);
            // @ts-ignore
            req.user = decode;
            next();
        }
    }
    catch (err) {
        return res.sendStatus(401);
    }
};
exports.authMiddleware = authMiddleware;
