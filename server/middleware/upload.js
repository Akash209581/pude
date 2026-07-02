const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

function excelFilter(req, file, cb) {
  const allowed = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error('Only Excel or CSV files are allowed.'));
  }
  return cb(null, true);
}

function imageFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed.'));
  }
  return cb(null, true);
}

const excelUpload = multer({
  storage,
  fileFilter: excelFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

const imageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 4 * 1024 * 1024 },
});

function eventFileFilter(req, file, cb) {
  const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error('Only JPG, PNG, and PDF files are allowed.'));
  }
  cb(null, true);
}

const eventUpload = multer({
  storage,
  fileFilter: eventFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit per file
}).fields([
  { name: 'poster', maxCount: 1 },
  { name: 'one_page_report', maxCount: 1 },
  { name: 'winners_list', maxCount: 1 },
  { name: 'sample_certificate', maxCount: 1 },
  { name: 'budget_report', maxCount: 1 },
]);

module.exports = { excelUpload, imageUpload, eventUpload };

