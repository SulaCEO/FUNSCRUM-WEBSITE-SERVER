"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userDto = void 0;
const userDto = (data) => {
    return {
        id: data.id,
        email: data.email,
        role: data.role
    };
};
exports.userDto = userDto;
