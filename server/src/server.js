const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const { authenticate, requireAdmin, requireTaOrAdmin } = require('../middleware/auth');
const { notFound, errorHandler } = require('../middleware/errorHandler');
const authRoutes = require('../routes/authRoutes');
const dashboardRoutes = require('../routes/dashboardRoutes');
const publicationRoutes = require('../routes/publicationRoutes');
const eventRoutes = require('../routes/eventRoutes');
const pendingEditRoutes = require('../routes/pendingEditRoutes');
const publicationController = require('../controllers/publicationController');
const eventController = require('../controllers/eventController');
const { startBackupScheduler } = require('../utils/backupScheduler');

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5174', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 250 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
const staticOptions = {
  setHeaders: (res, filePath) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf' || ext === '.docx') {
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    }
  },
};

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), staticOptions));
app.use('/publications/uploads', express.static(path.join(__dirname, '..', 'uploads'), staticOptions));
app.use('/events/uploads', express.static(path.join(__dirname, '..', 'uploads'), staticOptions));

app.get('/health', (req, res) => res.json({ ok: true }));

const prefix = process.env.PATH_PREFIX || '';
const apiRouter = express.Router();

apiRouter.use('/api', authRoutes);
apiRouter.use('/api', pendingEditRoutes);

// Public dashboard and analytics endpoints
apiRouter.use('/api/public', dashboardRoutes);
apiRouter.get('/api/public/publications', publicationController.list);
apiRouter.get('/api/public/events', eventController.list);
apiRouter.get('/api/public/students', publicationController.listStudents);

apiRouter.use('/api', authenticate, requireTaOrAdmin, dashboardRoutes);
apiRouter.use('/api', authenticate, requireTaOrAdmin, publicationRoutes);
apiRouter.use('/api', authenticate, requireTaOrAdmin, eventRoutes);

app.use(prefix, apiRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`CSE Department Portal API running on port ${port}`);
  startBackupScheduler();
});
