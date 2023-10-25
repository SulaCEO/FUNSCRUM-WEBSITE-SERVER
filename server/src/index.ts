import { app } from "./app";

require('dotenv').config();

app.listen(process.env.PORT, ()=>console.log(`shit is working on port = ${process.env.PORT}`));


