import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap, map, finalize } from 'rxjs/operators';
import { RouterModule } from '@angular/router';

interface ExamResult {
  id: string;
  examId: string;
  userId: string;
  answers: Array<{
    questionId: string;
    selectedAnswer: string;
  }>;
  timeTaken: number;
  submittedAt: string;
  score: number;
  passed: boolean;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredQuestions: number;
  examTitle: string;
  passingMarks: number;
  questions: Array<{
    id: string;
    questionText: string;
    type: string;
    options: string[];
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
  }>;
}

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  template: `
    <div class="result-container">
      <div *ngIf="isLoading" class="loading">
        <div class="loading-content">
          <i class="fas fa-spinner fa-spin loading-spinner"></i>
          <h2>Loading Result...</h2>
        </div>
      </div>

      <div *ngIf="error" class="error-state">
        <div class="error-content">
          <i class="fas fa-exclamation-circle"></i>
          <h2>An Error Occurred</h2>
          <p>{{ error }}</p>
          <button (click)="loadExamResult()" class="retry-btn">Retry</button>
        </div>
      </div>

      <div *ngIf="result && !isLoading && !error" class="result-content">
        <div class="result-header">
          <h1>Exam Result</h1>
          <h2>{{ result.examTitle }}</h2>
        </div>

        <div class="result-summary">
          <div class="score-display">
            <div class="score-circle" [class.failed]="!result.passed">
              <span class="score-value">{{ result.score | number:'1.0-0' }}%</span>
            </div>
            <div class="score-label">{{ result.passed ? 'Passed' : 'Failed' }}</div>
          </div>

          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">{{ result.passingMarks }}%</div>
              <div class="stat-label">Passing Score</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ result.totalQuestions }}</div>
              <div class="stat-label">Total Questions</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ result.correctAnswers }}</div>
              <div class="stat-label">Correct Answers</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ result.wrongAnswers }}</div>
              <div class="stat-label">Wrong Answers</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ result.unansweredQuestions }}</div>
              <div class="stat-label">Unanswered</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">{{ result.timeTaken }}</div>
              <div class="stat-label">Time Taken (min)</div>
            </div>
          </div>
        </div>

        <div class="question-review">
          <div class="review-header">
            <h2>مراجعة الأسئلة</h2>
          </div>

          <div class="review-list">
            <div *ngFor="let question of result.questions; let i = index" 
                 class="review-item"
                 [class.correct]="question.isCorrect"
                 [class.incorrect]="!question.isCorrect && question.userAnswer"
                 [class.unanswered]="!question.userAnswer">
              
              <div class="question-header">
                <span class="question-number">سؤال {{ i + 1 }}</span>
                <span class="question-status"
                      [class.status-correct]="question.isCorrect"
                      [class.status-incorrect]="!question.isCorrect && question.userAnswer"
                      [class.status-unanswered]="!question.userAnswer">
                  {{ question.isCorrect ? 'إجابة صحيحة' : 
                     (!question.userAnswer ? 'لم يتم الإجابة' : 'إجابة خاطئة') }}
                </span>
              </div>

              <p class="question-text">{{ question.questionText }}</p>

              <div class="options-list">
                <div *ngFor="let option of question.options" 
                     class="option-item"
                     [class.correct-answer]="option === question.correctAnswer"
                     [class.wrong-answer]="option === question.userAnswer && option !== question.correctAnswer">
                  <div class="option-marker">
                    <i class="fas" 
                       [class.fa-check]="option === question.correctAnswer"
                       [class.fa-times]="option === question.userAnswer && option !== question.correctAnswer"></i>
                  </div>
                  <span class="option-text">{{ option }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="text-center">
          <button (click)="goToExams()" class="back-btn">العودة إلى الامتحانات</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .result-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .result-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .result-header h1 {
      font-size: 2rem;
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .result-header h2 {
      font-size: 1.8rem;
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .result-summary {
      background: #ffffff;
      border-radius: 16px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .score-display {
      text-align: center;
      margin-bottom: 2rem;
    }

    .score-circle {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: bold;
      color: white;
      position: relative;
      background: linear-gradient(135deg, #2196F3, #4CAF50);
    }

    .score-circle.failed {
      background: linear-gradient(135deg, #dc3545, #ff6b6b);
    }

    .score-label {
      font-size: 1.2rem;
      color: #666;
      margin-top: 0.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .stat-item {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }

    /* Question Review Section */
    .question-review {
      margin-top: 3rem;
    }

    .review-header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .review-header h2 {
      font-size: 1.8rem;
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .review-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .review-item {
      background: #ffffff;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: 1px solid #e0e0e0;
    }

    .review-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }

    .review-item.correct {
      border-left: 4px solid #4CAF50;
    }

    .review-item.incorrect {
      border-left: 4px solid #dc3545;
    }

    .review-item.unanswered {
      border-left: 4px solid #ffc107;
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .question-number {
      font-size: 1.2rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .question-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
    }

    .status-correct {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status-incorrect {
      background: #ffebee;
      color: #c62828;
    }

    .status-unanswered {
      background: #fff3e0;
      color: #ef6c00;
    }

    .question-text {
      font-size: 1.2rem;
      color: #2c3e50;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .options-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 12px;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    }

    .option-item.correct-answer {
      background: #e8f5e9;
      border-color: #4CAF50;
    }

    .option-item.wrong-answer {
      background: #ffebee;
      border-color: #dc3545;
    }

    .option-marker {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }

    .option-item.correct-answer .option-marker {
      background: #4CAF50;
      color: white;
    }

    .option-item.wrong-answer .option-marker {
      background: #dc3545;
      color: white;
    }

    .option-text {
      flex: 1;
      font-size: 1.1rem;
      color: #2c3e50;
    }

    .option-item.correct-answer .option-text {
      color: #2e7d32;
      font-weight: 500;
    }

    .option-item.wrong-answer .option-text {
      color: #c62828;
      font-weight: 500;
    }

    .explanation {
      margin-top: 1.5rem;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 12px;
      font-size: 1rem;
      color: #666;
      line-height: 1.6;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 2rem;
    }

    .back-btn:hover {
      background: #1976D2;
      transform: translateY(-1px);
    }

    .back-btn i {
      font-size: 1.2rem;
    }

    @media (max-width: 768px) {
      .result-container {
        padding: 1rem;
      }

      .score-circle {
        width: 120px;
        height: 120px;
        font-size: 2rem;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }

      .review-item {
        padding: 1.5rem;
      }

      .question-text {
        font-size: 1.1rem;
      }

      .option-text {
        font-size: 1rem;
      }
    }
  `]
})
export class ExamResultPage implements OnInit {
  result: ExamResult | null = null;
  error: string | null = null;
  isLoading = false;
  examId: string | null = null;
  exam: any;
  apiUrl: string = 'http://localhost:3000';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.examId = this.route.snapshot.params['examId'];
    this.loadExamResult();
  }

  loadExamResult() {
    if (!this.examId) {
      this.error = 'No exam ID provided';
      return;
    }

    this.isLoading = true;
    this.error = null;

    // First get the exam details
    this.http.get<any>(`${this.apiUrl}/exams/${this.examId}`).pipe(
      switchMap(exam => {
        this.exam = exam;
        console.log('Exam details:', exam);
        // Then get the latest submission for this exam
        return this.http.get<any[]>(`${this.apiUrl}/results?examId=${this.examId}&_sort=submittedAt&_order=desc&_limit=1`);
      }),
      map(submissions => {
        if (!submissions || submissions.length === 0) {
          throw new Error('No submission found for this exam');
        }
        console.log('Submission data:', submissions[0]);
        return submissions[0];
      }),
      switchMap(submission => {
        // Get the questions for this exam
        return this.http.get<any[]>(`${this.apiUrl}/questions?examId=${this.examId}`).pipe(
          map(questions => {
            console.log('Questions data:', questions);
            // Calculate score and prepare result
            const totalQuestions = questions.length;
            let correctAnswers = 0;
            let unansweredQuestions = 0;

            // Map questions with user answers and correctness
            const questionsWithAnswers = questions.map(q => {
              // Find user's answer for this question
              const userAnswer = submission.answers.find((a: { questionId: string; selectedAnswer: string }) => a.questionId === q.id);
              
              console.log('Question:', {
                id: q.id,
                text: q.questionText,
                options: q.options
              });
              console.log('User answer:', userAnswer);

              // Check if the answer is correct
              let isCorrect = false;
              if (userAnswer && userAnswer.selectedAnswer) {
                // Find the selected option and the correct option
                const selectedOption = q.options.find((opt: any) => opt.id === userAnswer.selectedAnswer);
                const correctOption = q.options.find((opt: any) => opt.isCorrect);
                
                // Compare the selected option with the correct option
                isCorrect = selectedOption && correctOption && selectedOption.id === correctOption.id;
                
                console.log('Answer comparison:', {
                  selected: selectedOption?.text,
                  correct: correctOption?.text,
                  isCorrect: isCorrect
                });
              } else {
                console.log('No answer provided for this question');
              }

              if (isCorrect) {
                correctAnswers++;
              }
              if (!userAnswer || !userAnswer.selectedAnswer) {
                unansweredQuestions++;
              }

              return {
                ...q,
                userAnswer: userAnswer?.selectedAnswer || '',
                isCorrect,
                correctAnswer: q.options.find((opt: any) => opt.isCorrect)?.text || ''
              };
            });

            // Calculate score
            const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
            const passed = !isNaN(score) && score >= (this.exam.passingMarks || 0);

            // Prepare detailed feedback
            const feedback = {
              ...submission,
              score: Math.round(score * 100) / 100, // Round to 2 decimal places
              passed,
              totalQuestions,
              correctAnswers,
              wrongAnswers: totalQuestions - correctAnswers - unansweredQuestions,
              unansweredQuestions,
              questions: questionsWithAnswers,
              timeTaken: submission.timeTaken || 0,
              submittedAt: submission.submittedAt,
              examTitle: this.exam.title,
              passingMarks: this.exam.passingMarks || 0
            };

            console.log('Detailed exam feedback:', feedback);
            return feedback;
          })
        );
      }),
      finalize(() => {
        this.isLoading = false;
      })
    ).subscribe({
      next: (result) => {
        this.result = result;
        console.log('Final exam result:', result);
      },
      error: (error) => {
        console.error('Error loading exam result:', error);
        this.error = 'Failed to load exam result. Please try again.';
      }
    });
  }

  goToExams() {
    this.router.navigate(['/student/exams']);
  }
} 