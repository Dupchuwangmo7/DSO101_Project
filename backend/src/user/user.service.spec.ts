import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { User } from './user.entity';

const repoFactory = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('UserService', () => {
  let service: UserService;
  let repo: ReturnType<typeof repoFactory>;

  beforeEach(async () => {
    repo = repoFactory();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  describe('findByUsername', () => {
    it('returns the user when found', async () => {
      const user = { id: 1, username: 'alice' } as User;
      repo.findOne.mockResolvedValue(user);
      await expect(service.findByUsername('alice')).resolves.toBe(user);
    });

    it('returns undefined when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findByUsername('nobody')).resolves.toBeUndefined();
    });
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      const user = { id: 5 } as User;
      repo.findOne.mockResolvedValue(user);
      await expect(service.findById(5)).resolves.toBe(user);
    });

    it('returns undefined when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findById(999)).resolves.toBeUndefined();
    });
  });

  describe('register', () => {
    it('throws when username already exists', async () => {
      repo.findOne.mockResolvedValue({ id: 1, username: 'alice' } as User);
      await expect(
        service.register('alice', 'a@b.com', 'pass'),
      ).rejects.toThrow('Username already exists');
    });

    it('creates a user and does not store the raw password', async () => {
      repo.findOne.mockResolvedValue(null);
      const fakeUser = {
        username: 'bob',
        email: 'bob@b.com',
        password: '$2b$hashed',
      } as User;
      repo.create.mockReturnValue(fakeUser);
      const result = await service.register('bob', 'bob@b.com', 'secret');
      expect(repo.create).toHaveBeenCalled();
      expect(result.password).not.toBe('secret');
    });
  });

  describe('validateUser', () => {
    it('returns null when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.validateUser('nobody', 'pass')).resolves.toBeNull();
    });

    it('returns null when password does not match', async () => {
      const hash = await bcrypt.hash('correct', 10);
      repo.findOne.mockResolvedValue({
        id: 1,
        username: 'alice',
        password: hash,
      } as User);
      await expect(
        service.validateUser('alice', 'wrong'),
      ).resolves.toBeNull();
    });

    it('returns the user when credentials are correct', async () => {
      const hash = await bcrypt.hash('correct', 10);
      const user = { id: 1, username: 'alice', password: hash } as User;
      repo.findOne.mockResolvedValue(user);
      await expect(
        service.validateUser('alice', 'correct'),
      ).resolves.toBe(user);
    });
  });

  describe('getOrCreateDemoUser', () => {
    it('returns existing demo user without saving', async () => {
      const demo = { id: 99, username: 'testuser' } as User;
      repo.findOne.mockResolvedValue(demo);
      await expect(service.getOrCreateDemoUser()).resolves.toBe(demo);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates and saves demo user when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      const newDemo = { id: 100, username: 'testuser' } as User;
      repo.create.mockReturnValue(newDemo);
      repo.save.mockResolvedValue(newDemo);
      await expect(service.getOrCreateDemoUser()).resolves.toBe(newDemo);
      expect(repo.save).toHaveBeenCalledWith(newDemo);
    });
  });
});
