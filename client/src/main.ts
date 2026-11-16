import { bootstrapApplication } from '@angular/platform-browser'
import { provideRouter, Routes } from '@angular/router'
import {
    AppComponent,
    HomeComponent,
    AboutComponent,
    GalleryComponent,
    NewsComponent,
    DepartmentsComponent,
    PersonnelComponent,
    ContactsComponent
} from './app/app.component'

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'about', component: AboutComponent },
    { path: 'gallery', component: GalleryComponent },
    { path: 'news', component: NewsComponent },
    { path: 'departments', component: DepartmentsComponent },
    { path: 'personnel', component: PersonnelComponent },
    { path: 'contacts', component: ContactsComponent },
    { path: '**', redirectTo: '' }
]

bootstrapApplication(AppComponent, {
    providers: [provideRouter(routes)]
}).catch((error) => console.error(error))
