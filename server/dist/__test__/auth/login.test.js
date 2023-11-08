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
const app_1 = require("../../src/app");
const supertest_1 = __importDefault(require("supertest"));
const db = require('./../../src/db/db');
describe('login', () => {
    const user = {
        email: 'blaiz.tron@mail.ru',
        password: '12345'
    };
    let userId = 0;
    let accessToken = '';
    it('login with correct data', () => __awaiter(void 0, void 0, void 0, function* () {
        const responce = yield (0, supertest_1.default)(app_1.app)
            .post('/users/login')
            .send(user);
        expect(responce.status).toBe(200);
    }));
});
