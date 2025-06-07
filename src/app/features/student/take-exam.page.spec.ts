import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeExamPage } from './take-exam.page';

describe('TakeExamPage', () => {
  let component: TakeExamPage;
  let fixture: ComponentFixture<TakeExamPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeExamPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TakeExamPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
