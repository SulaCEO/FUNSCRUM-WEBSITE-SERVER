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
exports.validateRefreshToken = exports.saveRefreshToken = exports.createJwtTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require('dotenv').config();
const db = require('./../db/db');
const createJwtTokens = (payload) => {
    if (process.env.ACCESS_KEY && process.env.REFRESH_KEY) {
        const accessToken = jsonwebtoken_1.default.sign(payload, process.env.ACCESS_KEY, { expiresIn: '15s' });
        const refreshToken = jsonwebtoken_1.default.sign(payload, process.env.REFRESH_KEY, { expiresIn: '30s' });
        return {
            accessToken,
            refreshToken
        };
    }
};
exports.createJwtTokens = createJwtTokens;
const saveRefreshToken = (customerId, refreshToken) => __awaiter(void 0, void 0, void 0, function* () {
    const tokenData = yield db.query('select * from customer_token where customer_id = $1;', [customerId]);
    if (tokenData.rows.length) {
        const updatedToken = yield db.query('update customer_token set refresh = $1 where customer_id = $2 returning *;', [refreshToken, customerId]);
        return updatedToken.rows[0];
    }
    const token = yield db.query('insert into customer_token (customer_id, refresh) values ($1, $2) returning *;', [customerId, refreshToken]);
    return token.rows[0];
});
exports.saveRefreshToken = saveRefreshToken;
const validateRefreshToken = (refreshToken) => {
    if (process.env.REFRESH_KEY) {
        const decode = jsonwebtoken_1.default.verify(refreshToken, process.env.REFRESH_KEY);
        if (!decode)
            return undefined;
        return decode;
    }
};
exports.validateRefreshToken = validateRefreshToken;
