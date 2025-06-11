import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface Exam {
  id: number;
  title: string;
  description: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-exams',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, FormsModule],
  templateUrl: './exams.page.html',
  styleUrls: ['./exams.page.css']
})
export class AdminExamsPage implements OnInit {
  exams: Exam[] = [];
  filteredExams: Exam[] = [];
  totalExams: number = 0;
  totalQuestions: number = 0;
  totalStudents: number = 0;
  examsGrowth: number = 0;
  questionsGrowth: number = 0;
  studentsGrowth: number = 0;
  searchQuery: string = '';
  sortBy: string = 'newest';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadExams();
    this.loadStatistics();
  }

  loadExams() {
    this.http.get<Exam[]>('http://localhost:3000/exams').subscribe(exams => {
      this.exams = exams;
      this.filterExams();
      this.totalExams = exams.length;
      this.loadTotalQuestions();
    });
  }

  loadTotalQuestions() {
    this.http.get<any[]>('http://localhost:3000/questions').subscribe(questions => {
      this.totalQuestions = questions.length;
    });
  }

  loadStatistics() {
    // This should be replaced with actual API calls
    this.totalStudents = 150;
    this.examsGrowth = 15;
    this.questionsGrowth = 25;
    this.studentsGrowth = 10;
  }

  filterExams() {
    let filtered = [...this.exams];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(exam => 
        exam.title.toLowerCase().includes(query) || 
        exam.description.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'duration':
        filtered.sort((a, b) => a.duration - b.duration);
        break;
    }

    this.filteredExams = filtered;
  }

  deleteExam(id: number) {
    if (confirm('Are you sure you want to delete this exam?')) {
      this.http.delete(`http://localhost:3000/exams/${id}`).subscribe(() => {
        this.exams = this.exams.filter(exam => exam.id !== id);
        this.filterExams();
        this.totalExams = this.exams.length;
        this.loadTotalQuestions();
      });
    }
  }
}
