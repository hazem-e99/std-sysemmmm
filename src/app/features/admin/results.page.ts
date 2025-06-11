import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { switchMap, map } from 'rxjs/operators';
import { ExamService, Exam, ExamSubmission } from '../../core/services/exam.service';
import { AuthService, User } from '../../core/services/auth.service';

interface Result {
  id: string;
  examId: string;
  userId: string;
  studentName: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  totalMarks: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredQuestions: number;
  passed: boolean;
  passingMarks: number;
  timeTaken: number;
  timestamp: Date;
}

@Component({
  selector: 'app-admin-results',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterModule, NgApexchartsModule],
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.css']
})
export class AdminResultsPage implements OnInit {
  loading = false;
  error: string | null = null;
  results: Result[] = [];
  filteredResults: Result[] = [];
  exams: Exam[] = [];
  totalStudents = 0;
  totalExams = 0;
  averageScore = 0;
  highestScore = 0;
  
  // Filters
  searchTerm = '';
  selectedExamId = '';
  selectedStatus = '';
  selectedScoreRange = '';
  startDate: string | null = null;
  endDate: string | null = null;
  isFiltered: boolean = false;
  showModal = false;
  selectedResult: Result | null = null;

  // Chart Options
  scoreDistributionOptions: any = {
    series: [{
      name: 'Number of Students',
      data: [0, 0, 0, 0, 0]
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
        borderRadius: 10,
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val;
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
      }
    },
    xaxis: {
      categories: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
      position: 'bottom',
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      crosshairs: {
        fill: {
          type: 'gradient',
          gradient: {
            colorFrom: '#D8E3F0',
            colorTo: '#BED1E6',
            stops: [0, 100],
            opacityFrom: 0.4,
            opacityTo: 0.5,
          }
        }
      },
      tooltip: {
        enabled: true,
      }
    },
    yaxis: {
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false,
      },
      labels: {
        show: false,
        formatter: function (val: number) {
          return val;
        }
      }
    },
    title: {
      text: 'Score Distribution',
      floating: true,
      offsetY: 330,
      align: 'center',
      style: {
        color: '#444'
      }
    },
    colors: ['#2196F3'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "horizontal",
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 0.85,
        stops: [50, 100, 100, 100]
      },
    }
  };

  performanceOverTimeOptions: any = {
    series: [{
      name: 'Average Score',
      data: []
    }],
    chart: {
      height: 350,
      type: 'area',
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      categories: [],
      type: 'datetime',
      labels: {
        datetimeUTC: false
      }
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        formatter: function(val: number) {
          return val + '%';
        }
      }
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy'
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 90, 100]
      }
    },
    colors: ['#2E7D32'],
    title: {
      text: 'Performance Over Time',
      align: 'center',
      style: {
        color: '#444'
      }
    }
  };

  passFailOptions: any = {
    series: [0, 0],
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['Passed', 'Failed'],
    colors: ['#2E7D32', '#C62828'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '22px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 600,
              offsetY: -10,
              formatter: function (val: string) {
                return val;
              }
            },
            value: {
              show: true,
              fontSize: '16px',
              fontFamily: 'Helvetica, Arial, sans-serif',
              fontWeight: 400,
              offsetY: 16,
              formatter: function (val: number) {
                return val;
              }
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '16px',
              fontWeight: 600,
              formatter: function (w: any) {
                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
              }
            }
          }
        }
      }
    },
    title: {
      text: 'Pass/Fail Distribution',
      align: 'center',
      style: {
        color: '#444'
      }
    },
    legend: {
      position: 'bottom'
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };

  private apiUrl: string = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private examService: ExamService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadResults();
  }

  async loadResults() {
    try {
      this.loading = true;
      
      // Get all results directly from the results endpoint
      const results = await this.http.get<Result[]>(`${this.apiUrl}/results`).toPromise();
      if (!results) return;
      
      this.results = results;

      // Calculate statistics
      this.totalStudents = new Set(this.results.map(r => r.userId)).size;
      this.totalExams = new Set(this.results.map(r => r.examId)).size;
      this.averageScore = this.results.reduce((acc, curr) => acc + curr.score, 0) / this.results.length;
      this.highestScore = Math.max(...this.results.map(r => r.score));

      // Get unique exams for filter
      const exams = await this.http.get<Exam[]>(`${this.apiUrl}/exams`).toPromise();
      if (exams) {
        this.exams = exams;
      }

      // Update chart data
      this.updateChartData();

      // Apply initial filters
      this.applyFilters();
    } catch (error) {
      console.error('Error loading results:', error);
      this.error = 'An error occurred while loading results';
    } finally {
      this.loading = false;
    }
  }

  updateChartData() {
    // Update Score Distribution
    const distribution = [0, 0, 0, 0, 0];
    this.results.forEach(result => {
      const score = result.score;
      if (score <= 20) distribution[0]++;
      else if (score <= 40) distribution[1]++;
      else if (score <= 60) distribution[2]++;
      else if (score <= 80) distribution[3]++;
      else distribution[4]++;
    });
    this.scoreDistributionOptions.series[0].data = distribution;

    // Update Performance Over Time
    const sortedResults = [...this.results].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const dates = sortedResults.map(r => new Date(r.timestamp).getTime());
    const scores = sortedResults.map(r => r.score);
    
    this.performanceOverTimeOptions.xaxis.categories = dates;
    this.performanceOverTimeOptions.series[0].data = scores;

    // Update Pass/Fail Distribution
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;
    this.passFailOptions.series = [passed, failed];
  }

  calculateStatistics() {
    if (this.results.length > 0) {
      // Calculate total unique students
      const uniqueStudents = new Set(this.results.map(r => r.userId));
      this.totalStudents = uniqueStudents.size;

      // Calculate average score
      const totalScore = this.results.reduce((sum, result) => 
        sum + (result.score / result.totalQuestions * 100), 0);
      this.averageScore = Math.round(totalScore / this.results.length);

      // Calculate highest score
      this.highestScore = Math.max(...this.results.map(result => 
        (result.score / result.totalQuestions * 100)));
    }
  }

  applyFilters() {
    this.filteredResults = this.results.filter(result => {
      const matchesSearch = !this.searchTerm || 
        result.studentName.toLowerCase().includes(this.searchTerm.toLowerCase());
      
      const matchesExam = !this.selectedExamId || 
        result.examId === this.selectedExamId;
      
      const matchesStatus = !this.selectedStatus || 
        (this.selectedStatus === 'passed' && result.passed) ||
        (this.selectedStatus === 'failed' && !result.passed);
      
      const matchesScoreRange = !this.selectedScoreRange || 
        this.isScoreInRange(result.score, this.selectedScoreRange);
      
      const matchesDateRange = this.isDateInRange(result.timestamp);

      return matchesSearch && matchesExam && matchesStatus && matchesScoreRange && matchesDateRange;
    });

    this.isFiltered = this.searchTerm !== '' || 
      this.selectedExamId !== '' || 
      this.selectedStatus !== '' || 
      this.selectedScoreRange !== '' || 
      this.startDate !== null || 
      this.endDate !== null;
  }

  isScoreInRange(score: number, range: string): boolean {
    const [min, max] = range.split('-').map(Number);
    return score >= min && score <= max;
  }

  isDateInRange(date: Date): boolean {
    if (!this.startDate && !this.endDate) return true;
    
    const resultDate = new Date(date);
    const start = this.startDate ? new Date(this.startDate) : null;
    const end = this.endDate ? new Date(this.endDate) : null;
    
    if (start && end) {
      return resultDate >= start && resultDate <= end;
    } else if (start) {
      return resultDate >= start;
    } else if (end) {
      return resultDate <= end;
    }
    
    return true;
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedExamId = '';
    this.selectedStatus = '';
    this.selectedScoreRange = '';
    this.startDate = null;
    this.endDate = null;
    this.applyFilters();
  }

  getStatusClass(result: Result): string {
    if (!result.passed) return 'failed';
    return result.score >= 90 ? 'excellent' : 'passed';
  }

  getStatusText(result: Result): string {
    if (!result.passed) return 'Failed';
    return result.score >= 90 ? 'Excellent' : 'Passed';
  }

  viewDetails(result: Result) {
    this.selectedResult = result;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.selectedResult = null;
  }

  async deleteResult(id: string) {
    if (confirm('Are you sure you want to delete this result?')) {
      try {
        await this.examService.deleteExamSubmission(id).toPromise();
        this.results = this.results.filter(r => r.id !== id);
        this.applyFilters();
      } catch (error) {
        console.error('Error deleting result:', error);
        alert('An error occurred while deleting the result');
      }
    }
  }

  exportResults() {
    const data = this.filteredResults.map(result => ({
      'Student Name': result.studentName,
      'Exam Title': result.examTitle,
      'Score': `${result.correctAnswers}/${result.totalQuestions}`,
      'Percentage': `${result.score.toFixed(1)}%`,
      'Status': this.getStatusText(result),
      'Date': result.timestamp
    }));

    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'exam_results.csv';
    link.click();
  }

  private convertToCSV(data: any[]): string {
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(header => obj[header]));
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}
