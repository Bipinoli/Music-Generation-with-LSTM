import { TestBed } from '@angular/core/testing';

import { MusicGenerationService } from './music-generation.service';

describe('MusicGenerationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MusicGenerationService = TestBed.get(MusicGenerationService);
    expect(service).toBeTruthy();
  });
});
