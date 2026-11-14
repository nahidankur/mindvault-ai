import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: 'Nahid Hasan' })
  fullName!: string;

  @ApiProperty({ example: '2026-11-14T12:00:00.000Z' })
  createdAt!: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT Access Token for authorization' })
  accessToken!: string;

  @ApiProperty({ description: 'Token expiration duration (e.g. 7d)' })
  expiresIn!: string;

  @ApiProperty({ type: UserProfileDto, description: 'User profile details' })
  user!: UserProfileDto;
}
