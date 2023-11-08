import { app } from "../src/app";
import request from "supertest";
const db = require('./../src/db/db');


describe('auth', () => {
    const user = {
        email: 'blaiz.tron@mail.ru',
        password: '12345'
    }

    let userId = 0;
    let accessToken = '';

    it('register with correct data', async () => {
        const responce = await request(app)
            .post('/users/register')
            .send(user)

        expect(responce.status).toBe(200);
        expect(responce.body).not.toBe({});

        userId = responce.body.user.id;
        accessToken = responce.body.accessToken;
    });

    it('register with the same data', async () => {
        const responce = await request(app)
            .post('/users/register')
            .send(user)

        expect(responce.status).toBe(400)
    });

    it('register with incorrect data', async () => {
        const responce = await request(app)
            .post('/users/register')
            .send({email: 'sua', password: '12145'})

        expect(responce.status).toBe(400)
    });

    it('check if user exists in db', async () => {
        const responce = await request(app)
            .get('/users/list')
            .set('Cookie', `accessToken=${accessToken}`);

        expect(responce.body.find((el: any)=>el.id === userId)).not.toBe(undefined);
    })

    afterAll(async () => {
        const deletedUserToken = await db.query('delete from customer_token where customer_id = $1', [userId]);
        const deletedUser = await db.query('delete from customer where id = $1', [userId]);
    })
}); 