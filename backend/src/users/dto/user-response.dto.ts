export class UserResponseDto {
  id!: number;
  username!: string;
  email!: string | null;
  role!: string;
  first_name!: string | null;
  last_name!: string | null;
  created_at!: Date;
  deleted!: boolean;
}
