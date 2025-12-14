import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let redisService: RedisService;
  let kafkaService: KafkaService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    address: '123 Test St',
    phone: '+1234567890',
    profilePicture: null,
    bankingDetails: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    bankingDetails: {
      upsert: jest.fn(),
    },
  };

  const mockRedisService = {
    setObject: jest.fn(),
    getObject: jest.fn(),
    del: jest.fn(),
  };

  const mockKafkaService = {
    publishUserUpdated: jest.fn(),
    publishBankingDetailsUpdated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: KafkaService,
          useValue: mockKafkaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
    kafkaService = module.get<KafkaService>(KafkaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockRedisService.setObject).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const createUserDto = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOne', () => {
    it('should return a user from cache if available', async () => {
      mockRedisService.getObject.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return a user from database if not in cache', async () => {
      mockRedisService.getObject.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(mockRedisService.setObject).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockRedisService.getObject.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user and invalidate cache', async () => {
      const updateUserDto = { name: 'Updated Name' };

      mockRedisService.getObject.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });

      const result = await service.update('1', updateUserDto);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Name');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(mockKafkaService.publishUserUpdated).toHaveBeenCalled();
    });
  });

  describe('updateBankingDetails', () => {
    it('should update banking details and publish event', async () => {
      const updateBankingDetailsDto = {
        accountNumber: '123456',
        branch: '0001',
        bankName: 'Test Bank',
        accountType: 'CHECKING' as const,
      };

      const mockBankingDetails = {
        id: '1',
        userId: '1',
        ...updateBankingDetailsDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRedisService.getObject.mockResolvedValue(null);
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          ...mockUser,
          bankingDetails: mockBankingDetails,
        });
      mockPrismaService.bankingDetails.upsert.mockResolvedValue(
        mockBankingDetails,
      );

      const result = await service.updateBankingDetails(
        '1',
        updateBankingDetailsDto,
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.bankingDetails.upsert).toHaveBeenCalled();
      expect(mockRedisService.del).toHaveBeenCalled();
      expect(mockKafkaService.publishBankingDetailsUpdated).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete a user and invalidate cache', async () => {
      mockRedisService.getObject.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.delete.mockResolvedValue(mockUser);

      await service.remove('1');

      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockRedisService.del).toHaveBeenCalled();
    });
  });
});
