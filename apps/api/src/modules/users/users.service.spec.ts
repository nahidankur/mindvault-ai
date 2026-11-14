import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { DRIZZLE } from '../../database/database.constants';

describe('UsersService', () => {
  let usersService: UsersService;
  let mockDb: any;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: 'hashed_pw',
    fullName: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([mockUser]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([mockUser]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DRIZZLE, useValue: mockDb },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
  });

  describe('findByEmail', () => {
    it('should query user by normalized lowercase email', async () => {
      const user = await usersService.findByEmail('  TEST@EXAMPLE.COM  ');
      expect(user).toEqual(mockUser);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
    });
  });

  describe('findByIdOrThrow', () => {
    it('should return user when found', async () => {
      const user = await usersService.findByIdOrThrow(mockUser.id);
      expect(user).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      await expect(usersService.findByIdOrThrow('unknown-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should insert new user and return it', async () => {
      const newUser = await usersService.create({
        email: 'test@example.com',
        passwordHash: 'hashed_pw',
        fullName: 'Test User',
      });

      expect(newUser).toEqual(mockUser);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalled();
      expect(mockDb.returning).toHaveBeenCalled();
    });
  });
});
