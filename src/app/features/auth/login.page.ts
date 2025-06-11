import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Welcome Back</h1>
          <p>Please sign in to continue</p>
        </div>

        <div class="role-toggle">
          <button 
            [class.active]="selectedRole === 'student'"
            (click)="setRole('student')">
            Student
          </button>
          <button 
            [class.active]="selectedRole === 'admin'"
            (click)="setRole('admin')">
            Admin
          </button>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              placeholder="Enter your email"
              [class.error]="isFieldInvalid('email')">
            <div class="error-message" *ngIf="isFieldInvalid('email')">
              Please enter a valid email address
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              placeholder="Enter your password"
              [class.error]="isFieldInvalid('password')">
            <div class="error-message" *ngIf="isFieldInvalid('password')">
              Password is required
            </div>
          </div>

          <div class="error-message" *ngIf="error">
            {{ error }}
          </div>

          <button 
            type="submit" 
            class="login-btn"
            [disabled]="loginForm.invalid || isLoading">
            <span *ngIf="!isLoading">Sign In</span>
            <span *ngIf="isLoading">Signing in...</span>
          </button>
        </form>

        <div class="register-link" *ngIf="selectedRole === 'student'">
          <p>Don't have an account? <a routerLink="/register">Register here</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      padding: 1rem;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-header h1 {
      font-size: 2rem;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .login-header p {
      color: #666;
      margin: 0;
    }

    .role-toggle {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .role-toggle button {
      flex: 1;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      background: white;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .role-toggle button.active {
      background: #2196F3;
      color: white;
      border-color: #2196F3;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    label {
      font-size: 0.9rem;
      color: #666;
    }

    input {
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s ease;
    }

    input:focus {
      border-color: #2196F3;
      outline: none;
    }

    input.error {
      border-color: #dc3545;
    }

    .error-message {
      color: #dc3545;
      font-size: 0.9rem;
    }

    .login-btn {
      padding: 1rem;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .login-btn:hover:not(:disabled) {
      background: #1976D2;
    }

    .login-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .register-link {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .register-link a {
      color: #2196F3;
      text-decoration: none;
      font-weight: 500;
    }

    .register-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginPage {
  loginForm: FormGroup;
  selectedRole: 'student' | 'admin' = 'student';
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  setRole(role: 'student' | 'admin'): void {
    this.selectedRole = role;
    this.error = null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const credentials = {
      ...this.loginForm.value,
      role: this.selectedRole
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        const redirectPath = this.selectedRole === 'admin' ? '/admin' : '/student/exams';
        this.router.navigate([redirectPath]);
      },
      error: (error) => {
        this.error = error.message || 'Failed to login. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
