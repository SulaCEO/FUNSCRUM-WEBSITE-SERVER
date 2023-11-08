import jwt from 'jsonwebtoken';
import { payloadT } from "../models/auth-model";
require('dotenv').config();
const db = require('./../db/db');

export const createJwtTokens = (payload: payloadT) => {
    if(process.env.ACCESS_KEY && process.env.REFRESH_KEY){
        const accessToken = jwt.sign(payload, process.env.ACCESS_KEY, {expiresIn: '15m'});
        const refreshToken = jwt.sign(payload, process.env.REFRESH_KEY, {expiresIn: '30d'});

        return {
            accessToken,
            refreshToken
        };
    }
}

export const saveRefreshToken = async (customerId: number, refreshToken: string) => {
    const tokenData = await db.query('select * from customer_token where customer_id = $1;', [customerId]);

    if(tokenData.rows.length){
        const updatedToken = await db.query('update customer_token set refresh = $1 where customer_id = $2 returning *;', [refreshToken, customerId]);
        
        return updatedToken.rows[0];
    }

    const token = await db.query('insert into customer_token (customer_id, refresh) values ($1, $2) returning *;', [customerId, refreshToken]);
    return token.rows[0];
}

export const validateRefreshToken = (refreshToken: string) => {
    if(process.env.REFRESH_KEY){
        const decode = jwt.verify(refreshToken, process.env.REFRESH_KEY);
        if(!decode) return undefined; 

        return decode;
    }
}