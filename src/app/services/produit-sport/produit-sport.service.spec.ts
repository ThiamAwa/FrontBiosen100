import { TestBed } from '@angular/core/testing';

import { ProduitSportService } from './produit-sport.service';

describe('ProduitSportService', () => {
  let service: ProduitSportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProduitSportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
