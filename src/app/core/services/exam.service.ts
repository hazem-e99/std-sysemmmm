import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Exam {
  id: string;
  title: string;
  passingMarks: number;
  questions: any[];
  totalMarks: number;
}

export interface ExamSubmission {
  id: string;
  examId: string;
  userId: string;
  answers: Array<{ isCorrect: boolean }>;
  timeTaken: number;
  timestamp: Date;
  submittedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getExams(): Observable<Exam[]> {
    return this.http.get<Exam[]>(`${this.apiUrl}/exams`);
  }

  getExamById(id: string): Observable<Exam> {
    return this.http.get<Exam>(`${this.apiUrl}/exams/${id}`);
  }

  getExamSubmissions(): Observable<ExamSubmission[]> {
    return this.http.get<ExamSubmission[]>(`${this.apiUrl}/results`);
  }

  deleteExamSubmission(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/results/${id}`);
  }
} 