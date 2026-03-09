import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProduitSportComponent } from './produit-sport.component';

describe('ProduitSportComponent', () => {
  let component: ProduitSportComponent;
  let fixture: ComponentFixture<ProduitSportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProduitSportComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProduitSportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
