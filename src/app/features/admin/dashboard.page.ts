import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  providers: [AuthService],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.css']
})
export class AdminDashboardPage implements OnInit {
  totalExams: number = 0;
  totalQuestions: number = 0;
  totalStudents: number = 0;
  averageScore: number = 0;
  username: string = '';
  currentDate: Date = new Date();
  
  // Trends
  examsTrend: number = 0;
  questionsTrend: number = 0;
  studentsTrend: number = 0;
  scoreTrend: number = 0;

  constructor(
    private http: HttpClient,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
    this.username = this.authService.getCurrentUser()?.name || '';
  }

  loadDashboardData() {
    // Load total exams
    this.http.get<any[]>('http://localhost:3000/exams').subscribe(exams => {
      this.totalExams = exams.length;
      this.calculateExamsTrend(exams);
    });

    // Load total questions
    this.http.get<any[]>('http://localhost:3000/questions').subscribe(questions => {
      this.totalQuestions = questions.length;
      this.calculateQuestionsTrend(questions);
    });

    // Load total students by combining admins and students
    forkJoin({
      admins: this.http.get<any[]>('http://localhost:3000/admins'),
      students: this.http.get<any[]>('http://localhost:3000/students')
    }).subscribe(({ admins, students }) => {
      const allUsers = [...admins, ...students];
      this.totalStudents = students.length; // Only count students
      this.calculateStudentsTrend(allUsers);
    });

    // Load average score
    this.http.get<any[]>('http://localhost:3000/results').subscribe(results => {
      if (results && results.length > 0) {
        const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0);
        this.averageScore = Math.round((totalScore / results.length) * 100) / 100;
        this.calculateScoreTrend(results);
      } else {
        this.averageScore = 0;
      }
    });
  }

  private calculateExamsTrend(exams: any[]) {
    // Calculate trend based on last month's data
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthExams = exams.filter(exam => new Date(exam.createdAt) >= lastMonth).length;
    const previousMonthExams = exams.length - lastMonthExams;
    
    if (previousMonthExams > 0) {
      this.examsTrend = Math.round(((lastMonthExams - previousMonthExams) / previousMonthExams) * 100);
    }
  }

  private calculateQuestionsTrend(questions: any[]) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthQuestions = questions.filter(q => new Date(q.createdAt) >= lastMonth).length;
    const previousMonthQuestions = questions.length - lastMonthQuestions;
    
    if (previousMonthQuestions > 0) {
      this.questionsTrend = Math.round(((lastMonthQuestions - previousMonthQuestions) / previousMonthQuestions) * 100);
    }
  }

  private calculateStudentsTrend(users: any[]) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStudents = users.filter(user => 
      user.role === 'student' && new Date(user.createdAt) >= lastMonth
    ).length;
    const previousMonthStudents = this.totalStudents - lastMonthStudents;
    
    if (previousMonthStudents > 0) {
      this.studentsTrend = Math.round(((lastMonthStudents - previousMonthStudents) / previousMonthStudents) * 100);
    }
  }

  private calculateScoreTrend(results: any[]) {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthResults = results.filter(r => new Date(r.timestamp) >= lastMonth);
    const previousMonthResults = results.filter(r => new Date(r.timestamp) < lastMonth);
    
    if (lastMonthResults.length > 0 && previousMonthResults.length > 0) {
      const lastMonthAvg = lastMonthResults.reduce((sum, r) => sum + r.score, 0) / lastMonthResults.length;
      const previousMonthAvg = previousMonthResults.reduce((sum, r) => sum + r.score, 0) / previousMonthResults.length;
      
      if (previousMonthAvg > 0) {
        this.scoreTrend = Math.round(((lastMonthAvg - previousMonthAvg) / previousMonthAvg) * 100);
      }
    }
  }
}
