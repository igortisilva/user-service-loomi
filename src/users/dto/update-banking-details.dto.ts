import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
}

export class UpdateBankingDetailsDto {
  @ApiProperty({ example: '1234567-8' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({ example: '0001' })
  @IsString()
  @IsNotEmpty()
  branch: string;

  @ApiProperty({ example: 'Banco do Brasil' })
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @ApiPropertyOptional({ 
    example: 'CHECKING',
    enum: AccountType,
    default: 'CHECKING'
  })
  @IsEnum(AccountType)
  @IsOptional()
  accountType?: AccountType;
}
