import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-exams-add',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './exams-add.page.html',
  styleUrls: ['./exams-add.page.css']
})
export class ExamsAddPage {
  examForm!: FormGroup;
  loading = signal(false);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.initForm();
  }

  private initForm() {
    this.examForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      startTime: ['', [Validators.required]],
      duration: ['', [Validators.required, Validators.min(1)]],
      endTime: [''],
      totalMarks: ['', [Validators.required, Validators.min(1)]]
    });

    // Subscribe to form value changes for debugging
    this.examForm.valueChanges.subscribe(value => {
      console.log('Form Values:', value);
      console.log('Form Valid:', this.examForm.valid);
      console.log('Form Errors:', this.examForm.errors);
      console.log('Form Touched:', this.examForm.touched);
    });
  }

  calculateEndTime() {
    const startTime = this.examForm.get('startTime')?.value;
    const duration = this.examForm.get('duration')?.value;

    if (startTime && duration) {
      const startDate = new Date(startTime);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      // تنسيق التاريخ ليكون مناسبًا لـ datetime-local (YYYY-MM-DDTHH:mm) بتوقيت الجهاز المحلي
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const day = String(endDate.getDate()).padStart(2, '0');
      const hours = String(endDate.getHours()).padStart(2, '0');
      const minutes = String(endDate.getMinutes()).padStart(2, '0');
      const endTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      this.examForm.patchValue({ endTime });
    }
  }

  async onSubmit() {
    console.log('Form submitted');
    console.log('Form valid:', this.examForm.valid);
    console.log('Form values:', this.examForm.value);
    console.log('Form errors:', this.examForm.errors);

    if (this.examForm.invalid) {
      this.markFormGroupTouched(this.examForm);
      return;
    }

    this.loading.set(true);
    try {
      let startTime = this.examForm.get('startTime')?.value;
      let endTime = this.examForm.get('endTime')?.value;
      const formData = {
        ...this.examForm.value,
        startTime,
        endTime
      };

      console.log('Submitting data:', formData);

      const response: any = await this.http.post('http://localhost:3000/exams', formData).toPromise();
      console.log('Response:', response);
      
      this.router.navigate(['/admin/questions/add'], { 
        queryParams: { 
          examId: response.id,
          examTitle: response.title
        }
      });
    } catch (error) {
      console.error('Error creating exam:', error);
      alert('Failed to create exam. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Helper method to check if a field is invalid
  isFieldInvalid(fieldName: string): boolean {
    const field = this.examForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // Helper method to get error message for a field
  getErrorMessage(fieldName: string): string {
    const field = this.examForm.get(fieldName);
    if (!field) return '';

    if (field.errors?.['required']) {
      return `${fieldName} is required`;
    }
    if (field.errors?.['minlength']) {
      return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    if (field.errors?.['min']) {
      return `${fieldName} must be greater than ${field.errors['min'].min}`;
    }
    return '';
  }
}
