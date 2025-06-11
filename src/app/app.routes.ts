import { Routes } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { inject } from '@angular/core';
import { LoginPage } from './features/auth/login.page';
import { RegisterPage } from './features/auth/register.page';
import { ExamsPage } from './features/student/exams.page';
import { TakeExamPage } from './features/student/take-exam.page';
import { ResultsPage } from './features/student/results.page';
import { AdminLoginPage } from './features/admin/login.page';
import { AdminDashboardPage } from './features/admin/dashboard.page';
import { AdminExamsPage } from './features/admin/exams.page';
import { ExamsAddPage } from './features/admin/exams-add.page';
import { ExamsEditPage } from './features/admin/exams-edit.page';
import { AdminQuestionsPage } from './features/admin/questions.page';
import { AdminQuestionAddPage } from './features/admin/question-add.page';
import { QuestionEditPage } from './features/admin/question-edit.page';
import { AdminResultsPage } from './features/admin/results.page';
import { NotFoundComponent } from './not-found/not-found.component';
import { AdminLayoutComponent } from './features/admin/layout/layout.component';
import { StudentLayoutComponent } from './features/student/layout/layout.component';

const authGuard = () => {
  const authService = inject(AuthService);
  if (authService.isAuthenticated()) {
    return true;
  }
  return authService.router.createUrlTree(['/login']);
};

const adminGuard = () => {
  const authService = inject(AuthService);
  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }
  return authService.router.createUrlTree(['/login']);
};

const studentGuard = () => {
  const authService = inject(AuthService);
  if (authService.isAuthenticated() && authService.isStudent()) {
    return true;
  }
  return authService.router.createUrlTree(['/login']);
};

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    component: AdminLayoutComponent,
    children: [
      { path: '', component: AdminDashboardPage },
      { path: 'login', component: AdminLoginPage },
      { path: 'exams', component: AdminExamsPage },
      { path: 'exams/add', component: ExamsAddPage },
      { path: 'exams/edit/:id', component: ExamsEditPage },
      { path: 'questions', component: AdminQuestionsPage },
      { path: 'questions/add', component: AdminQuestionAddPage },
      { path: 'questions/edit', component: QuestionEditPage },
      { path: 'results', component: AdminResultsPage }
    ]
  },
  {
    path: 'student',
    canActivate: [studentGuard],
    component: StudentLayoutComponent,
    children: [
      { path: '', redirectTo: 'exams', pathMatch: 'full' },
      { path: 'exams', component: ExamsPage },
      { path: 'exams/:examId', component: TakeExamPage },
      { path: 'results', component: ResultsPage },
      { path: 'exams/:examId/result', loadComponent: () => import('./features/student/exam-result.page').then(m => m.ExamResultPage) }
    ]
  },
  { path: '**', component: NotFoundComponent }
];
