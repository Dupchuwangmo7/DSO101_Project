import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PerformanceService } from './performance.service';
import { Performance } from './performance.entity';
import { User } from './user.entity';

const perfRepoFactory = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
});
const userRepoFactory = () => ({
  findOne: jest.fn(),
});

function entry(accuracy: number): Performance {
  return { id: 1, accuracy, label: 'S', createdAt: new Date(), user: {} as User } as Performance;
}

describe('PerformanceService', () => {
  let service: PerformanceService;
  let perfRepo: ReturnType<typeof perfRepoFactory>;
  let userRepo: ReturnType<typeof userRepoFactory>;

  beforeEach(async () => {
    perfRepo = perfRepoFactory();
    userRepo = userRepoFactory();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        { provide: getRepositoryToken(Performance), useValue: perfRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();
    service = module.get<PerformanceService>(PerformanceService);
  });

  // --- computeTotals (pure, no DB) ---

  describe('computeTotals', () => {
    it('returns zeros for an empty list', () => {
      expect(service.computeTotals([])).toEqual({
        quizzesTaken: 0,
        correctRate: 0,
        streak: 0,
      });
    });

    it('counts quizzesTaken', () => {
      expect(service.computeTotals([entry(80), entry(60), entry(90)]).quizzesTaken).toBe(3);
    });

    it('computes average accuracy', () => {
      expect(service.computeTotals([entry(80), entry(60)]).correctRate).toBe(70);
    });

    it('counts trailing streak of sessions >= 70', () => {
      // last two qualify, first does not
      expect(service.computeTotals([entry(50), entry(90), entry(80)]).streak).toBe(2);
    });

    it('streak resets on a session below 70', () => {
      // only the last session qualifies
      expect(service.computeTotals([entry(90), entry(40), entry(80)]).streak).toBe(1);
    });

    it('full streak when all sessions qualify', () => {
      expect(service.computeTotals([entry(70), entry(80), entry(90)]).streak).toBe(3);
    });

    it('streak is 0 when last session is below 70', () => {
      expect(service.computeTotals([entry(90), entry(60)]).streak).toBe(0);
    });
  });

  // --- addEntry ---

  describe('addEntry', () => {
    it('throws when user is not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.addEntry(99, 'S1', 80)).rejects.toThrow('User not found');
    });

    it('creates and saves the entry', async () => {
      const user = { id: 1 } as User;
      userRepo.findOne.mockResolvedValue(user);
      const e = entry(80);
      perfRepo.create.mockReturnValue(e);
      perfRepo.save.mockResolvedValue(e);
      await expect(service.addEntry(1, 'S1', 80)).resolves.toBe(e);
      expect(perfRepo.create).toHaveBeenCalledWith({ user, label: 'S1', accuracy: 80 });
    });
  });

  // --- listForUser ---

  describe('listForUser', () => {
    it('returns entries sorted by createdAt', async () => {
      const entries = [entry(70), entry(80)];
      perfRepo.find.mockResolvedValue(entries);
      await expect(service.listForUser(1)).resolves.toBe(entries);
      expect(perfRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'ASC' } }),
      );
    });
  });
});
