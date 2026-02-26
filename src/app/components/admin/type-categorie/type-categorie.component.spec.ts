import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypeCategorieComponent } from './type-categorie.component';

describe('TypeCategorieComponent', () => {
  let component: TypeCategorieComponent;
  let fixture: ComponentFixture<TypeCategorieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TypeCategorieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TypeCategorieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
