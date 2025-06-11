import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1>Create Account</h1>
          <p>Register as a student to take exams</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              formControlName="name" 
              placeholder="Enter your full name"
              [class.error]="isFieldInvalid('name')">
            <div class="error-message" *ngIf="isFieldInvalid('name')">
              Please enter your full name
            </div>
          </div>

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
              Password must be at least 6 characters long
            </div>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              formControlName="confirmPassword" 
              placeholder="Confirm your password"
              [class.error]="isFieldInvalid('confirmPassword')">
            <div class="error-message" *ngIf="isFieldInvalid('confirmPassword')">
              Passwords do not match
            </div>
          </div>

          <div class="error-message" *ngIf="error">
            {{ error }}
          </div>

          <button 
            type="submit" 
            class="register-btn"
            [disabled]="registerForm.invalid || isLoading">
            <span *ngIf="!isLoading">Create Account</span>
            <span *ngIf="isLoading">Creating account...</span>
          </button>
        </form>

        <div class="login-link">
          <p>Already have an account? <a routerLink="/login">Sign in here</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      padding: 1rem;
    }

    .register-card {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .register-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .register-header h1 {
      font-size: 2rem;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .register-header p {
      color: #666;
      margin: 0;
    }

    .register-form {
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

    .register-btn {
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

    .register-btn:hover:not(:disabled) {
      background: #1976D2;
    }

    .register-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .login-link {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .login-link a {
      color: #2196F3;
      text-decoration: none;
      font-weight: 500;
    }

    .login-link a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterPage {
  registerForm: FormGroup;
  isLoading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    const { confirmPassword, ...credentials } = this.registerForm.value;

    this.authService.register(credentials).subscribe({
      next: () => {
        this.router.navigate(['/student/exams']);
      },
      error: (error) => {
        this.error = error.message || 'Failed to register. Please try again.';
        this.isLoading = false;
      }
    });
  }
}
