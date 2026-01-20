import Userback from "@userback/widget";

type UserbackUser = {
    id: string;
    name?: string;
    email?: string;
};

export function initUserback(user?: UserbackUser) {
    const APP_ID = import.meta.env.VITE_USERBACK_APP_ID;

    if (!APP_ID) {
        console.warn("Userback App ID not set");
        return;
    }

    Userback(APP_ID, {
        user_data: user
            ? {
                id: user.id,
                info: {
                    name: user.name,
                    email: user.email,
                },
            }
            : undefined,
    });
}

export function destroyUserback() {
    // Optional cleanup when user logs out
    Userback("destroy");
}
