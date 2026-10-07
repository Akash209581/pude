const path = require('path');
const fs = require('fs');
const multer = require('multer');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const baseName = path.basename(file.originalname).replace(/\0/g, '');
    const ext = path.extname(baseName).toLowerCase();
    const nameWithoutExt = path.basename(baseName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${Date.now()}-${nameWithoutExt}${ext}`);
  },
});

const ALLOWED_EVENT_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.docx']);
const ALLOWED_EVENT_MIMETYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'application/x-zip-compressed',
]);

const FORBIDDEN_EXTENSIONS = new Set([
  '.html', '.htm', '.svg', '.js', '.php', '.exe', '.sh', '.bat', '.cmd',
  '.py', '.pl', '.jsp', '.asp', '.aspx', '.cgi', '.jar', '.vbs', '.scr',
]);

function excelFilter(req, file, cb) {
  const allowed = ['.xlsx', '.xls', '.csv'];
  const baseName = path.basename(file.originalname).replace(/\0/g, '');
  const ext = path.extname(baseName).toLowerCase();
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

function eventFileFilter(req, file, cb) {
  const baseName = path.basename(file.originalname).replace(/\0/g, '');
  const ext = path.extname(baseName).toLowerCase();

  if (FORBIDDEN_EXTENSIONS.has(ext)) {
    return cb(new Error(`Security error: File type '${ext}' is strictly prohibited.`));
  }

  if (!ALLOWED_EVENT_EXTENSIONS.has(ext)) {
    return cb(new Error(`Invalid file type '${ext}'. Allowed types: .pdf, .png, .jpg, .jpeg, .docx`));
  }

  if (!ALLOWED_EVENT_MIMETYPES.has(file.mimetype.toLowerCase())) {
    return cb(new Error(`Invalid MIME type '${file.mimetype}' for extension '${ext}'.`));
  }

  return cb(null, true);
}

function verifyFileSignature(filePath, ext) {
  try {
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    if (ext === '.pdf') {
      return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
    }
    if (ext === '.png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }
    if (ext === '.jpg' || ext === '.jpeg') {
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (ext === '.docx') {
      return buffer[0] === 0x50 && buffer[1] === 0x4b && (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);
    }
    return false;
  } catch (err) {
    return false;
  }
}

function validateEventFileSignatures(req, res, next) {
  if (!req.files) return next();

  for (const fieldName in req.files) {
    const fileList = req.files[fieldName];
    for (const file of fileList) {
      const ext = path.extname(file.filename).toLowerCase();
      if (!verifyFileSignature(file.path, ext)) {
        try { fs.unlinkSync(file.path); } catch (_) {}
        return res.status(400).json({
          message: 'File upload validation failed.',
          errors: [{ msg: `File content does not match signature for extension '${ext}'.`, path: fieldName }],
        });
      }
    }
  }
  return next();
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

const eventUpload = multer({
  storage,
  fileFilter: eventFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'poster', maxCount: 1 },
  { name: 'one_page_report', maxCount: 1 },
  { name: 'winners_list', maxCount: 1 },
  { name: 'sample_certificate', maxCount: 1 },
  { name: 'budget_report', maxCount: 1 },
]);

module.exports = { excelUpload, imageUpload, eventUpload, validateEventFileSignatures, UPLOADS_DIR };

