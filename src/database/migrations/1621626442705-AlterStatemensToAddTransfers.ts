import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AlterStatemensToAddTransfers1621626442705 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('statements', 'type');

    await queryRunner.addColumns('statements', [
      new TableColumn(
        {
          name: 'type',
          type: 'enum',
          enum: ['deposit', 'withdraw', 'transfer']
        }),
      new TableColumn(
        {
          name: 'sender_id',
          type: 'uuid',
          isNullable: true
        }
      ),
      new TableColumn(
        {
          name: 'receiver_id',
          type: 'uuid',
          isNullable: true
        }
      )
    ])
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumns('statements', [
      new TableColumn(
        {
          name: 'type',
          type: 'enum',
          enum: ['deposit', 'withdraw', 'transfer']
        }),
      new TableColumn(
        {
          name: 'sender_id',
          type: 'uuid',
          isNullable: true
        }
      ),
      new TableColumn(
        {
          name: 'receiver_id',
          type: 'uuid',
          isNullable: true
        }
      )
    ])

    await queryRunner.addColumn('statements', new TableColumn(
      {
        name: 'type',
        type: 'enum',
        enum: ['deposit', 'withdraw']
        ,
      }))
  }

}
