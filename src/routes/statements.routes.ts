import { Router } from 'express';

import { CreateTransferController } from '../modules/statements/useCases/createTransfers/CreateTransferController';
import { CreateStatementController } from '../modules/statements/useCases/createStatement/CreateStatementController';
import { GetBalanceController } from '../modules/statements/useCases/getBalance/GetBalanceController';
import { GetStatementOperationController } from '../modules/statements/useCases/getStatementOperation/GetStatementOperationController';
import { ensureAuthenticated } from '../shared/infra/http/middlwares/ensureAuthenticated';

const statementRouter = Router();
const getBalanceController = new GetBalanceController();
const createStatementController = new CreateStatementController();
const getStatementOperationController = new GetStatementOperationController();
const createTransferController = new CreateTransferController();

statementRouter.use(ensureAuthenticated);

statementRouter.get('/balance', getBalanceController.handle);
statementRouter.post('/deposit', createStatementController.handle);
statementRouter.post('/withdraw', createStatementController.handle);
statementRouter.get('/:statement_id', getStatementOperationController.handle);
statementRouter.post('/transfers/:user_id', createTransferController.handle)

export { statementRouter };
