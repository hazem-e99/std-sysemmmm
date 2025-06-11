import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  examId: string;
  marks: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  duration: number;
  totalMarks: number;
}

@Component({
  selector: 'app-admin-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './questions.page.html',
  styleUrls: ['./questions.page.css']
})
export class AdminQuestionsPage implements OnInit {
  questions: Question[] = [];
  filteredQuestions: Question[] = [];
  exams: Exam[] = [];
  totalQuestions: number = 0;
  editingQuestion: Question | null = null;
  editForm: FormGroup;
  showAddForm: boolean = false;
  addForm: FormGroup;
  currentExamId: string | null = null;
  
  // Enhanced filter properties
  selectedExamId: string = '';
  minMarks: number = 0;
  maxMarks: number = 100;
  sortBy: 'marks' | 'exam' | 'none' = 'none';
  sortDirection: 'asc' | 'desc' = 'asc';
  isFiltered: boolean = false;

  constructor(
    private http: HttpClient,
    public router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      text: ['', Validators.required],
      options: this.fb.array([]),
      correctOption: [0, Validators.required],
      examId: ['', Validators.required],
      marks: [5, [Validators.required, Validators.min(1)]]
    });

    this.addForm = this.fb.group({
      text: ['', Validators.required],
      options: this.fb.array([]),
      correctOption: [0, Validators.required],
      examId: ['', Validators.required],
      marks: [5, [Validators.required, Validators.min(1)]]
    });

    // Initialize options array with 4 empty options
    this.initializeOptions();
  }

  private initializeOptions() {
    const optionsArray = this.addForm.get('options') as FormArray;
    optionsArray.clear();
    for (let i = 0; i < 4; i++) {
      optionsArray.push(this.createOptionForm());
    }
  }

  createOptionForm(): FormGroup {
    return this.fb.group({
      text: ['', Validators.required]
    });
  }

  getOptions(form: FormGroup): FormArray {
    return form.get('options') as FormArray;
  }

  getCorrectOptionControl(form: FormGroup): FormControl {
    return form.get('correctOption') as FormControl;
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.currentExamId = params['examId'] || null;
      this.loadExams().then(() => {
        this.loadQuestions();
        if (this.currentExamId) {
          this.addForm.get('examId')?.setValue(this.currentExamId);
          this.editForm.get('examId')?.setValue(this.currentExamId);
        }
      });
    });
  }

  loadQuestions() {
    this.http.get<any[]>('http://localhost:3000/questions').subscribe({
      next: (questions) => {
        this.questions = questions.map(q => ({
            id: q.id,
          text: q.text,
          options: q.options,
          correctOption: q.correctOption,
          examId: q.examId,
          marks: q.marks || 5
        }));
        this.applyFilters();
        this.totalQuestions = this.questions.length;
      },
      error: (error) => {
        console.error('Error loading questions:', error);
      }
    });
  }

  async loadExams(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<Exam[]>('http://localhost:3000/exams').subscribe({
      next: (exams) => {
          this.exams = exams;
          resolve();
      },
      error: (error) => {
        console.error('Error loading exams:', error);
          reject(error);
      }
    });
    });
  }

  getExamTitle(examId: string): string {
    if (!examId) return 'No Exam Assigned';
    const exam = this.exams.find(e => e.id === examId);
    return exam ? exam.title : 'Unknown Exam';
  }

  getTotalMarks(): number {
    return this.filteredQuestions.reduce((total, q) => total + q.marks, 0);
  }

  applyFilters() {
    this.filteredQuestions = this.questions.filter(question => {
      const matchesExam = !this.selectedExamId || 
        question.examId === this.selectedExamId;

      const matchesMarks = question.marks >= this.minMarks && 
        question.marks <= this.maxMarks;

      return matchesExam && matchesMarks;
    });

    // Apply sorting
    if (this.sortBy !== 'none') {
      this.filteredQuestions.sort((a, b) => {
        let comparison = 0;
        switch (this.sortBy) {
          case 'marks':
            comparison = a.marks - b.marks;
            break;
          case 'exam':
            comparison = this.getExamTitle(a.examId).localeCompare(this.getExamTitle(b.examId));
            break;
        }
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    this.isFiltered = this.selectedExamId !== '' || 
                     this.minMarks > 0 || 
                     this.maxMarks < 100 ||
                     this.sortBy !== 'none';
  }

  filterByExam(event: Event) {
    this.selectedExamId = (event.target as HTMLSelectElement).value;
    this.applyFilters();
  }

  filterByMarksRange(event: Event, type: 'min' | 'max') {
    const value = parseInt((event.target as HTMLInputElement).value) || 0;
    if (type === 'min') {
      this.minMarks = value;
    } else {
      this.maxMarks = value;
    }
    this.applyFilters();
  }

  sortQuestions(criteria: 'marks' | 'exam' | 'none') {
    if (this.sortBy === criteria) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = criteria;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  clearFilters() {
    this.selectedExamId = '';
    this.minMarks = 0;
    this.maxMarks = 100;
    this.sortBy = 'none';
    this.sortDirection = 'asc';
    this.applyFilters();
  }

  toggleAddForm() {
    this.showAddForm = !this.showAddForm;
    if (this.showAddForm) {
      this.initializeOptions();
      this.addForm.reset();
      
      // Set initial values
      const initialValues: {
        correctOption: number;
        marks: number;
        examId?: string;
      } = {
        correctOption: 0,
        marks: 5
      };

      // Set examId if available
      if (this.currentExamId) {
        initialValues.examId = this.currentExamId;
      }

      // First set examId separately to ensure it's set
      if (this.currentExamId) {
        this.addForm.get('examId')?.setValue(this.currentExamId);
      }

      // Then set other values
      this.addForm.patchValue(initialValues);
      
      // Force form validation update
      this.addForm.updateValueAndValidity();
    }
  }

  isFormValid(): boolean {
    // Check if all required fields are filled
    const text = this.addForm.get('text')?.value;
    const options = this.getOptions(this.addForm).controls;
    const correctOption = this.addForm.get('correctOption')?.value;
    const marks = this.addForm.get('marks')?.value;
    const examId = this.addForm.get('examId')?.value;

    // Check if all required fields are valid
    const isValid = !!text && 
                   options.every(opt => !!opt.value.text) && 
                   correctOption !== undefined && 
                   marks >= 1 && 
                   (!!examId || !!this.currentExamId);

    return isValid;
  }

  addQuestion() {
    if (this.isFormValid()) {
      const formValue = this.addForm.value;
      const questionData = {
        text: formValue.text,
        options: formValue.options.map((opt: any) => opt.text),
        correctOption: formValue.correctOption,
        examId: formValue.examId || this.currentExamId, // Use current exam ID if form value is empty
        marks: formValue.marks
      };

      this.http.post('http://localhost:3000/questions', questionData).subscribe({
        next: () => {
          this.loadQuestions();
          this.toggleAddForm();
        },
        error: (error) => {
          console.error('Error adding question:', error);
          alert('Failed to add question. Please try again.');
        }
      });
    }
  }

  startEdit(question: Question) {
    this.editingQuestion = question;
    this.editForm.reset();
    
    // Initialize options array
    const optionsArray = this.editForm.get('options') as FormArray;
    optionsArray.clear();
    for (let i = 0; i < 4; i++) {
      optionsArray.push(this.createOptionForm());
    }

    // Set form values
    this.editForm.patchValue({
      text: question.text,
      correctOption: question.correctOption,
      examId: question.examId,
      marks: question.marks
    });

    // Set options values
    question.options.forEach((option, index) => {
      optionsArray.at(index).patchValue({ text: option });
    });
  }

  saveEdit() {
    if (this.editForm.valid && this.editingQuestion) {
      const formValue = this.editForm.value;
      const questionData = {
        text: formValue.text,
        options: formValue.options.map((opt: any) => opt.text),
        correctOption: formValue.correctOption,
        examId: formValue.examId,
        marks: formValue.marks
      };

      this.http.put(`http://localhost:3000/questions/${this.editingQuestion.id}`, questionData).subscribe({
        next: () => {
          this.loadQuestions();
          this.cancelEdit();
        },
        error: (error) => {
          console.error('Error updating question:', error);
          alert('Failed to update question. Please try again.');
        }
      });
    }
  }

  cancelEdit() {
    this.editingQuestion = null;
    this.editForm.reset();
  }

  deleteQuestion(id: string) {
    if (confirm('Are you sure you want to delete this question?')) {
      this.http.delete(`http://localhost:3000/questions/${id}`).subscribe({
        next: () => {
          this.loadQuestions();
        },
        error: (error) => {
          console.error('Error deleting question:', error);
          alert('Failed to delete question. Please try again.');
        }
      });
    }
  }
}
