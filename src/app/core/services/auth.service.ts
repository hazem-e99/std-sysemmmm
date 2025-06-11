import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'student';
}

export interface LoginCredentials {
  email: string;
  password: string;
  role: 'admin' | 'student';
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    public router: Router
  ) {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  login(credentials: LoginCredentials): Observable<User> {
    const endpoint = credentials.role === 'admin' ? 'admins' : 'students';
    return this.http.get<any[]>(`${this.apiUrl}/${endpoint}?email=${credentials.email}`).pipe(
      tap(users => {
        const user = users[0];
        if (user && user.password === credentials.password) {
          const currentUser: User = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: credentials.role
          };
          localStorage.setItem('currentUser', JSON.stringify(currentUser));
          this.currentUserSubject.next(currentUser);
        } else {
          throw new Error('Invalid credentials');
        }
      }),
      map(users => {
        const user = users[0];
        if (!user || user.password !== credentials.password) {
          throw new Error('Invalid credentials');
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: credentials.role
        };
      })
    );
  }

  register(credentials: RegisterCredentials): Observable<User> {
    return this.http.post<any>(`${this.apiUrl}/students`, {
      ...credentials,
      id: Date.now().toString() // Generate a unique ID
    }).pipe(
      tap(user => {
        const currentUser: User = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'student'
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        this.currentUserSubject.next(currentUser);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.currentUserSubject.value?.role === 'admin';
  }

  isStudent(): boolean {
    return this.currentUserSubject.value?.role === 'student';
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }
} 