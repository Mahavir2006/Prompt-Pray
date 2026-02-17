import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { FilterProvider } from './context/FilterContext'
import { SocketProvider } from './context/SocketContext'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 2,
            refetchInterval: false,
        },
    },
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                    <AuthProvider>
                        <FilterProvider>
                            <SocketProvider>
                                <App />
                            </SocketProvider>
                        </FilterProvider>
                    </AuthProvider>
                </QueryClientProvider>
            </ThemeProvider>
        </BrowserRouter>
    </React.StrictMode>,
)
