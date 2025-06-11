import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { finalize } from 'rxjs/operators';

interface Question {
  id: string;
  examId: string;
  questionText: string;
  type: string;
  options: {
    id: number;
    text: string;
    isCorrect: boolean;
  }[];
  marks: number;
}

@Component({
  selector: 'app-take-exam',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, ReactiveFormsModule],
  templateUrl: './take-exam.page.html',
  styles: [`
    /* Exam Container */
    .exam-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 2rem;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    }

    /* Header */
    .exam-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .exam-title {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .exam-title i {
      font-size: 1.5rem;
      color: #2196F3;
    }

    .exam-info h1 {
      font-size: 2rem;
      color: #2c3e50;
      margin: 0;
      font-weight: 600;
    }

    .exam-description {
      color: #666;
      margin: 0.5rem 0 0;
      font-size: 1.1rem;
      line-height: 1.5;
    }

    /* Timer */
    .timer {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .timer.safe {
      background: #d1fae5;
      color: #065f46;
    }

    .timer.warning {
      background: #fff3cd;
      color: #856404;
      animation: pulse 1s infinite;
    }

    .timer.danger {
      background: #fee2e2;
      color: #dc2626;
      animation: pulse 0.5s infinite;
    }

    .timer-info {
      display: flex;
      flex-direction: column;
    }

    .timer-label {
      font-size: 0.9rem;
      opacity: 0.8;
    }

    .timer-value {
      font-size: 1.4rem;
      font-weight: 600;
    }

    .timer.safe .timer-value {
      color: #065f46;
    }

    .timer.warning .timer-value {
      color: #856404;
    }

    .timer.danger .timer-value {
      color: #dc2626;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    /* Progress Bar */
    .progress-container {
      margin-bottom: 2rem;
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .progress-label {
      font-size: 1.1rem;
      color: #2c3e50;
      font-weight: 500;
    }

    .progress-percentage {
      font-size: 1.2rem;
      color: #2196F3;
      font-weight: 600;
    }

    .progress-bar-wrapper {
      background: #e9ecef;
      border-radius: 8px;
      overflow: hidden;
      height: 10px;
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #2196F3, #4CAF50);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.9rem;
      color: #666;
      text-align: right;
    }

    /* Questions Form */
    .questions-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .question-card {
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 12px;
      padding: 2rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .question-card:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }

    .question-card.answered {
      border-left: 4px solid #4CAF50;
    }

    .question-card.current {
      border: 2px solid #2196F3;
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #f0f0f0;
    }

    .question-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .question-number {
      font-weight: 600;
      color: #2c3e50;
      font-size: 1.2rem;
    }

    .question-type {
      font-size: 0.9rem;
      color: #666;
      background: #f8f9fa;
      padding: 0.35rem 1rem;
      border-radius: 20px;
    }

    .question-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #4CAF50;
      font-size: 0.9rem;
      background: #e8f5e9;
      padding: 0.5rem 1rem;
      border-radius: 20px;
    }

    .question-text {
      font-size: 1.4rem;
      color: #2c3e50;
      margin: 0 0 2rem;
      line-height: 1.6;
    }

    /* Options */
    .options-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .option-item {
      position: relative;
    }

    .option-input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
    }

    .option-label {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: #f8f9fa;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .option-label:hover {
      background: #f0f0f0;
      border-color: #2196F3;
    }

    .option-marker {
      width: 24px;
      height: 24px;
      border: 2px solid #666;
      border-radius: 50%;
      position: relative;
      transition: all 0.2s ease;
    }

    .option-input:checked + .option-label {
      background: #e3f2fd;
      border-color: #2196F3;
    }

    .option-input:checked + .option-label .option-marker {
      border-color: #2196F3;
    }

    .option-input:checked + .option-label .option-marker::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 12px;
      height: 12px;
      background: #2196F3;
      border-radius: 50%;
    }

    .option-text {
      font-size: 1.1rem;
      color: #2c3e50;
    }

    /* Navigation and Submit */
    .exam-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 2px solid #f0f0f0;
      gap: 1rem;
    }

    .nav-buttons {
      display: flex;
      gap: 1rem;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #f8f9fa;
      border: none;
      border-radius: 8px;
      color: #2c3e50;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .nav-btn:hover:not(:disabled) {
      background: #e9ecef;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .end-exam-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
      position: relative;
      overflow: hidden;
    }

    .end-exam-btn:hover:not(:disabled) {
      background: linear-gradient(135deg, #b91c1c, #991b1b);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
    }

    .end-exam-btn:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
    }

    .end-exam-btn i {
      font-size: 1.2rem;
      transition: transform 0.3s ease;
    }

    .end-exam-btn:hover:not(:disabled) i {
      transform: scale(1.1);
    }

    .end-exam-btn:disabled {
      background: #cbd5e0;
      cursor: not-allowed;
      box-shadow: none;
    }

    @media (max-width: 640px) {
      .exam-actions {
        flex-direction: column;
      }

      .nav-buttons {
        width: 100%;
      }

      .nav-btn, .end-exam-btn {
        flex: 1;
        justify-content: center;
      }
    }

    /* Loading State */
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .loading-content {
      text-align: center;
    }

    .loading-spinner {
      margin-bottom: 1.5rem;
    }

    .loading i {
      font-size: 3.5rem;
      color: #2196F3;
    }

    .loading h2 {
      font-size: 1.5rem;
      color: #2c3e50;
      margin: 0 0 0.5rem;
    }

    .loading-subtext {
      display: block;
      color: #666;
      font-size: 1.1rem;
    }

    /* Confirmation Modal */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .modal-header {
      margin-bottom: 1.5rem;
    }

    .modal-header i {
      font-size: 2.5rem;
      color: #dc3545;
      margin-bottom: 1rem;
    }

    .modal-content h2 {
      color: #2c3e50;
      margin: 0;
      font-size: 1.5rem;
    }

    .modal-body {
      margin-bottom: 2rem;
    }

    .modal-content p {
      color: #666;
      margin: 0.5rem 0;
      font-size: 1.1rem;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .cancel-btn, .confirm-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cancel-btn {
      background: #f8f9fa;
      color: #2c3e50;
    }

    .cancel-btn:hover {
      background: #e9ecef;
      transform: translateY(-2px);
    }

    .confirm-btn {
      background: #dc3545;
      color: white;
    }

    .confirm-btn:hover {
      background: #c82333;
      transform: translateY(-2px);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .exam-container {
        margin: 1rem;
        padding: 1.5rem;
      }

      .exam-header {
        flex-direction: column;
        gap: 1rem;
      }

      .timer {
        width: 100%;
        justify-content: center;
      }

      .question-content {
        padding: 1rem;
      }

      .question-text {
        font-size: 1.1rem;
      }

      .option-label {
        padding: 1rem;
      }

      .exam-actions {
        flex-direction: column;
        gap: 1rem;
      }

      .nav-buttons {
        width: 100%;
        justify-content: space-between;
      }

      .end-exam-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class TakeExamPage implements OnInit, OnDestroy {
  examId: string | null = null;
  exam: any;
  questions: Question[] = [];
  form: FormGroup;
  timeLeft: number = 0;
  examDuration: number = 0;
  timer: any;
  currentQuestionIndex: number = 0;
  showConfirmation: boolean = false;
  answeredQuestions: number = 0;
  totalQuestions: number = 0;
  isLoading: boolean = true;
  error: string | null = null;
  isSubmitting: boolean = false;
  showConfirmModal: boolean = false;
  apiUrl: string = 'http://localhost:3000';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    // Get exam ID from route parameters
    this.route.params.subscribe(params => {
      this.examId = params['examId'];
      if (!this.examId) {
        this.error = 'No exam ID provided';
        this.isLoading = false;
        return;
      }
    this.loadQuestions();
    });
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  loadQuestions() {
    if (!this.examId) {
      this.error = 'No exam ID provided';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.error = null;

    // First, get the exam details to set the timer and backup questions
    this.http.get<any>(`${this.apiUrl}/exams/${this.examId}`).subscribe({
      next: (exam) => {
        if (!exam || !exam.duration) {
          this.error = 'Invalid exam data';
          this.isLoading = false;
          return;
        }
        this.timeLeft = exam.duration * 60;
        this.examDuration = exam.duration * 60;
        this.startTimer();
        this.exam = exam; // احفظ بيانات الامتحان لاستخدام الأسئلة إذا لزم الأمر
      },
      error: (error) => {
        console.error('Error loading exam details:', error);
        this.error = 'Failed to load exam details';
        this.isLoading = false;
      }
    });

    // Then, get the questions
    this.http.get<any[]>(`${this.apiUrl}/questions?examId=${this.examId}`).subscribe({
      next: (rawQuestions) => {
        let questionsToUse = rawQuestions;
        // إذا لم يجد أسئلة، جرب الأسئلة داخل كائن الامتحان
        if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
          if (this.exam && Array.isArray(this.exam.questions) && this.exam.questions.length > 0) {
            questionsToUse = this.exam.questions.map((q: any, idx: number) => ({
              id: String(q.id || idx + 1),
              examId: String(this.examId),
              questionText: String(q.text || q.questionText || ''),
              type: String(q.type || 'multiple_choice'),
              options: Array.isArray(q.options) ? q.options.map((opt: any, i: number) => ({
                id: opt.id || i + 1,
                text: opt.text || String(opt),
                isCorrect: Boolean(opt.isCorrect)
              })) : [],
              marks: Number(q.marks || 5)
            }));
          } else {
            questionsToUse = [];
          }
        }

        // Transform and validate questions
        this.questions = questionsToUse.map(q => {
          if (!q || typeof q !== 'object') {
            return null;
          }
          let options = [];
          if (Array.isArray(q.options)) {
            options = q.options.map((opt: any, index: number) => {
              if (typeof opt === 'object' && opt !== null) {
                return {
                  id: opt.id || index + 1,
                  text: opt.text || String(opt),
                  isCorrect: Boolean(opt.isCorrect)
                };
              }
              return {
                id: index + 1,
                text: String(opt),
                isCorrect: false
              };
            });
          } else if (q.options) {
            options = [{
              id: 1,
              text: String(q.options),
              isCorrect: false
            }];
          }
          return {
            id: String(q.id || ''),
            examId: String(q.examId || this.examId),
            questionText: String(q.questionText || q.text || ''),
            type: String(q.type || 'multiple_choice'),
            options: options,
            marks: Number(q.marks || 5)
          };
        }).filter(q => q !== null) as Question[];

        if (this.questions.length === 0) {
          this.error = 'No questions found for this exam';
          this.isLoading = false;
          return;
        }

        // Initialize form controls
        this.questions.forEach(q => {
          this.form.addControl(q.id, this.fb.control(''));
        });

        // Track answered questions
        this.form.valueChanges.subscribe(() => {
          this.answeredQuestions = Object.values(this.form.value).filter(v => v !== '').length;
        });

        this.isLoading = false;
      },
      error: (error) => {
        // في حال فشل جلب الأسئلة من endpoint، جرب الأسئلة داخل كائن الامتحان
        if (this.exam && Array.isArray(this.exam.questions) && this.exam.questions.length > 0) {
          this.questions = this.exam.questions.map((q: any, idx: number) => ({
            id: String(q.id || idx + 1),
            examId: String(this.examId),
            questionText: String(q.text || q.questionText || ''),
            type: String(q.type || 'multiple_choice'),
            options: Array.isArray(q.options) ? q.options.map((opt: any, i: number) => ({
              id: opt.id || i + 1,
              text: opt.text || String(opt),
              isCorrect: Boolean(opt.isCorrect)
            })) : [],
            marks: Number(q.marks || 5)
          }));
          // Initialize form controls
          this.questions.forEach(q => {
            this.form.addControl(q.id, this.fb.control(''));
          });
          this.form.valueChanges.subscribe(() => {
            this.answeredQuestions = Object.values(this.form.value).filter(v => v !== '').length;
          });
          this.isLoading = false;
        } else {
          this.error = 'Failed to load questions';
          this.isLoading = false;
        }
      }
    });
  }

  startTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        clearInterval(this.timer);
        this.submitExam();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.scrollToQuestion();
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.scrollToQuestion();
    }
  }

  scrollToQuestion() {
    const element = document.querySelector(`[data-question-index="${this.currentQuestionIndex}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  submitExam() {
    this.showConfirmModal = true;
  }

  confirmSubmit() {
    if (!this.examId) {
      console.error('No exam ID available');
      return;
    }

    this.isSubmitting = true;

    const answers = this.questions.map(q => ({
      questionId: q.id,
      selectedAnswer: this.form.get(q.id)?.value || ''
    }));

    const submissionData = {
      examId: this.examId,
      userId: "2", // TODO: Get from auth service
      answers: answers,
      timeTaken: this.examDuration - this.timeLeft,
      submittedAt: new Date().toISOString()
    };

    this.http.post<any>(`${this.apiUrl}/results`, submissionData)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
          this.showConfirmModal = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Exam submitted successfully:', response);
          this.router.navigate(['/student/exams', this.examId, 'result']);
        },
        error: (error) => {
          console.error('Error submitting exam:', error);
          this.error = 'Failed to submit exam. Please try again.';
        }
    });
  }

  endExam() {
    this.showConfirmModal = true;
  }

  confirmEndExam() {
    this.showConfirmModal = false;
    this.confirmSubmit();
  }
}
