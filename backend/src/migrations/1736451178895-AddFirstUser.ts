import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFirstUser1736451178895 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            INSERT INTO users (name, "createdAt", "updatedAt")
            VALUES ('First User', NOW(), NOW());
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM users WHERE name = 'First User';
      `);
  }
}
