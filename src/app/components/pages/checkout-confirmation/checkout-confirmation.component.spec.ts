import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckoutConfirmationComponentTsComponent } from './checkout-confirmation.component';

describe('CheckoutConfirmationComponentTsComponent', () => {
  let component: CheckoutConfirmationComponentTsComponent;
  let fixture: ComponentFixture<CheckoutConfirmationComponentTsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CheckoutConfirmationComponentTsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CheckoutConfirmationComponentTsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
