"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
require('dotenv').config();
app_1.app.listen(process.env.PORT, () => console.log(`shit is working on port = ${process.env.PORT}`));
