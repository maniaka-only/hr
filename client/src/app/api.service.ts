import axios, { AxiosInstance } from 'axios'
import { Injectable } from '@angular/core'

export interface Department {
    id: number
    name: string
    code: string
    commander_name: string
    commander_rank: string
    commander_phone?: string
    description?: string
    personnel_count?: number
}

export interface Personnel {
    id: number
    service_number: string
    full_name: string
    rank: string
    position: string
    department_id?: number
    department_name?: string
    department_code?: string
    birth_date: string
    marital_status: string
    children_count: number
    service_years: number
    enlistment_date: string
    status: string
    phone?: string
    notes?: string
    photo_url?: string
}

export interface Stats {
    departments_count: number
    personnel_count: number
    active_count: number
    staffing_percent: number
    statuses: { status: string, count: number }[]
}

export interface NewsItem {
    id: number
    title: string
    date: string
    category: string
    summary: string
    content: string
    image_url?: string
}

export interface GalleryItem {
    id: number
    title: string
    category: string
    image_url: string
}

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly client: AxiosInstance

    constructor() {
        const isDev = typeof window !== 'undefined' && window.location.port === '4200'
        const baseURL = isDev ? 'http://localhost:3000/api' : '/api'
        this.client = axios.create({ baseURL })
        this.client.interceptors.request.use((config) => {
            const token = localStorage.getItem('hr_token')
            if (token) config.headers.Authorization = `Bearer ${token}`
            return config
        })
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) localStorage.removeItem('hr_token')
                return Promise.reject(error)
            }
        )
    }

    async login(username: string, password: string) {
        const { data } = await this.client.post('/auth/login', { username, password })
        return data
    }

    async me() {
        const { data } = await this.client.get('/auth/me')
        return data
    }

    async departments() {
        const { data } = await this.client.get<Department[]>('/departments')
        return data
    }

    async stats() {
        const { data } = await this.client.get<Stats>('/stats')
        return data
    }

    async createDepartment(payload: Partial<Department>) {
        const { data } = await this.client.post('/departments', payload)
        return data
    }

    async updateDepartment(id: number, payload: Partial<Department>) {
        const { data } = await this.client.put(`/departments/${id}`, payload)
        return data
    }

    async personnel() {
        const { data } = await this.client.get<Personnel[]>('/personnel')
        return data
    }

    async personnelById(id: number) {
        const { data } = await this.client.get<Personnel>(`/personnel/${id}`)
        return data
    }

    async createPersonnel(payload: Partial<Personnel>) {
        const { data } = await this.client.post('/personnel', payload)
        return data
    }

    async updatePersonnel(id: number, payload: Partial<Personnel>) {
        const { data } = await this.client.put(`/personnel/${id}`, payload)
        return data
    }

    async deletePersonnel(id: number) {
        return this.client.delete(`/personnel/${id}`)
    }

    async news(limit = 10) {
        const { data } = await this.client.get<NewsItem[]>(`/news?limit=${limit}`)
        return data
    }

    async newsById(id: number) {
        const { data } = await this.client.get<NewsItem>(`/news/${id}`)
        return data
    }

    async gallery() {
        const { data } = await this.client.get<GalleryItem[]>('/gallery')
        return data
    }
}
