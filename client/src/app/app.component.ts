import { CommonModule } from '@angular/common'
import { Component, computed, effect, inject, signal, OnInit, OnDestroy } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Router, RouterModule, ActivatedRoute } from '@angular/router'
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'
import { ApiService, Department, Personnel, Stats, NewsItem, GalleryItem } from './api.service'

/* ─────────────────────── AUTH STATE SERVICE ─────────────────────── */

import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class AuthState {
    isLoggedIn = signal(!!localStorage.getItem('hr_token'))
    userName = signal('')

    login(token: string) {
        localStorage.setItem('hr_token', token)
        this.isLoggedIn.set(true)
    }

    logout() {
        localStorage.removeItem('hr_token')
        this.isLoggedIn.set(false)
        this.userName.set('')
    }
}

/* ─────────────────────── APP ROOT (HEADER, NAV, FOOTER) ─────────────────────── */

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    template: `
    <!-- Top Bar with Official Emblem & Info -->
    <header class="header">
        <div class="header__inner">
            <a routerLink="/" class="header__brand">
                <div class="brand-mark">HR</div>
                <div class="header__titles">
                    <strong>ВІЙСЬКОВА ЧАСТИНА А3114</strong>
                    <span class="header__sub">м. Полтава · Відділ кадрів та стройової частини</span>
                </div>
            </a>

            <!-- Desktop Navigation Menu -->
            <nav class="header__nav">
                <a routerLink="/" routerLinkActive="header__link--active" [routerLinkActiveOptions]="{ exact: true }" class="header__link">Головна</a>
                <a routerLink="/about" routerLinkActive="header__link--active" class="header__link">Про сайт</a>
                <a routerLink="/news" routerLinkActive="header__link--active" class="header__link">Новини та накази</a>
                <a routerLink="/gallery" routerLinkActive="header__link--active" class="header__link">Галерея</a>
                <a routerLink="/departments" routerLinkActive="header__link--active" class="header__link">Підрозділи</a>
                <a *ngIf="auth.isLoggedIn()" routerLink="/personnel" routerLinkActive="header__link--active" class="header__link header__link--protected">Особовий склад</a>
                <a routerLink="/contacts" routerLinkActive="header__link--active" class="header__link">Контакти</a>
            </nav>

            <!-- Auth Action -->
            <div class="header__actions">
                <button *ngIf="!auth.isLoggedIn()" class="button button--gold button--sm" (click)="openLogin()">
                    Вхід кадровика
                </button>
                <div *ngIf="auth.isLoggedIn()" class="header__user">
                    <span class="status-dot"></span>
                    <span class="header__username">{{ auth.userName() }}</span>
                    <button class="button button--ghost button--xs" (click)="logout()">Вийти</button>
                </div>
                <button class="header__toggle" (click)="toggleMobileMenu()" aria-label="Меню">☰</button>
            </div>
        </div>

        <!-- Mobile Drawer Menu -->
        <div class="mobile-drawer" [class.mobile-drawer--open]="mobileMenuOpen()">
            <div class="mobile-drawer__backdrop" (click)="closeMobileMenu()"></div>
            <div class="mobile-drawer__panel">
                <div class="mobile-drawer__header">
                    <div class="brand-mark">HR</div>
                    <div>
                        <strong>В/Ч А3114</strong>
                        <small>м. Полтава · Відділ кадрів</small>
                    </div>
                    <button class="mobile-drawer__close" (click)="closeMobileMenu()">×</button>
                </div>
                <nav class="mobile-drawer__nav">
                    <a routerLink="/" (click)="closeMobileMenu()" class="mobile-drawer__link">Головна</a>
                    <a routerLink="/about" (click)="closeMobileMenu()" class="mobile-drawer__link">Про сайт</a>
                    <a routerLink="/news" (click)="closeMobileMenu()" class="mobile-drawer__link">Новини та накази</a>
                    <a routerLink="/gallery" (click)="closeMobileMenu()" class="mobile-drawer__link">Галерея світлин</a>
                    <a routerLink="/departments" (click)="closeMobileMenu()" class="mobile-drawer__link">Підрозділи частини</a>
                    <a *ngIf="auth.isLoggedIn()" routerLink="/personnel" (click)="closeMobileMenu()" class="mobile-drawer__link mobile-drawer__link--gold">Особовий склад</a>
                    <a routerLink="/contacts" (click)="closeMobileMenu()" class="mobile-drawer__link">Контакти (м. Полтава)</a>
                </nav>
                <div class="mobile-drawer__footer">
                    <button *ngIf="!auth.isLoggedIn()" class="button button--gold button--full" (click)="openLogin(); closeMobileMenu()">
                        Вхід для посадових осіб
                    </button>
                    <button *ngIf="auth.isLoggedIn()" class="button button--ghost button--full" (click)="logout(); closeMobileMenu()">
                        Вийти ({{ auth.userName() }})
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main View Outlet -->
    <main class="main-content">
        <router-outlet></router-outlet>
    </main>

    <!-- Site Footer -->
    <footer class="footer">
        <div class="footer__inner">
            <div class="footer__col">
                <div class="footer__brand">
                    <div class="brand-mark">HR</div>
                    <div>
                        <strong>ВІЙСЬКОВА ЧАСТИНА А3114</strong>
                        <small>м. Полтава · Збройні Сили України</small>
                    </div>
                </div>
                <p class="footer__desc">
                    Офіційний інформаційний вебресурс служби персоналу та стройової частини військової частини А3114. Забезпечуємо бездоганний облік кадрів, облік вислуги років, своєчасне присвоєння звань та захист прав військовослужбовців.
                </p>
                <span class="footer__motto">«Служба. Честь. Професіоналізм»</span>
            </div>

            <div class="footer__col">
                <h4>Навігація</h4>
                <ul class="footer__links">
                    <li><a routerLink="/">Головна сторінка</a></li>
                    <li><a routerLink="/about">Про сайт кадрового органу</a></li>
                    <li><a routerLink="/news">10 Головних наказів і новин</a></li>
                    <li><a routerLink="/gallery">Галерея світлин гарнізону</a></li>
                    <li><a routerLink="/departments">Організаційна структура підрозділів</a></li>
                    <li><a routerLink="/contacts">Контакти штабу в м. Полтава</a></li>
                </ul>
            </div>

            <div class="footer__col">
                <h4>Служба персоналу</h4>
                <p class="footer__info">
                    <strong>Пункт постійної дислокації:</strong><br>
                    36000, Україна, м. Полтава, вул. Соборності, 42
                </p>
                <p class="footer__info">
                    <strong>Оперативний черговий частини (24/7):</strong><br>
                    <span class="mono">+380 (532) 50-11-00</span>
                </p>
                <p class="footer__info">
                    <strong>Відділ кадрів (приймальня):</strong><br>
                    <span class="mono">+380 (532) 50-11-01</span>
                </p>
            </div>

            <div class="footer__col">
                <h4>Графік прийому</h4>
                <p class="footer__info">
                    Прийом військовослужбовців:<br>
                    <span class="mono">Вівторок, Четвер: 14:00 – 17:00</span><br>
                    Прийом родин захисників:<br>
                    <span class="mono">П\u0027ятниця: 10:00 – 13:00</span>
                </p>
                <p class="footer__info">
                    Чергова служба штабу:<br>
                    Цілодобово без вихідних
                </p>
                <button *ngIf="!auth.isLoggedIn()" class="button button--ghost button--full button--sm" (click)="openLogin()">
                    Вхід для кадровика
                </button>
            </div>
        </div>

        <div class="footer__bottom">
            <div>© 2026 Військова частина А3114 (м. Полтава). Всі права захищено.</div>
            <div>Курсова робота на тему: «Відділ кадрів військової частини»</div>
        </div>
    </footer>

    <!-- Login Modal Dialog -->
    <div class="overlay" *ngIf="showLogin()" (click)="closeLogin()">
        <div class="modal" (click)="$event.stopPropagation()">
            <button class="modal__close" (click)="closeLogin()">×</button>
            <span class="eyebrow">ЗАКРИТИЙ ДОСТУП · СЛУЖБА ПЕРСОНАЛУ</span>
            <h2>Вхід для кадровика</h2>
            <form (ngSubmit)="login()">
                <label>
                    Службовий логін
                    <input [(ngModel)]="loginForm.username" name="username" required autocomplete="username">
                </label>
                <label>
                    Пароль доступу
                    <input type="password" [(ngModel)]="loginForm.password" name="password" required autocomplete="current-password">
                </label>
                <p class="hint">Тестові дані посадової особи: <b>admin</b> / <b>admin123</b></p>
                <button class="button button--gold button--full" [disabled]="loading()">
                    {{ loading() ? 'Перевірка повноважень...' : 'Увійти до системи' }}
                </button>
                <p class="error" *ngIf="error()">{{ error() }}</p>
            </form>
        </div>
    </div>
    `
})
export class AppComponent {
    private readonly api = inject(ApiService)
    private readonly router = inject(Router)
    readonly auth = inject(AuthState)

    mobileMenuOpen = signal(false)
    showLogin = signal(false)
    loading = signal(false)
    error = signal('')
    loginForm = { username: 'admin', password: 'admin123' }

    constructor() {
        effect(() => {
            if (this.auth.isLoggedIn()) {
                this.api.me()
                    .then((data) => this.auth.userName.set(data.user?.full_name || 'Кадровик'))
                    .catch(() => this.auth.logout())
            }
        })
    }

    toggleMobileMenu() {
        this.mobileMenuOpen.update((v) => !v)
    }

    closeMobileMenu() {
        this.mobileMenuOpen.set(false)
    }

    openLogin() {
        this.showLogin.set(true)
    }

    closeLogin() {
        this.showLogin.set(false)
    }

    async login() {
        this.loading.set(true)
        this.error.set('')
        try {
            const data = await this.api.login(this.loginForm.username, this.loginForm.password)
            this.auth.login(data.token)
            this.showLogin.set(false)
            this.router.navigateByUrl('/personnel')
        } catch {
            this.error.set('Невірний службовий логін або пароль')
        } finally {
            this.loading.set(false)
        }
    }

    logout() {
        this.auth.logout()
        this.router.navigateByUrl('/')
    }
}

/* ─────────────────────── HOME COMPONENT (SLIDER, 10 NEWS, STATS) ─────────────────────── */

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <!-- Hero Slider -->
    <section class="slider-section">
        <div class="slider">
            <div class="slider__track">
                <div class="slide"
                     *ngFor="let s of slides; let i = index"
                     [class.slide--active]="currentSlide() === i"
                     [style.backgroundImage]="'linear-gradient(rgba(28,33,30,0.68), rgba(28,33,30,0.88)), url(' + s.image + ')'">
                    <div class="slide__content">
                        <span class="slide__badge">{{ s.badge }}</span>
                        <h2>{{ s.title }}</h2>
                        <p>{{ s.desc }}</p>
                        <div class="slide__actions">
                            <a [routerLink]="s.link" class="button button--gold">{{ s.buttonText }}</a>
                            <a routerLink="/about" class="button button--ghost">Про військову частину</a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Slider Controls -->
            <button class="slider__nav-btn slider__nav-btn--prev" (click)="prevSlide()" aria-label="Попередній слайд">‹</button>
            <button class="slider__nav-btn slider__nav-btn--next" (click)="nextSlide()" aria-label="Наступний слайд">›</button>

            <!-- Dots Indicators -->
            <div class="slider__dots">
                <button *ngFor="let s of slides; let i = index"
                        class="slider__dot"
                        [class.slider__dot--active]="currentSlide() === i"
                        (click)="setSlide(i)"
                        [attr.aria-label]="'Слайд ' + (i + 1)">
                </button>
            </div>
        </div>
    </section>

    <!-- Quick Stats Section -->
    <section class="home-stats" *ngIf="stats()">
        <div class="stat-card">
            <span class="stat-card__label">Підрозділи частини</span>
            <strong class="stat-card__value">{{ stats()!.departments_count }}</strong>
            <small>бойові та штабні підрозділи</small>
        </div>
        <div class="stat-card">
            <span class="stat-card__label">Особовий склад</span>
            <strong class="stat-card__value">{{ stats()!.personnel_count }}</strong>
            <small>офіцери, сержанти, солдати</small>
        </div>
        <div class="stat-card">
            <span class="stat-card__label">На бойовій службі</span>
            <strong class="stat-card__value">{{ stats()!.active_count }}</strong>
            <small>бойова готовність «Повна»</small>
        </div>
        <div class="stat-card">
            <span class="stat-card__label">Укомплектованість штату</span>
            <strong class="stat-card__value">{{ stats()!.staffing_percent }}%</strong>
            <small>за штатним розписом 2026</small>
        </div>
    </section>

    <!-- Top 10 Portal News Section -->
    <section class="home-news">
        <div class="section-head">
            <div>
                <span class="eyebrow">ОФІЦІЙНИЙ ВІСНИК ГАРНІЗОНУ</span>
                <h2>10 Головних наказів і новин частини</h2>
                <p>Кадрові накази, присвоєння звань, підсумки навчань на полігонах та події військової частини А3114.</p>
            </div>
            <a routerLink="/news" class="text-link">Усі накази та новини →</a>
        </div>

        <div class="news-grid">
            <article class="news-card" *ngFor="let item of news()" (click)="selectNews(item)">
                <div class="news-card__image" [style.backgroundImage]="'url(' + (item.image_url || 'assets/gallery/slide1.jpg') + ')'">
                    <span class="news-card__category">{{ item.category }}</span>
                </div>
                <div class="news-card__body">
                    <time class="news-card__date mono">{{ item.date }}</time>
                    <h3 class="news-card__title">{{ item.title }}</h3>
                    <p class="news-card__summary">{{ item.summary }}</p>
                    <span class="news-card__more">Читати повний наказ →</span>
                </div>
            </article>
        </div>
    </section>

    <!-- Preview Departments -->
    <section class="home-departments">
        <div class="section-head">
            <div>
                <span class="eyebrow">БОЙОВИЙ ПОРЯДОК</span>
                <h2>Організаційна структура підрозділів</h2>
                <p>Командний склад, функціональні напрями та чисельність підрозділів в/ч А3114.</p>
            </div>
            <a routerLink="/departments" class="text-link">Переглянути всі підрозділи →</a>
        </div>

        <div class="department-grid">
            <article class="department-card" *ngFor="let d of departments().slice(0, 3)">
                <div class="department-card__top">
                    <span class="code">{{ d.code }}</span>
                    <span class="count">{{ d.personnel_count || 0 }} ос.</span>
                </div>
                <h3>{{ d.name }}</h3>
                <div class="commander">
                    <span class="avatar">{{ d.commander_name.charAt(0) }}</span>
                    <div>
                        <small>КОМАНДИР / НАЧАЛЬНИК</small>
                        <b>{{ d.commander_name }}</b>
                        <em class="gold">{{ d.commander_rank }}</em>
                    </div>
                </div>
                <p>{{ d.description }}</p>
                <div class="department-card__actions">
                    <a routerLink="/departments" class="text-link">Докладно про підрозділ →</a>
                </div>
            </article>
        </div>
    </section>

    <!-- Contract Service Call-to-action Banner -->
    <section class="home-banner">
        <div class="home-banner__content">
            <span class="eyebrow">ВІЙСЬКОВА СЛУЖБА ЗА КОНТРАКТОМ</span>
            <h2>Приєднуйтесь до військової частини А3114 у м. Полтава</h2>
            <p>Гідне грошове забезпечення від 25 000 до 120 000 грн, матеріальна допомога на оздоровлення, забезпечення житлом, сучасне натовське спорядження та можливість офіцерського зростання. Станьте на захист рідної Полтавщини та всієї України!</p>
            <div class="home-banner__actions">
                <a routerLink="/contacts" class="button button--gold">Звернутися до відділу кадрів</a>
                <a routerLink="/about" class="button button--ghost">Вимоги та порядок вступу</a>
            </div>
        </div>
    </section>

    <!-- News Detail Modal -->
    <div class="overlay" *ngIf="selectedNews()" (click)="selectedNews.set(null)">
        <div class="modal modal--wide" (click)="$event.stopPropagation()">
            <button class="modal__close" (click)="selectedNews.set(null)">×</button>
            <span class="eyebrow">{{ selectedNews()!.category }} · {{ selectedNews()!.date }}</span>
            <h2>{{ selectedNews()!.title }}</h2>
            <div class="news-modal__image" *ngIf="selectedNews()!.image_url" [style.backgroundImage]="'url(' + selectedNews()!.image_url + ')'"></div>
            <p class="news-modal__summary"><b>{{ selectedNews()!.summary }}</b></p>
            <div class="news-modal__content-box">
                <p class="news-modal__content" *ngFor="let paragraph of formatParagraphs(selectedNews()!.content)">
                    {{ paragraph }}
                </p>
            </div>
        </div>
    </div>
    `
})
export class HomeComponent implements OnInit, OnDestroy {
    private readonly api = inject(ApiService)

    currentSlide = signal(0)
    stats = signal<Stats | null>(null)
    news = signal<NewsItem[]>([])
    departments = signal<Department[]>([])
    selectedNews = signal<NewsItem | null>(null)

    private timerId: any = null

    slides = [
        {
            title: 'Військова частина А3114 · м. Полтава',
            desc: 'Зразок високої бойової готовності, військового професіоналізму та сучасного штабного менеджменту. На варті спокою Полтавщини та соборності України.',
            badge: 'В/Ч А3114 · ПОЛТАВСЬКИЙ ГАРНІЗОН',
            image: 'assets/gallery/slide1.jpg',
            buttonText: 'Структура частини',
            link: '/departments'
        },
        {
            title: 'Сучасна польова виучка та тактичні маневри',
            desc: 'Регулярні тактико-спеціальні навчання 1-го механізованого батальйону та розвідроти на загальновійськових полігонах оперативного командування.',
            badge: 'БОЙОВА ПІДГОТОВКА',
            image: 'assets/gallery/slide3.jpg',
            buttonText: 'Фотолітопис навчань',
            link: '/gallery'
        },
        {
            title: 'Служба персоналу: прозорість та надійність обліку',
            desc: 'Автоматизоване ведення особових справ, 7-значні індивідуальні номери обліку, своєчасне присвоєння чергових звань та контроль вислуги років.',
            badge: 'ВІДДІЛ КАДРІВ',
            image: 'assets/gallery/slide2.jpg',
            buttonText: 'Накази та новини',
            link: '/news'
        },
        {
            title: 'Служба. Честь. Професіоналізм',
            desc: 'Захист незалежності України — почесна справа мужніх. Повний соціальний пакет, стабільне грошове забезпечення та підтримка родин військових.',
            badge: 'ЗБРОЙНІ СИЛИ УКРАЇНИ',
            image: 'assets/gallery/slide5.jpg',
            buttonText: 'Контакти частини',
            link: '/contacts'
        }
    ]

    ngOnInit() {
        this.loadData()
        this.timerId = setInterval(() => {
            this.nextSlide()
        }, 6000)
    }

    ngOnDestroy() {
        if (this.timerId) clearInterval(this.timerId)
    }

    async loadData() {
        const [stats, news, departments] = await Promise.all([
            this.api.stats(),
            this.api.news(10),
            this.api.departments()
        ])
        this.stats.set(stats)
        this.news.set(news)
        this.departments.set(departments)
    }

    nextSlide() {
        this.currentSlide.update((i) => (i + 1) % this.slides.length)
    }

    prevSlide() {
        this.currentSlide.update((i) => (i - 1 + this.slides.length) % this.slides.length)
    }

    setSlide(index: number) {
        this.currentSlide.set(index)
    }

    selectNews(item: NewsItem) {
        this.selectedNews.set(item)
    }

    formatParagraphs(text: string): string[] {
        return text ? text.split('\n\n') : []
    }
}

/* ─────────────────────── ABOUT COMPONENT ─────────────────────── */

@Component({
    selector: 'app-about',
    standalone: true,
    imports: [CommonModule, RouterModule],
    template: `
    <div class="page-container">
        <div class="page-head">
            <div>
                <span class="eyebrow">СЛУЖБА ПЕРСОНАЛУ В/Ч А3114</span>
                <h2>Про сайт відділу кадрів</h2>
                <p>Офіційний інформаційний портал кадрового органу військової частини А3114 (м. Полтава).</p>
            </div>
        </div>

        <div class="about-grid">
            <div class="about-card">
                <span class="about-card__icon">🎖</span>
                <h3>Місія кадрової служби</h3>
                <p>Формування високопрофесійного, мотивованого офіцерського та сержантського складу, облік вислуги років, своєчасне оформлення подань на присвоєння військових звань та підготовка наказів командування по особовому складу.</p>
            </div>

            <div class="about-card">
                <span class="about-card__icon">⚖</span>
                <h3>Нормативна основа</h3>
                <p>Діяльність підрозділу ґрунтується на Законах України «Про військовий обов\u0027язок і військову службу», «Про соціальний і правовий захист військовослужбовців», Положенні про проходження громадянами України військової служби (Указ Президента №1153/2008) та наказах МОУ.</p>
            </div>

            <div class="about-card">
                <span class="about-card__icon">🛡</span>
                <h3>Соціальний супровід воїнів</h3>
                <p>Контроль нарахування виплат на оздоровлення, щорічних відпусток, надання статусу учасника бойових дій (УБД), оформлення посвідчень та всебічна консультаційна підтримка членів родин військовослужбовців.</p>
            </div>

            <div class="about-card">
                <span class="about-card__icon">💻</span>
                <h3>Єдиний цифровий облік</h3>
                <p>Впровадження 7-значних індивідуальних номерів військовослужбовців (наприклад, 6284772), автоматизований розрахунок віку, швидка фільтрація за званнями та підрозділами й захищений доступ через JWT-авторизацію.</p>
            </div>
        </div>

        <div class="about-content">
            <h3>Військова частина А3114 сьогодні</h3>
            <p>Військова частина А3114 сформована та несе постійну бойову варту в Полтавському гарнізоні. Організаційно частина об\u0027єднує штаб управління, 1-й механізований батальйон, розвідувальну роту з підрозділом аеророзвідки, вузол захищеного зв\u0027язку, медичний пункт з повноцінним стаціонаром та підрозділи тилового забезпечення.</p>
            <p>Відділ кадрів під керівництвом начальника штабу підполковника Ковальчук О.С. щоденно забезпечує чітке дотримання штатного розпису, комплектування контрактниками та всебічний супровід військової кар\u0027єри кожного бійця.</p>
        </div>
    </div>
    `
})
export class AboutComponent {}

/* ─────────────────────── GALLERY COMPONENT ─────────────────────── */

@Component({
    selector: 'app-gallery',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page-container">
        <div class="page-head">
            <div>
                <span class="eyebrow">БОЙОВИЙ ЛІТОПИС ГАРНІЗОНУ</span>
                <h2>Галерея світлин військової частини</h2>
                <p>Фотографії особового складу у формі, бойових навчань та урочистих подій в/ч А3114 (м. Полтава).</p>
            </div>
            <div class="filter-tabs">
                <button class="filter-tab" [class.filter-tab--active]="activeFilter() === 'Всі'" (click)="setFilter('Всі')">Всі світлини</button>
                <button class="filter-tab" [class.filter-tab--active]="activeFilter() === 'Навчання'" (click)="setFilter('Навчання')">Бойова підготовка</button>
                <button class="filter-tab" [class.filter-tab--active]="activeFilter() === 'Особовий склад'" (click)="setFilter('Особовий склад')">Особовий склад</button>
                <button class="filter-tab" [class.filter-tab--active]="activeFilter() === 'Підрозділи'" (click)="setFilter('Підрозділи')">Підрозділи</button>
            </div>
        </div>

        <div class="photo-gallery">
            <div class="photo-item" *ngFor="let item of filteredPhotos()" (click)="openLightbox(item)">
                <img [src]="item.url" [alt]="item.title" loading="lazy">
                <div class="photo-item__overlay">
                    <span class="photo-item__category">{{ item.category }}</span>
                    <strong class="photo-item__title">{{ item.title }}</strong>
                </div>
            </div>
        </div>

        <!-- Lightbox Modal -->
        <div class="overlay" *ngIf="activePhoto()" (click)="closeLightbox()">
            <div class="lightbox" (click)="$event.stopPropagation()">
                <button class="modal__close" (click)="closeLightbox()">×</button>
                <img [src]="activePhoto()!.url" [alt]="activePhoto()!.title">
                <div class="lightbox__caption">
                    <span class="gold">{{ activePhoto()!.category }}</span>
                    <h3>{{ activePhoto()!.title }}</h3>
                    <p>{{ activePhoto()!.desc }}</p>
                </div>
            </div>
        </div>
    </div>
    `
})
export class GalleryComponent {
    activeFilter = signal('Всі')
    activePhoto = signal<any | null>(null)

    photos = [
        {
            title: 'Парадний стрій зведеного підрозділу військової частини А3114',
            category: 'Підрозділи',
            url: 'assets/gallery/slide1.jpg',
            desc: 'Військовослужбовці полтавської частини на репетиції маршу з нагоди Дня Незалежності України.'
        },
        {
            title: 'Начальник штабу підполковник Ковальчук Олена Сергіївна',
            category: 'Особовий склад',
            url: 'assets/personnel/person1.jpg',
            desc: 'Перший заступник командира військової частини А3114, кавалер ордена Богдана Хмельницького.'
        },
        {
            title: 'Начальник оперативного відділу майор Савчук Владислав Олегович',
            category: 'Особовий склад',
            url: 'assets/personnel/person2.jpg',
            desc: 'Організатор бойового чергування та планування польових виходів підрозділів частини.'
        },
        {
            title: 'Офіцер відділу кадрів старший лейтенант Гнатюк Марія Іванівна',
            category: 'Особовий склад',
            url: 'assets/personnel/person3.jpg',
            desc: 'Провідний фахівець із ведення особових справ, нагородних документів та присвоєння звань.'
        },
        {
            title: 'Командир 1-го механізованого батальйону майор Бондаренко Андрій Миколайович',
            category: 'Особовий склад',
            url: 'assets/personnel/person4.jpg',
            desc: 'Бойовий комбат, учасник боїв на сході України, кавалер ордена «За мужність».'
        },
        {
            title: 'Урочисте шикування на плацу частини з нагоди Дня захисників і захисниць',
            category: 'Підрозділи',
            url: 'assets/gallery/slide2.jpg',
            desc: 'Вручення відомчих нагрудних знаків та грамот особовому складу Полтавського гарнізону.'
        },
        {
            title: 'Тактичні навчання механізованого взводу на полігоні під Полтавою',
            category: 'Навчання',
            url: 'assets/gallery/slide3.jpg',
            desc: 'Відпрацювання нормативів вогневої підготовки та маневреної оборони рубежу.'
        },
        {
            title: 'Старший оператор БПЛА старший солдат Олійник Назар Тарасович',
            category: 'Особовий склад',
            url: 'assets/personnel/person9.jpg',
            desc: 'Фахівець аеророзвідки комплексу «Лелека-100» розвідувальної роти частини.'
        },
        {
            title: 'Начальник зв\u0027язку частини капітан Ткаченко Ірина Василівна',
            category: 'Особовий склад',
            url: 'assets/personnel/person10.jpg',
            desc: 'Забезпечення цілодобового зашифрованого супутникового каналу управління штабу.'
        },
        {
            title: 'Чергові розрахунки станцій захищеного зв\u0027язку на бойовому чергуванні',
            category: 'Підрозділи',
            url: 'assets/gallery/slide4.jpg',
            desc: 'Оператори зв\u0027язку в/ч А3114 забезпечують захищеність каналів від перехоплення та РЕБ.'
        },
        {
            title: 'Маневри механізованого батальйону на пересіченій місцевості',
            category: 'Навчання',
            url: 'assets/gallery/slide5.jpg',
            desc: 'Координація руху бойових машин під керівництвом комбата майора Бондаренка А.М.'
        },
        {
            title: 'Вогнева підготовка розвідроти під командуванням капітана Мельника Д.О.',
            category: 'Навчання',
            url: 'assets/gallery/slide6.jpg',
            desc: 'Практичні стрільби з протитанкових засобів та автоматичної зброї на полігоні.'
        }
    ]

    filteredPhotos = computed(() => {
        const filter = this.activeFilter()
        if (filter === 'Всі') return this.photos
        return this.photos.filter((p) => p.category === filter)
    })

    setFilter(f: string) {
        this.activeFilter.set(f)
    }

    openLightbox(p: any) {
        this.activePhoto.set(p)
    }

    closeLightbox() {
        this.activePhoto.set(null)
    }
}

/* ─────────────────────── NEWS COMPONENT (10 TOP NEWS) ─────────────────────── */

@Component({
    selector: 'app-news',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-container">
        <div class="page-head">
            <div>
                <span class="eyebrow">ПРЕС-СЛУЖБА ВІЙСЬКОВОЇ ЧАСТИНИ А3114</span>
                <h2>10 Головних наказів і новин порталу</h2>
                <p>Офіційні повідомлення командування, кадрові накази, бойова підготовка та події Полтавського гарнізону.</p>
            </div>
        </div>

        <div class="toolbar">
            <input class="search"
                   placeholder="Пошук за назвою наказу, прізвищем воїна або темою..."
                   [ngModel]="query()"
                   (ngModelChange)="query.set($event)">
            <select [ngModel]="categoryFilter()" (ngModelChange)="categoryFilter.set($event)">
                <option value="">Всі рубрики</option>
                <option>Кадри</option>
                <option>Події</option>
                <option>Бойова підготовка</option>
                <option>Озброєння</option>
                <option>Офіційно</option>
                <option>Медицина</option>
                <option>Спорт</option>
                <option>Аналітика</option>
            </select>
        </div>

        <div class="news-list">
            <article class="news-item" *ngFor="let item of filteredNews()" (click)="selectNews(item)">
                <div class="news-item__img" [style.backgroundImage]="'url(' + (item.image_url || 'assets/gallery/slide1.jpg') + ')'"></div>
                <div class="news-item__body">
                    <div class="news-item__meta">
                        <span class="badge">{{ item.category }}</span>
                        <time class="mono">{{ item.date }}</time>
                    </div>
                    <h3>{{ item.title }}</h3>
                    <p>{{ item.summary }}</p>
                    <span class="text-link">Читати повний текст наказу / новини →</span>
                </div>
            </article>
        </div>

        <!-- News Detail Modal -->
        <div class="overlay" *ngIf="selected()" (click)="selected.set(null)">
            <div class="modal modal--wide" (click)="$event.stopPropagation()">
                <button class="modal__close" (click)="selected.set(null)">×</button>
                <span class="eyebrow">{{ selected()!.category }} · {{ selected()!.date }}</span>
                <h2>{{ selected()!.title }}</h2>
                <div class="news-modal__image" *ngIf="selected()!.image_url" [style.backgroundImage]="'url(' + selected()!.image_url + ')'"></div>
                <p class="news-modal__summary"><b>{{ selected()!.summary }}</b></p>
                <div class="news-modal__content-box">
                    <p class="news-modal__content" *ngFor="let paragraph of formatParagraphs(selected()!.content)">
                        {{ paragraph }}
                    </p>
                </div>
            </div>
        </div>
    </div>
    `
})
export class NewsComponent implements OnInit {
    private readonly api = inject(ApiService)

    news = signal<NewsItem[]>([])
    query = signal('')
    categoryFilter = signal('')
    selected = signal<NewsItem | null>(null)

    filteredNews = computed(() => {
        const q = this.query().toLowerCase()
        const cat = this.categoryFilter()
        return this.news().filter((n) => {
            if (q && !`${n.title} ${n.summary} ${n.content}`.toLowerCase().includes(q)) return false
            if (cat && n.category !== cat) return false
            return true
        })
    })

    ngOnInit() {
        this.api.news(10).then((data) => this.news.set(data))
    }

    selectNews(n: NewsItem) {
        this.selected.set(n)
    }

    formatParagraphs(text: string): string[] {
        return text ? text.split('\n\n') : []
    }
}

/* ─────────────────────── CONTACTS COMPONENT (POLTAVA + GOOGLE MAP) ─────────────────────── */

@Component({
    selector: 'app-contacts',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page-container">
        <div class="page-head">
            <div>
                <span class="eyebrow">ПУНКТ ПОСТІЙНОЇ ДИСЛОКАЦІЇ</span>
                <h2>Контакти військової частини А3114</h2>
                <p>Офіційні реквізити, розпорядок кадрового прийому та розташування штабу в місті Полтава.</p>
            </div>
        </div>

        <div class="contacts-grid">
            <div class="contact-info-card">
                <h3>Штаб та кадровий орган частини</h3>
                <div class="contact-line">
                    <span class="contact-line__icon">📍</span>
                    <div>
                        <strong>Поштова та юридична адреса:</strong>
                        <p>36000, Україна, Полтавська область, м. Полтава, вул. Соборності, 42</p>
                    </div>
                </div>
                <div class="contact-line">
                    <span class="contact-line__icon">📞</span>
                    <div>
                        <strong>Оперативний черговий частини (цілодобово):</strong>
                        <p class="mono">+380 (532) 50-11-00</p>
                    </div>
                </div>
                <div class="contact-line">
                    <span class="contact-line__icon">🎖</span>
                    <div>
                        <strong>Відділ кадрів та стройової частини:</strong>
                        <p class="mono">+380 (532) 50-11-01 (офіцер з кадрів ст. лейтенант Гнатюк М.І.)</p>
                    </div>
                </div>
                <div class="contact-line">
                    <span class="contact-line__icon">✉</span>
                    <div>
                        <strong>Офіційна електронна адреса:</strong>
                        <p class="mono">hr.a3114.poltava&#64;mil.gov.ua</p>
                    </div>
                </div>
                <div class="contact-line">
                    <span class="contact-line__icon">🕒</span>
                    <div>
                        <strong>Розпорядок особистого прийому:</strong>
                        <p>Вівторок, Четвер: 14:00 – 17:00 (військовослужбовці частини)</p>
                        <p>П\u0027ятниця: 10:00 – 13:00 (члени родин захисників та ветерани)</p>
                    </div>
                </div>
            </div>

            <!-- Google Map Embed for Poltava -->
            <div class="map-card">
                <h3>Схема розташування (м. Полтава)</h3>
                <div class="map-wrap">
                    <iframe [src]="mapUrl"
                            width="100%"
                            height="380"
                            style="border:0;"
                            allowfullscreen=""
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade"
                            title="Карта військової частини А3114 у м. Полтава">
                    </iframe>
                </div>
                <small class="map-note">Орієнтир: центр міста Полтава, Корпусний парк / вул. Соборності.</small>
            </div>
        </div>
    </div>
    `
})
export class ContactsComponent {
    private readonly sanitizer = inject(DomSanitizer)
    mapUrl: SafeResourceUrl

    constructor() {
        const rawUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d82806.7431215112!2d34.48283838292855!3d49.58974229649757!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40d825e42f694e5b%3A0x6b42b3eb67b7d03d!2z0J_QvtC70YLQsNCy0LAsINCf0L7Qu9GC0LDQstGB0YzQutCwINC-0LHQu9Cw0YHRgtGMLCAzNjAwMA!5e0!3m2!1suk!2sua!4v1700000000000!5m2!1suk!2sua'
        this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(rawUrl)
    }
}

/* ─────────────────────── DEPARTMENTS COMPONENT ─────────────────────── */

@Component({
    selector: 'app-departments',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    template: `
    <div class="page-container">
        <div class="page-head">
            <div>
                <span class="eyebrow">ОРГАНІЗАЦІЙНА СТРУКТУРА В/Ч А3114</span>
                <h2>Підрозділи військової частини</h2>
                <p>Огляд командної ланки, начальників служб, умовних кодів та функціональних завдань.</p>
            </div>
            <button *ngIf="auth.isLoggedIn()" class="button button--dark" (click)="openAdd()">
                + Додати новий підрозділ
            </button>
        </div>

        <div class="department-grid">
            <article class="department-card" *ngFor="let d of departments()">
                <div class="department-card__top">
                    <span class="code">{{ d.code }}</span>
                    <span class="count">{{ d.personnel_count || 0 }} ос.</span>
                </div>
                <h3>{{ d.name }}</h3>
                <div class="commander">
                    <span class="avatar">{{ d.commander_name.charAt(0) }}</span>
                    <div>
                        <small>КОМАНДИР / НАЧАЛЬНИК</small>
                        <b>{{ d.commander_name }}</b>
                        <em class="gold">{{ d.commander_rank }}</em>
                    </div>
                </div>
                <p>{{ d.description }}</p>
                <div class="department-card__actions">
                    <a *ngIf="auth.isLoggedIn()"
                       routerLink="/personnel"
                       [queryParams]="{ department: d.id }"
                       class="text-link">
                        Переглянути особовий склад →
                    </a>
                    <span *ngIf="!auth.isLoggedIn()" class="text-link text-link--disabled">
                        Авторизуйтеся як кадровик для списку
                    </span>
                    <button *ngIf="auth.isLoggedIn()" class="icon-button" (click)="edit(d)">✎</button>
                </div>
            </article>
        </div>

        <!-- Department Edit Modal -->
        <div class="overlay" *ngIf="editing" (click)="closeEditing()">
            <div class="modal" (click)="$event.stopPropagation()">
                <button class="modal__close" (click)="closeEditing()">×</button>
                <h2>{{ editing.id ? 'Редагувати підрозділ' : 'Новий штатний підрозділ' }}</h2>
                <form (ngSubmit)="save()">
                    <label>
                        Повна назва підрозділу
                        <input [(ngModel)]="editing.name" name="name" required>
                    </label>
                    <label>
                        Тактичний код підрозділу
                        <input [(ngModel)]="editing.code" name="code" required>
                    </label>
                    <label>
                        Командир / начальник (ПІБ)
                        <input [(ngModel)]="editing.commander_name" name="commander_name" required>
                    </label>
                    <label>
                        Військове звання командира
                        <input [(ngModel)]="editing.commander_rank" name="commander_rank" required>
                    </label>
                    <label>
                        Службовий телефон / позивний
                        <input [(ngModel)]="editing.commander_phone" name="commander_phone">
                    </label>
                    <label>
                        Бойове та функціональне призначення
                        <textarea [(ngModel)]="editing.description" name="description"></textarea>
                    </label>
                    <button class="button button--gold button--full" type="submit">Зберегти підрозділ</button>
                </form>
            </div>
        </div>
    </div>
    `
})
export class DepartmentsComponent implements OnInit {
    private readonly api = inject(ApiService)
    readonly auth = inject(AuthState)

    departments = signal<Department[]>([])
    editing: any = null

    ngOnInit() {
        this.load()
    }

    async load() {
        const departments = await this.api.departments()
        this.departments.set(departments)
    }

    openAdd() {
        this.editing = {
            name: '',
            code: '',
            commander_name: '',
            commander_rank: '',
            commander_phone: '',
            description: ''
        }
    }

    edit(d: Department) {
        this.editing = { ...d }
    }

    closeEditing() {
        this.editing = null
    }

    async save() {
        if (this.editing.id) {
            await this.api.updateDepartment(this.editing.id, this.editing)
        } else {
            await this.api.createDepartment(this.editing)
        }
        this.editing = null
        await this.load()
    }
}

/* ─────────────────────── PERSONNEL COMPONENT ─────────────────────── */

@Component({
    selector: 'app-personnel',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-container">
        <div class="page-head">
            <div>
                <span class="eyebrow">ЗАКРИТИЙ КАБІНЕТ ПОСАДОВОЇ ОСОБИ ВІДДІЛУ КАДРІВ</span>
                <h2>Реєстр особового складу в/ч А3114</h2>
                <p>{{ filtered().length }} військовослужбовців знайдено за поточними критеріями</p>
            </div>
            <button class="button button--gold" (click)="openAdd()">
                + Зарахувати військовослужбовця
            </button>
        </div>

        <div class="toolbar">
            <input class="search"
                   placeholder="Пошук за ПІБ, індивідуальним номером (7 цифр) або штатною посадою..."
                   [ngModel]="query()"
                   (ngModelChange)="query.set($event)">
            <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
                <option value="">Всі статуси служби</option>
                <option>На службі</option>
                <option>У відрядженні</option>
                <option>У відпустці</option>
                <option>На лікуванні</option>
            </select>
            <select [ngModel]="deptFilter()" (ngModelChange)="deptFilter.set($event)">
                <option value="">Всі підрозділи частини</option>
                <option *ngFor="let d of departments()" [value]="d.id">{{ d.name }}</option>
            </select>
            <select [ngModel]="rankCategory()" (ngModelChange)="rankCategory.set($event)">
                <option value="">Всі категорії звань</option>
                <option value="officers">Офіцерський склад</option>
                <option value="sergeants">Сержантський склад</option>
                <option value="soldiers">Рядовий склад (солдати)</option>
            </select>
        </div>

        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Фото</th>
                        <th>Індивідуальний номер</th>
                        <th>ПІБ військовослужбовця</th>
                        <th>Звання / посада</th>
                        <th>Підрозділ</th>
                        <th>Вік</th>
                        <th>Сім. стан</th>
                        <th>Вислуга</th>
                        <th>Статус</th>
                        <th>Дії</th>
                    </tr>
                </thead>
                <tbody>
                    <tr *ngFor="let p of filtered()">
                        <td>
                            <img class="person-avatar" [src]="p.photo_url || 'assets/personnel/person1.jpg'" [alt]="p.full_name">
                        </td>
                        <td class="mono"><b>{{ p.service_number }}</b></td>
                        <td>
                            <b>{{ p.full_name }}</b>
                            <small class="mono">{{ p.phone || '—' }}</small>
                        </td>
                        <td>
                            <span class="gold">{{ p.rank }}</span>
                            <small>{{ p.position }}</small>
                        </td>
                        <td>{{ p.department_name || '—' }}</td>
                        <td>{{ age(p.birth_date) }} р.</td>
                        <td><small>{{ p.marital_status }}</small></td>
                        <td class="mono">{{ p.service_years }} р.</td>
                        <td>
                            <span class="badge" [ngClass]="statusClass(p.status)">{{ p.status }}</span>
                        </td>
                        <td class="actions-cell">
                            <button class="icon-button" title="Особова справа" (click)="viewDetail(p)">👁</button>
                            <button class="icon-button" title="Редагувати" (click)="edit(p)">✎</button>
                            <button class="icon-button danger" title="Зняти з обліку" (click)="remove(p)">×</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Detail Dossier Modal -->
        <div class="overlay" *ngIf="viewing" (click)="closeViewing()">
            <div class="modal modal--wide" (click)="$event.stopPropagation()">
                <button class="modal__close" (click)="closeViewing()">×</button>
                <span class="eyebrow">ОСОБОВА СПРАВА ВІЙСЬКОВОСЛУЖБОВЦЯ · В/Ч А3114</span>
                <h2>{{ viewing.full_name }}</h2>

                <div class="dossier-header">
                    <img class="dossier-photo" [src]="viewing.photo_url || 'assets/personnel/person1.jpg'" [alt]="viewing.full_name">
                    <div class="dossier-main">
                        <div class="detail-item">
                            <span>Індивідуальний номер</span>
                            <strong class="mono gold-mono">{{ viewing.service_number }}</strong>
                        </div>
                        <div class="detail-item">
                            <span>Військове звання</span>
                            <strong class="gold">{{ viewing.rank }}</strong>
                        </div>
                        <div class="detail-item">
                            <span>Штатна посада</span>
                            <strong>{{ viewing.position }}</strong>
                        </div>
                        <div class="detail-item">
                            <span>Підрозділ частини</span>
                            <strong>{{ viewing.department_name || '—' }}</strong>
                        </div>
                    </div>
                </div>

                <div class="detail-grid">
                    <div class="detail-item">
                        <span>Дата народження</span>
                        <strong class="mono">{{ viewing.birth_date }}</strong>
                    </div>
                    <div class="detail-item">
                        <span>Повний вік</span>
                        <strong class="mono">{{ age(viewing.birth_date) }} років</strong>
                    </div>
                    <div class="detail-item">
                        <span>Сімейний стан</span>
                        <strong>{{ viewing.marital_status }}</strong>
                    </div>
                    <div class="detail-item">
                        <span>Кількість неповнолітніх дітей</span>
                        <strong class="mono">{{ viewing.children_count }}</strong>
                    </div>
                    <div class="detail-item">
                        <span>Вислуга років</span>
                        <strong class="mono">{{ viewing.service_years }} р.</strong>
                    </div>
                    <div class="detail-item">
                        <span>Дата призову / підписання контракту</span>
                        <strong class="mono">{{ viewing.enlistment_date }}</strong>
                    </div>
                    <div class="detail-item">
                        <span>Статус проходження служби</span>
                        <strong><span class="badge" [ngClass]="statusClass(viewing.status)">{{ viewing.status }}</span></strong>
                    </div>
                    <div class="detail-item">
                        <span>Контактний номер</span>
                        <strong class="mono">{{ viewing.phone || '—' }}</strong>
                    </div>
                    <div class="detail-item detail-item--full" *ngIf="viewing.notes">
                        <span>Кадрові примітки, нагороди та допуски</span>
                        <strong>{{ viewing.notes }}</strong>
                    </div>
                </div>
                <div class="detail-actions">
                    <button class="button button--dark" (click)="printCard()">🖶 Друк картки особової справи</button>
                    <button class="button button--gold" (click)="editFromViewing(viewing)">✎ Редагувати картку</button>
                </div>
            </div>
        </div>

        <!-- Personnel Edit Modal -->
        <div class="overlay" *ngIf="editing" (click)="closeEditing()">
            <div class="modal modal--wide" (click)="$event.stopPropagation()">
                <button class="modal__close" (click)="closeEditing()">×</button>
                <h2>{{ editing.id ? 'Редагувати картку військовослужбовця' : 'Зарахувати нового військовослужбовця' }}</h2>
                <form class="form-grid" (ngSubmit)="save()">
                    <label>
                        Індивідуальний номер (7 цифр)
                        <input [(ngModel)]="editing.service_number" name="service_number" pattern="[0-9]{7}" placeholder="6284772" required>
                    </label>
                    <label>
                        ПІБ військовослужбовця
                        <input [(ngModel)]="editing.full_name" name="full_name" required>
                    </label>
                    <label>
                        Військове звання
                        <input [(ngModel)]="editing.rank" name="rank" required>
                    </label>
                    <label>
                        Штатна посада
                        <input [(ngModel)]="editing.position" name="position" required>
                    </label>
                    <label>
                        Підрозділ частини
                        <select [(ngModel)]="editing.department_id" name="department_id">
                            <option *ngFor="let d of departments()" [ngValue]="d.id">{{ d.name }}</option>
                        </select>
                    </label>
                    <label>
                        Дата народження
                        <input type="date" [(ngModel)]="editing.birth_date" name="birth_date" required>
                    </label>
                    <label>
                        Сімейний стан
                        <select [(ngModel)]="editing.marital_status" name="marital_status">
                            <option>Одружений</option>
                            <option>Заміжня</option>
                            <option>Неодружений</option>
                            <option>Незаміжня</option>
                            <option>Розлучений(а)</option>
                        </select>
                    </label>
                    <label>
                        Кількість неповнолітніх дітей
                        <input type="number" [(ngModel)]="editing.children_count" name="children_count" min="0">
                    </label>
                    <label>
                        Вислуга років (десятковим дробом)
                        <input type="number" step="0.1" [(ngModel)]="editing.service_years" name="service_years" min="0">
                    </label>
                    <label>
                        Дата призову / контракту
                        <input type="date" [(ngModel)]="editing.enlistment_date" name="enlistment_date">
                    </label>
                    <label>
                        Статус служби
                        <select [(ngModel)]="editing.status" name="status">
                            <option>На службі</option>
                            <option>У відрядженні</option>
                            <option>У відпустці</option>
                            <option>На лікуванні</option>
                        </select>
                    </label>
                    <label>
                        Контактний телефон
                        <input [(ngModel)]="editing.phone" name="phone">
                    </label>
                    <label>
                        Фото військовослужбовця
                        <select [(ngModel)]="editing.photo_url" name="photo_url">
                            <option value="assets/personnel/person1.jpg">Фото 1 (Офіцер штабу / підполковник)</option>
                            <option value="assets/personnel/person2.jpg">Фото 2 (Старший офіцер / майор)</option>
                            <option value="assets/personnel/person3.jpg">Фото 3 (Офіцер кадрів / ст. лейтенант)</option>
                            <option value="assets/personnel/person4.jpg">Фото 4 (Комбат / майор)</option>
                            <option value="assets/personnel/person5.jpg">Фото 5 (Комроти / капітан)</option>
                            <option value="assets/personnel/person6.jpg">Фото 6 (Сержант взводу)</option>
                            <option value="assets/personnel/person7.jpg">Фото 7 (Офіцер розвідки / капітан)</option>
                            <option value="assets/personnel/person8.jpg">Фото 8 (Військовослужбовець розвідки)</option>
                            <option value="assets/personnel/person9.jpg">Фото 9 (Оператор БПЛА / ст. солдат)</option>
                            <option value="assets/personnel/person10.jpg">Фото 10 (Спеціаліст зв\u0027язку / капітан)</option>
                        </select>
                    </label>
                    <label class="full">
                        Кадрові примітки (нагороди, допуски до держтаємниці, особливості контракту)
                        <textarea [(ngModel)]="editing.notes" name="notes"></textarea>
                    </label>
                    <button class="button button--gold full" type="submit">Зберегти картку військовослужбовця</button>
                </form>
            </div>
        </div>
    </div>
    `
})
export class PersonnelComponent implements OnInit {
    private readonly api = inject(ApiService)
    private readonly route = inject(ActivatedRoute)

    personnel = signal<Personnel[]>([])
    departments = signal<Department[]>([])
    query = signal('')
    statusFilter = signal('')
    deptFilter = signal('')
    rankCategory = signal('')
    editing: any = null
    viewing: Personnel | null = null

    private readonly officerRanks = ['Лейтенант', 'Старший лейтенант', 'Капітан', 'Майор', 'Підполковник', 'Полковник', 'Генерал']
    private readonly sergeantRanks = ['Молодший сержант', 'Сержант', 'Старший сержант']

    filtered = computed(() => {
        const q = this.query().toLowerCase()
        const status = this.statusFilter()
        const dept = this.deptFilter()
        const rankCat = this.rankCategory()
        return this.personnel().filter((p) => {
            if (q && !`${p.full_name} ${p.service_number} ${p.position}`.toLowerCase().includes(q)) return false
            if (status && p.status !== status) return false
            if (dept && String(p.department_id) !== String(dept)) return false
            if (rankCat === 'officers' && !this.officerRanks.some((r) => p.rank.includes(r))) return false
            if (rankCat === 'sergeants' && !this.sergeantRanks.some((r) => p.rank.includes(r))) return false
            if (rankCat === 'soldiers' && !['Солдат', 'Старший солдат'].some((r) => p.rank === r)) return false
            return true
        })
    })

    ngOnInit() {
        this.load()
        this.route.queryParams.subscribe((params) => {
            if (params['department']) {
                this.deptFilter.set(params['department'])
            }
        })
    }

    async load() {
        const [personnel, departments] = await Promise.all([
            this.api.personnel(),
            this.api.departments()
        ])
        this.personnel.set(personnel)
        this.departments.set(departments)
    }

    age(date: string): number {
        const d = new Date(date)
        const now = new Date()
        let years = now.getFullYear() - d.getFullYear()
        if (new Date(now.getFullYear(), d.getMonth(), d.getDate()) > now) years--
        return years
    }

    statusClass(s: string): string {
        if (s === 'На службі') return 'badge--active'
        if (s === 'У відпустці') return 'badge--leave'
        if (s === 'У відрядженні') return 'badge--away'
        if (s === 'На лікуванні') return 'badge--medical'
        return 'badge--muted'
    }

    openAdd() {
        this.editing = {
            service_number: '62847' + Math.floor(10 + Math.random() * 90),
            full_name: '',
            rank: 'Солдат',
            position: '',
            department_id: this.departments()[0]?.id,
            birth_date: '1996-01-01',
            marital_status: 'Неодружений',
            children_count: 0,
            service_years: 0,
            enlistment_date: new Date().toISOString().slice(0, 10),
            status: 'На службі',
            phone: '+380 532 60-01-00',
            notes: '',
            photo_url: 'assets/personnel/person1.jpg'
        }
    }

    edit(p: Personnel) {
        this.editing = { ...p }
    }

    closeEditing() {
        this.editing = null
    }

    viewDetail(p: Personnel) {
        this.viewing = { ...p }
    }

    closeViewing() {
        this.viewing = null
    }

    editFromViewing(p: Personnel) {
        this.viewing = null
        this.edit(p)
    }

    printCard() {
        window.print()
    }

    async save() {
        if (this.editing.id) {
            await this.api.updatePersonnel(this.editing.id, this.editing)
        } else {
            await this.api.createPersonnel(this.editing)
        }
        this.editing = null
        const data = await this.api.personnel()
        this.personnel.set(data)
    }

    async remove(p: Personnel) {
        if (confirm(`Зняти з обліку та видалити картку військовослужбовця ${p.full_name} (${p.service_number})?`)) {
            await this.api.deletePersonnel(p.id)
            this.personnel.update((items) => items.filter((x) => x.id !== p.id))
        }
    }
}
