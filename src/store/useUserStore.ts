import { create } from 'zustand';

interface User {
    name: string;
    displayName: string;
    email: string;
    avatar: string;
    trustLevel?: number;
    credit?: {
        availableBalance: number;
        communityBalance: number;
        payScore: number;
    };
    isLoggedIn?: boolean;
}

interface UserState {
    user: User | null;
    isLoading: boolean;
    fetchUser: () => Promise<void>;
    logout: () => Promise<void>;
    updateBalance: (newBalance: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    isLoading: true,
    fetchUser: async () => {
        set({ isLoading: true });
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.isLoggedIn) {
                set({ user: data, isLoading: false });
            } else {
                set({ user: null, isLoading: false });
            }
        } catch (error) {
            console.error('Failed to fetch user', error);
            set({ user: null, isLoading: false });
        }
    },
    logout: async () => {
        await fetch('/api/auth/logout');
        set({ user: null });
        window.location.href = '/';
    },
    updateBalance: (newBalance: number) => {
        set((state) => {
            if (state.user && state.user.credit) {
                return {
                    user: {
                        ...state.user,
                        credit: {
                            ...state.user.credit,
                            availableBalance: newBalance
                        }
                    }
                };
            }
            return state;
        });
    }
}));
