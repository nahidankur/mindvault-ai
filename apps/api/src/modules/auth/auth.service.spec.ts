import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '@mindvault/database';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let configService: jest.Mocked<Partial<ConfigService>>;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: '',
    fullName: 'Test User',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('Password123!', 10);
  });

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock_jwt_token_12345'),
    };

    configService = {
      get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
        if (key === 'JWT_EXPIRES_IN') return '7d';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user successfully and return tokens', async () => {
      usersService.findByEmail!.mockResolvedValue(undefined);
      usersService.create!.mockResolvedValue(mockUser);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User',
      });

      expect(result).toHaveProperty('accessToken', 'mock_jwt_token_12345');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        fullName: mockUser.fullName,
        createdAt: mockUser.createdAt.toISOString(),
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersService.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email is already taken', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'Password123!',
          fullName: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);

      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully with valid email and password', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).toHaveProperty('accessToken', 'mock_jwt_token_12345');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException when email not found', async () => {
      usersService.findByEmail!.mockResolvedValue(undefined);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
