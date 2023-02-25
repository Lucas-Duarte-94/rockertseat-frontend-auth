import Router, { useRouter } from "next/router";
import { setCookie, parseCookies, destroyCookie } from 'nookies'
import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/apiClient"

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn: (credentials: SignInCredentials) => Promise<void>;
    signOut: () => void;
    user?: User;
    isAuthenticated: boolean;
}

type AuthProviderProps = {
    children: ReactNode;
}

type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

export function signOut() {
    destroyCookie(undefined, 'nextauth.token')
    destroyCookie(undefined, 'nextauth.refreshToken')

    authChannel.postMessage('signOut');

    Router.push('/')
}

export const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

export function AuthProvider({ children }: AuthProviderProps) {
    const router = useRouter();

    const [user, setUser] = useState<User>();
    const isAuthenticated = !!user;

    useEffect(() => {
        authChannel = new BroadcastChannel('auth')
        authChannel.onmessage = (message) => {
            switch(message.data) {
                case 'signOut':
                    router.push('/')
                    break;
                // case 'signIn':
                //     router.push('/dashboard')
                //     break;
                default:
                    break;
            }
        }
    }, [])

    useEffect(() => {
        const { 'nextauth.token': token } = parseCookies();

        if(token) {
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data;
                
                setUser({
                    email,
                    permissions,
                    roles
                })
            }).catch((err) => {
                console.log(err)
                signOut()
            })
        }
    }, [])

    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('/sessions', {
                email,
                password
            })
            
            const { permissions, roles, token, refreshToken } = response.data;
            
            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            })
            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            })
            
            setUser({
                email,
                permissions,
                roles
            })
            
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            router.push('/dashboard')

            // authChannel.postMessage('signIn')
        }catch(err) {
            console.log(err)
        }
    }

    return (
        <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    )
}