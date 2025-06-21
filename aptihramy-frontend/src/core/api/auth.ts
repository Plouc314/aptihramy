import { getToken } from "../auth";

const API_BASE_URL = import.meta.env.VITE_FASTAPI_URL || "";


export async function checkToken(): Promise<boolean> {
    const url = API_BASE_URL + "/api/check-token";

    const token = getToken();

    if (!token) {
        return false;
    }

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        return response.ok;
    } catch (error) {
        console.log("Token check failed:", error);
        return false;
    }
}


export async function login(username: string, password: string): Promise<string> {
    let url = API_BASE_URL + "/auth/jwt/login";

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(url, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
}
