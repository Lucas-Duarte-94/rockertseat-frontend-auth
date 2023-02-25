import { useContext, useEffect, useState } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { api } from "../services/apiClient"
import { setupAPIClient } from "../services/api"
import { withSSRAuth } from "../utils/withSSRAuth"
import { AuthTokenError } from "../services/errors/AuthTokenErrors"
import { destroyCookie } from "nookies"
import { Can } from "../components/Can"

export default function Dashboard() {
    const { user, signOut } = useContext(AuthContext)

    useEffect(() => {
        api.get('/me')
        .then(response => {
            console.log(response)
        }).catch(err => {
            console.log(err)
        })
    }, [])

    return (
        <>
            <h1>Dashboard: {user?.email} </h1>

            <button onClick={signOut}>Sign out</button>

            <Can permissions={['metrics.list']}>
                <div>Métricas</div>
            </Can>
        </>
    )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
    const apiClient = setupAPIClient(ctx)

    try{
        const response = await apiClient.get('/me')
    }catch (error) {
        if(error instanceof AuthTokenError) {
            destroyCookie(ctx, 'nextauth.token')
            destroyCookie(ctx, 'nextauth.refreshToken')
    
            return {
                redirect: {
                    destination: '/',
                    permanent: false
                }
            }
        }
    }

    return {
        props: {}
    }
})