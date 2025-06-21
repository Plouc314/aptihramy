import { UserInformation } from "@/types";
import { fetchData } from "./api";

export async function createUser(email: string, password: string, is_superuser: boolean): Promise<UserInformation> {
    const body = JSON.stringify({
        email,
        password,
        is_superuser,
    });

    return fetchData<UserInformation>("/auth/create-user", {
        method: "POST",
        body,
    });
}

export async function deleteUser(id: string): Promise<void> {
    return fetchData<void>(`/users/${id}`, { method: "DELETE" })
}

export async function fetchCurrentUserInformation(): Promise<UserInformation> {
    return fetchData<UserInformation>("/users/me", { method: "GET" })
}

export async function fetchAllUserInformation(): Promise<UserInformation[]> {
    return fetchData<UserInformation[]>("/auth/users", { method: "GET" })
}
