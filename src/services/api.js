import axios from "axios";
import { auth } from "../firebase";

const baseURL =
    process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
    baseURL,
    headers: {
        "Content-Type": "application/json",
    },
    paramsSerializer: (params) => {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((v) => sp.append(key, v));
            } else if (value != null) {
                sp.append(key, String(value));
            }
        });
        return sp.toString();
    },
});

api.interceptors.request.use(
    async (config) => {
        const user = auth.currentUser;

        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;