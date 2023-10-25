import { payloadT } from "../models/auth-model"

export const userDto = (data: payloadT) => {
    return {
        id: data.id,
        email: data.email,
        role: data.role
    }
}