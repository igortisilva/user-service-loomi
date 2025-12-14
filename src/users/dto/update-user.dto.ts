import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'John Doe Updated' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '456 New St, City, State' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '+55 11 91234-5678' })
  @IsString()
  @IsOptional()
  phone?: string;
}
