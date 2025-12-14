import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateBankingDetailsDto } from './dto/update-banking-details.dto';
import { UserEntity } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly CACHE_TTL = 3600; 
  private readonly CACHE_PREFIX = 'user:';

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private kafka: KafkaService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      include: {
        bankingDetails: true,
      },
    });

    
    await this.cacheUser(user.id, user);

    return new UserEntity(user);
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await this.prisma.user.findMany({
      include: {
        bankingDetails: true,
      },
    });

    return users.map((user) => new UserEntity(user));
  }

  async findOne(id: string): Promise<UserEntity> {
    
    const cachedUser = await this.getCachedUser(id);
    if (cachedUser) {
      return new UserEntity(cachedUser);
    }

    
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        bankingDetails: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    
    await this.cacheUser(id, user);

    return new UserEntity(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        bankingDetails: true,
      },
    });

    if (!user) {
      return null;
    }

    return new UserEntity(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    
    await this.findOne(id);

    
    if (updateUserDto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      include: {
        bankingDetails: true,
      },
    });

    
    await this.invalidateUserCache(id);

    
    await this.kafka.publishUserUpdated(id, updateUserDto);

    return new UserEntity(user);
  }

  async updateBankingDetails(
    id: string,
    updateBankingDetailsDto: UpdateBankingDetailsDto,
  ): Promise<UserEntity> {
    
    await this.findOne(id);

    
    const bankingDetails = await this.prisma.bankingDetails.upsert({
      where: { userId: id },
      create: {
        userId: id,
        ...updateBankingDetailsDto,
      },
      update: updateBankingDetailsDto,
    });

    
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        bankingDetails: true,
      },
    });

    
    await this.invalidateUserCache(id);

    
    await this.kafka.publishBankingDetailsUpdated(id, bankingDetails);

    return new UserEntity(user!);
  }

  async updateProfilePicture(id: string, profilePicture: string): Promise<UserEntity> {
    
    await this.findOne(id);

    
    const user = await this.prisma.user.update({
      where: { id },
      data: { profilePicture },
      include: {
        bankingDetails: true,
      },
    });

    
    await this.invalidateUserCache(id);

    return new UserEntity(user);
  }

  async remove(id: string): Promise<void> {
    
    await this.findOne(id);

    
    await this.prisma.user.delete({
      where: { id },
    });

    
    await this.invalidateUserCache(id);
  }

  
  private async cacheUser(id: string, user: any): Promise<void> {
    const key = `${this.CACHE_PREFIX}${id}`;
    await this.redis.setObject(key, user, this.CACHE_TTL);
  }

  private async getCachedUser(id: string): Promise<any | null> {
    const key = `${this.CACHE_PREFIX}${id}`;
    return await this.redis.getObject(key);
  }

  private async invalidateUserCache(id: string): Promise<void> {
    const key = `${this.CACHE_PREFIX}${id}`;
    await this.redis.del(key);
  }
}
