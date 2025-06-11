import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';

interface ExamSubmission {
  id: string;
  examId: string;
  userId: string;
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
  }>;
  timeTaken: number;
  timestamp: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredQuestions: number;
  examTitle: string;
  passingMarks: number;
  status?: 'completed' | 'failed';
}

interface Exam {
  id: string;
  title: string;
  passingMarks: number;
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, FormsModule, NgApexchartsModule],
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.css']
})
export class ResultsPage implements OnInit {
  submissions: ExamSubmission[] = [];
  exams: Exam[] = [];
  apiUrl: string = 'http://localhost:3000';
  
  // Statistics
  averageScore: number = 0;
  highestScore: number = 0;
  totalExams: number = 0;
  failedExams: number = 0;
  isLoading: boolean = true;
  error: string | null = null;

  // Chart options
  public scoreDistributionChart: any = {
    series: [{
      name: 'Score',
      data: []
    }],
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: [],
      title: {
        text: 'Exams'
      }
    },
    yaxis: {
      title: {
        text: 'Score (%)'
      },
      max: 100
    },
    colors: ['#3498db']
  };

  public performanceChart: any = {
    series: [{
      name: 'Score',
      data: []
    }],
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    markers: {
      size: 4
    },
    xaxis: {
      categories: [],
      title: {
        text: 'Date'
      }
    },
    yaxis: {
      title: {
        text: 'Score (%)'
      },
      max: 100
    },
    colors: ['#2ecc71']
  };

  public statusChart: any = {
    series: [0, 0],
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['Passed', 'Failed'],
    colors: ['#2ecc71', '#e74c3c'],
    legend: {
      position: 'bottom'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadExams();
    this.loadSubmissions();
  }

  loadExams() {
    this.http.get<Exam[]>(`${this.apiUrl}/exams`).subscribe({
      next: (exams) => {
        this.exams = exams;
      },
      error: (error) => {
        console.error('Error loading exams:', error);
        this.error = 'Failed to load exams';
      }
    });
  }

  loadSubmissions() {
    const userId = "2"; // TODO: Get from auth service
    this.http.get<ExamSubmission[]>(`${this.apiUrl}/results?userId=${userId}&_sort=timestamp&_order=desc`)
      .subscribe({
        next: (submissions) => {
          console.log('Raw submissions:', submissions);
          
          // Add failed exams to submissions
          const now = new Date();
          const failedExams: ExamSubmission[] = this.exams.filter(exam => {
            const endTime = new Date(exam.endTime);
            return now > endTime && !submissions.some(sub => sub.examId === exam.id);
          }).map(exam => ({
            id: `failed-${exam.id}`,
            examId: exam.id,
            userId: userId,
            answers: [],
            timeTaken: 0,
            timestamp: exam.endTime,
            score: 0,
            passed: false,
            totalQuestions: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            unansweredQuestions: 0,
            examTitle: exam.title,
            passingMarks: exam.passingMarks,
            status: 'failed' as const
          }));

          // Add status to submissions based on passed field
          const processedSubmissions: ExamSubmission[] = submissions.map(submission => ({
            ...submission,
            status: submission.passed ? 'completed' as const : 'failed' as const
          }));

          this.submissions = [...processedSubmissions, ...failedExams];
          console.log('All submissions after processing:', this.submissions);
          this.calculateStatistics();
        },
        error: (error) => {
          console.error('Error loading submissions:', error);
          this.error = 'Failed to load exam results';
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  calculateStatistics() {
    console.log('Starting calculateStatistics with submissions:', this.submissions);
    
    if (this.submissions.length > 0) {
      // Filter out failed exams and get only completed submissions
      const validSubmissions = this.submissions.filter(submission => 
        submission.status === 'completed' || submission.passed
      );
      console.log('Valid submissions:', validSubmissions);

      // Count failed exams
      this.failedExams = this.submissions.filter(submission => 
        submission.status === 'failed' || !submission.passed
      ).length;
      console.log('Failed exams count:', this.failedExams);

      if (validSubmissions.length > 0) {
        // Calculate average score
        const totalScore = validSubmissions.reduce((sum, submission) => 
          sum + submission.score, 0);
        this.averageScore = Math.round(totalScore / validSubmissions.length);
        console.log('Total score:', totalScore, 'Average score:', this.averageScore);

        // Calculate highest score
        this.highestScore = Math.max(...validSubmissions.map(submission => submission.score));
        console.log('Highest score:', this.highestScore);
      } else {
        this.averageScore = 0;
        this.highestScore = 0;
      }

      // Set total exams
      this.totalExams = this.submissions.length;
      console.log('Total exams:', this.totalExams);

      // Update charts
      this.updateCharts();
    } else {
      this.averageScore = 0;
      this.highestScore = 0;
      this.totalExams = 0;
      this.failedExams = 0;
    }
  }

  getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'very-good';
    if (score >= 70) return 'good';
    if (score >= 60) return 'pass';
    return 'fail';
  }

  getStatusClass(submission: ExamSubmission): string {
    if (submission.status === 'failed') return 'failed';
    return submission.passed ? 'passed' : 'failed';
  }

  getStatusText(submission: ExamSubmission): string {
    if (submission.status === 'failed') return 'Failed';
    return submission.passed ? 'Passed' : 'Failed';
  }

  getTimeTaken(submission: ExamSubmission): string {
    if (submission.status === 'failed') return 'N/A';
    return `${submission.timeTaken} minutes`;
  }

  private updateCharts() {
    // Update Score Distribution Chart
    const validSubmissions = this.submissions.filter(sub => sub.status === 'completed' || sub.passed);
    this.scoreDistributionChart.series[0].data = validSubmissions.map(sub => sub.score);
    this.scoreDistributionChart.xaxis.categories = validSubmissions.map(sub => sub.examTitle);

    // Update Performance Chart
    const sortedSubmissions = [...this.submissions]
      .filter(sub => sub.status === 'completed' || sub.passed)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    this.performanceChart.series[0].data = sortedSubmissions.map(sub => sub.score);
    this.performanceChart.xaxis.categories = sortedSubmissions.map(sub => 
      new Date(sub.timestamp).toLocaleDateString()
    );

    // Update Status Chart
    const passedCount = this.submissions.filter(sub => sub.status === 'completed' || sub.passed).length;
    const failedCount = this.submissions.filter(sub => sub.status === 'failed' || !sub.passed).length;
    this.statusChart.series = [passedCount, failedCount];
  }
}
