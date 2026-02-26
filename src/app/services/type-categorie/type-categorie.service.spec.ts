import { TestBed } from '@angular/core/testing';

import { TypeCategorieService } from './type-categorie.service';

describe('TypeCategorieService', () => {
  let service: TypeCategorieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TypeCategorieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
