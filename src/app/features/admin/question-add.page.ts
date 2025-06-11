import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Question {
  text: string;
  options: string[];
  correctOption: number;
  examId: string;
}

@Component({
  selector: 'app-admin-question-add',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './question-add.page.html',
  styleUrls: ['./question-add.page.css']
})
export class AdminQuestionAddPage implements OnInit {
  examId: string = '';
  numberOfQuestions: number = 0;
  questions: Question[] = [];
  currentQuestionIndex: number = 0;
  questionForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.questionForm = this.fb.group({
      text: ['', Validators.required],
      option1: ['', Validators.required],
      option2: ['', Validators.required],
      option3: ['', Validators.required],
      option4: ['', Validators.required],
      correctOption: [0, Validators.required]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['examId']) {
        this.examId = params['examId'];
        console.log('Exam ID:', this.examId);
      } else {
        console.error('No exam ID provided');
        this.router.navigate(['/admin/exams']);
      }
    });
  }

  startAddingQuestions() {
    if (this.numberOfQuestions > 0) {
      this.questions = Array(this.numberOfQuestions).fill(null).map(() => ({
        text: '',
        options: ['', '', '', ''],
        correctOption: 0,
        examId: this.examId
      }));
      this.currentQuestionIndex = 0;
      this.loadCurrentQuestion();
    }
  }

  loadCurrentQuestion() {
    if (this.currentQuestionIndex < this.questions.length) {
      const question = this.questions[this.currentQuestionIndex];
      this.questionForm.patchValue({
        text: question.text,
        option1: question.options[0],
        option2: question.options[1],
        option3: question.options[2],
        option4: question.options[3],
        correctOption: question.correctOption.toString()
      });
    }
  }

  saveCurrentQuestion() {
    if (this.questionForm.valid) {
      const formValue = this.questionForm.value;
      this.questions[this.currentQuestionIndex] = {
        text: formValue.text,
        options: [
          formValue.option1,
          formValue.option2,
          formValue.option3,
          formValue.option4
        ],
        correctOption: parseInt(formValue.correctOption),
        examId: this.examId
      };
    }
  }

  nextQuestion() {
    if (this.questionForm.valid) {
      this.saveCurrentQuestion();
      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
        this.loadCurrentQuestion();
      } else {
        this.saveAllQuestions();
      }
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.saveCurrentQuestion();
      this.currentQuestionIndex--;
      this.loadCurrentQuestion();
    }
  }

  saveAllQuestions() {
    // Save questions one by one
    const saveQuestion = (index: number): Promise<void> => {
      if (index >= this.questions.length) {
        return Promise.resolve();
      }

      const question = {
        ...this.questions[index],
        correctOption: parseInt(this.questions[index].correctOption.toString())
      };

      return new Promise((resolve, reject) => {
        this.http.post('http://localhost:3000/questions', question).subscribe({
          next: () => {
            resolve();
          },
          error: (error) => {
            console.error(`Error saving question ${index + 1}:`, error);
            reject(error);
          }
        });
      });
    };

    // Save all questions sequentially
    const saveAll = async () => {
      try {
        for (let i = 0; i < this.questions.length; i++) {
          await saveQuestion(i);
        }
        this.router.navigate(['/admin/exams']);
      } catch (error) {
        console.error('Error saving questions:', error);
        alert('Failed to save some questions. Please try again.');
      }
    };

    saveAll();
  }

  isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }
}
