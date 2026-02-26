import { TestBed } from '@angular/core/testing';

import { GammeService } from './gamme.service';

describe('GammeService', () => {
  let service: GammeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GammeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
