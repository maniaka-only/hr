import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import database from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const port = process.env.PORT || 3000
const jwtSecret = process.env.JWT_SECRET || 'military-hr-secret-change-me'
app.use(cors())
app.use(express.json())

const authenticate = (request, response, next) => {
    const header = request.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return response.status(401).json({ message: 'Потрібна авторизація' })
    try {
        request.user = jwt.verify(token, jwtSecret)
        next()
    } catch {
        response.status(401).json({ message: 'Недійсний або протермінований токен' })
    }
}

app.post('/api/auth/login', (request, response) => {
    const { username, password } = request.body
    const user = database.prepare('SELECT * FROM users WHERE username = ?').get(username)
    if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
        return response.status(401).json({ message: 'Невірний логін або пароль' })
    }
    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, fullName: user.full_name },
        jwtSecret,
        { expiresIn: '8h' }
    )
    response.json({
        token,
        user: { id: user.id, username: user.username, full_name: user.full_name, role: user.role }
    })
})

app.get('/api/auth/me', authenticate, (request, response) => {
    const user = database.prepare('SELECT id, username, full_name, role FROM users WHERE id = ?').get(request.user.id)
    response.json({ user })
})

app.get('/api/departments', (request, response) => {
    const departments = database.prepare(`
        SELECT d.*, COUNT(p.id) AS personnel_count
        FROM departments d
        LEFT JOIN personnel p ON p.department_id = d.id
        GROUP BY d.id
        ORDER BY d.id
    `).all()
    response.json(departments)
})

app.post('/api/departments', authenticate, (request, response) => {
    const { name, code, commander_name, commander_rank, commander_phone, description } = request.body
    if (!name || !code || !commander_name || !commander_rank) {
        return response.status(400).json({ message: 'Заповніть обов\u0027язкові поля' })
    }
    const result = database.prepare(
        'INSERT INTO departments (name, code, commander_name, commander_rank, commander_phone, description) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name, code, commander_name, commander_rank, commander_phone || '', description || '')
    response.status(201).json(
        database.prepare('SELECT * FROM departments WHERE id = ?').get(result.lastInsertRowid)
    )
})

app.put('/api/departments/:id', authenticate, (request, response) => {
    const { name, code, commander_name, commander_rank, commander_phone, description } = request.body
    const result = database.prepare(`
        UPDATE departments SET
            name = COALESCE(?, name),
            code = COALESCE(?, code),
            commander_name = COALESCE(?, commander_name),
            commander_rank = COALESCE(?, commander_rank),
            commander_phone = COALESCE(?, commander_phone),
            description = COALESCE(?, description)
        WHERE id = ?
    `).run(name, code, commander_name, commander_rank, commander_phone, description, request.params.id)
    if (!result.changes) return response.status(404).json({ message: 'Підрозділ не знайдено' })
    response.json(database.prepare('SELECT * FROM departments WHERE id = ?').get(request.params.id))
})

app.get('/api/stats', (request, response) => {
    const total = database.prepare('SELECT COUNT(*) AS count FROM personnel').get().count
    const departmentsCount = database.prepare('SELECT COUNT(*) AS count FROM departments').get().count
    const byStatus = database.prepare('SELECT status, COUNT(*) AS count FROM personnel GROUP BY status').all()
    const active = database.prepare('SELECT COUNT(*) AS count FROM personnel WHERE status = ?').get('На службі').count
    response.json({
        departments_count: departmentsCount,
        personnel_count: total,
        active_count: active,
        staffing_percent: total ? Math.round((active / total) * 100) : 0,
        statuses: byStatus
    })
})

/* ── Personnel Queries ── */

const personnelListQuery = `
    SELECT p.*, d.name AS department_name, d.code AS department_code
    FROM personnel p
    LEFT JOIN departments d ON d.id = p.department_id
    ORDER BY p.id DESC
`
const personnelOneQuery = `
    SELECT p.*, d.name AS department_name, d.code AS department_code
    FROM personnel p
    LEFT JOIN departments d ON d.id = p.department_id
    WHERE p.id = ?
`

app.get('/api/personnel', authenticate, (request, response) => {
    response.json(database.prepare(personnelListQuery).all())
})

app.get('/api/personnel/:id', authenticate, (request, response) => {
    const person = database.prepare(personnelOneQuery).get(request.params.id)
    if (!person) return response.status(404).json({ message: 'Військовослужбовця не знайдено' })
    response.json(person)
})

app.post('/api/personnel', authenticate, (request, response) => {
    const fields = [
        'service_number', 'full_name', 'rank', 'position', 'department_id',
        'birth_date', 'marital_status', 'children_count', 'service_years',
        'enlistment_date', 'status', 'phone', 'notes', 'photo_url'
    ]
    const required = ['service_number', 'full_name', 'rank', 'position', 'birth_date', 'marital_status', 'enlistment_date', 'status']
    if (required.some((field) => !request.body[field]) || request.body.service_years === undefined) {
        return response.status(400).json({ message: 'Заповніть обов\u0027язкові поля' })
    }
    try {
        const values = fields.map((field) => request.body[field] ?? null)
        const placeholders = fields.map(() => '?').join(', ')
        const result = database.prepare(
            `INSERT INTO personnel (${fields.join(', ')}) VALUES (${placeholders})`
        ).run(...values)
        response.status(201).json(
            database.prepare(personnelOneQuery).get(result.lastInsertRowid)
        )
    } catch (error) {
        response.status(400).json({ message: error.message })
    }
})

app.put('/api/personnel/:id', authenticate, (request, response) => {
    const allowed = [
        'service_number', 'full_name', 'rank', 'position', 'department_id',
        'birth_date', 'marital_status', 'children_count', 'service_years',
        'enlistment_date', 'status', 'phone', 'notes', 'photo_url'
    ]
    const entries = allowed.filter((field) => request.body[field] !== undefined)
    if (!entries.length) return response.status(400).json({ message: 'Немає даних для оновлення' })
    const set = entries.map((field) => `${field} = ?`).join(', ')
    const result = database.prepare(
        `UPDATE personnel SET ${set} WHERE id = ?`
    ).run(...entries.map((field) => request.body[field]), request.params.id)
    if (!result.changes) return response.status(404).json({ message: 'Військовослужбовця не знайдено' })
    response.json(database.prepare(personnelOneQuery).get(request.params.id))
})

app.delete('/api/personnel/:id', authenticate, (request, response) => {
    const result = database.prepare('DELETE FROM personnel WHERE id = ?').run(request.params.id)
    if (!result.changes) return response.status(404).json({ message: 'Військовослужбовця не знайдено' })
    response.status(204).end()
})

/* ── News Endpoints (Top 10 portal news) ── */

app.get('/api/news', (request, response) => {
    const limit = request.query.limit ? Number(request.query.limit) : 10
    const news = database.prepare('SELECT * FROM news ORDER BY date DESC, id DESC LIMIT ?').all(limit)
    response.json(news)
})

app.get('/api/news/:id', (request, response) => {
    const item = database.prepare('SELECT * FROM news WHERE id = ?').get(request.params.id)
    if (!item) return response.status(404).json({ message: 'Новину не знайдено' })
    response.json(item)
})

/* ── Gallery Endpoint ── */

app.get('/api/gallery', (request, response) => {
    const gallery = [
        { id: 1, title: 'Планові стрільби на полігоні під Полтавою', category: 'Навчання', image_url: 'assets/gallery/slide1.jpg' },
        { id: 2, title: 'Урочисте шикування та вручення нагород', category: 'Події', image_url: 'assets/gallery/slide2.jpg' },
        { id: 3, title: 'Тактичні заняття з інженерної підготовки', category: 'Навчання', image_url: 'assets/gallery/slide3.jpg' },
        { id: 4, title: 'Відпрацювання нормативів зв\u0027язку та БПЛА', category: 'Підрозділи', image_url: 'assets/gallery/slide4.jpg' },
        { id: 5, title: 'Бойове злагодження механізованого батальйону', category: 'Підрозділи', image_url: 'assets/gallery/slide5.jpg' },
        { id: 6, title: 'Комплексне тренування взводу вогневої підтримки', category: 'Навчання', image_url: 'assets/gallery/slide6.jpg' }
    ]
    response.json(gallery)
})

app.get('/api/health', (request, response) => response.json({ status: 'ok' }))

const clientDistBrowser = path.join(__dirname, '..', 'client', 'dist', 'military-hr-client', 'browser')
const clientDistRoot = path.join(__dirname, '..', 'client', 'dist', 'military-hr-client')
const clientDist = fs.existsSync(clientDistBrowser) ? clientDistBrowser : (fs.existsSync(clientDistRoot) ? clientDistRoot : null)

if (clientDist) {
    app.use(express.static(clientDist))
    app.get('*', (request, response, next) => {
        if (request.path.startsWith('/api')) return next()
        response.sendFile(path.join(clientDist, 'index.html'))
    })
}

app.listen(port, '0.0.0.0', () => console.log(`Military HR API listening on http://localhost:${port}`))
