import { IsString, MinLength } from 'class-validator';

export class CreateResponseDto {
  @IsString()
  @MinLength(10)
  message: string;
}
