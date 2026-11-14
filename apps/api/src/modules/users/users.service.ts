import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleDatabase, users, User, NewUser } from '@mindvault/database';
import { DRIZZLE } from '../../database/database.constants';

@Injectable()
export class UsersService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: DrizzleDatabase,
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    const normalizedEmail = email.toLowerCase().trim();
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    return result[0];
  }

  async findById(id: string): Promise<User | undefined> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0];
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async create(data: NewUser): Promise<User> {
    const normalizedData = {
      ...data,
      email: data.email.toLowerCase().trim(),
    };

    const result = await this.db
      .insert(users)
      .values(normalizedData)
      .returning();

    return result[0];
  }
}
