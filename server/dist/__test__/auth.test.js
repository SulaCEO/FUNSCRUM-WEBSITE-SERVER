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
const app_1 = require("../src/app");
const supertest_1 = __importDefault(require("supertest"));
const db = require('./../src/db/db');
describe('auth', () => {
    const user = {
        email: 'blaiz.tron@mail.ru',
        password: '12345'
    };
    let userId = 0;
    let accessToken = '';
    it('register with correct data', () => __awaiter(void 0, void 0, void 0, function* () {
        const responce = yield (0, supertest_1.default)(app_1.app)
            .post('/users/register')
            .send(user);
        expect(responce.status).toBe(200);
        expect(responce.body).not.toBe({});
        userId = responce.body.user.id;
        accessToken = responce.body.accessToken;
    }));
    it('register with the same data', () => __awaiter(void 0, void 0, void 0, function* () {
        const responce = yield (0, supertest_1.default)(app_1.app)
            .post('/users/register')
            .send(user);
        expect(responce.status).toBe(400);
    }));
    it('register with incorrect data', () => __awaiter(void 0, void 0, void 0, function* () {
        const responce = yield (0, supertest_1.default)(app_1.app)
            .post('/users/register')
            .send({ email: 'sua', password: '12145' });
        expect(responce.status).toBe(400);
    }));
    it('check if user exists in db', () => __awaiter(void 0, void 0, void 0, function* () {
        const responce = yield (0, supertest_1.default)(app_1.app)
            .get('/users/list')
            .set('Cookie', `accessToken=${accessToken}`);
        expect(responce.body.find((el) => el.id === userId)).not.toBe(undefined);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        const deletedUserToken = yield db.query('delete from customer_token where customer_id = $1', [userId]);
        const deletedUser = yield db.query('delete from customer where id = $1', [userId]);
    }));
});
