import { IsEmail, IsIn, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';
import { Role, ROLES } from '../common/constants';

export class RegisterDto {
  @IsIn(ROLES) role: Role;
  @IsEmail() @MaxLength(100) email: string;
  @IsString() @MinLength(8) @MaxLength(100) password: string;
  @IsString() @Length(1, 30) name: string;
  // 고객·라이더 필수, 점주 생략 (서비스에서 확인)
  @IsOptional() @IsString() @Length(1, 20) phone?: string;
}

export class LoginDto {
  @IsIn(ROLES) role: Role;
  @IsString() @MaxLength(100) email: string;
  @IsString() @MaxLength(100) password: string;
}
