import { Router } from 'express';
import v1Router from './v1';

const mainRouter = Router();

// Mount all v1 routes under /v1
mainRouter.use('/v1', v1Router);

export default mainRouter;
