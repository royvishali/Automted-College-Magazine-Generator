const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const Magazine = require('../models/Magazine');
const Article = require('../models/Article');
const { protect, restrictTo } = require('../middleware/auth');
const logActivity = require('../utils/logActivity');
const { parseUploadedFile } = require('../utils/aiParser');

const router = express.Router();

// ─── Multer for file uploads ───────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads/editor');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls', '.csv', '.docx', '.doc'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Invalid file type. Allowed: xlsx, xls, csv, docx, doc'));
  },
});

// ─── Default Magazine Template ─────────────────────────────────────────────────
function buildDefaultSections() {
  const defs = [
    { type: 'cover', title: 'Cover Page', magazineName: 'ZEPHYR 2025', tagline: 'Voices. Vision. Victory.', departmentName: 'Computer Engineering', collegeName: 'FCRIT', year: '2025' },
    { type: 'toc', title: 'Table of Contents' },
    { type: 'hod_message', title: "HoD's Message", richText: 'Write the HoD message here...', authorName: 'Dr. Name Here', authorPhoto: '' },
    { type: 'dept_details', title: 'Department Overview', richText: 'Department overview text here...', stats: { established: '1994', intake: '60', accreditation: 'NBA', hod: 'Dr. Name' } },
    { type: 'vision_mission', title: 'Vision & Mission / PEOs & PSOs', richText: 'Vision: ...\nMission: ...' },
    { type: 'faculty_profiles', title: 'Faculty Profiles', profiles: [] },
    { type: 'events', title: 'Department Events', events: [] },
    { type: 'cocurricular', title: 'Co-curricular Achievements', tables: [] },
    { type: 'extracurricular', title: 'Extra-curricular Achievements', events: [] },
    { type: 'faculty_achievements', title: 'Faculty Achievements & Publications', tables: [] },
    { type: 'placements', title: 'Campus Placements', tables: [] },
    { type: 'industrial_visits', title: 'Industrial Visits', events: [] },
    { type: 'creative', title: 'Creative Section', articleIds: [] },
    { type: 'committee', title: 'Magazine Committee', profiles: [] },
  ];

  return defs.map((d, i) => ({ id: uuidv4(), order: i, visible: true, ...d }));
}

// ─── GET /api/editor/magazine — Get or create draft ───────────────────────────
router.get('/magazine', protect, async (req, res) => {
  try {
    let magazine = await Magazine.findOne({ status: 'draft' }).sort({ createdAt: -1 });
    if (!magazine) {
      magazine = await Magazine.create({
        sections: buildDefaultSections(),
        createdBy: req.user._id,
      });
    }

    // Populate creative articles
    const creativeSection = magazine.sections.find(s => s.type === 'creative');
    let creativeArticles = [];
    if (creativeSection?.articleIds?.length) {
      creativeArticles = await Article.find({ _id: { $in: creativeSection.articleIds } })
        .populate('author', 'name department').select('title content author department category');
    }

    // Also fetch all approved articles for creative section picker
    const allApproved = await Article.find({ status: 'approved' })
      .populate('author', 'name department').select('title author department category');

    res.json({ success: true, magazine, creativeArticles, allApprovedArticles: allApproved });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/editor/magazine — Create fresh magazine ────────────────────────
router.post('/magazine', protect, restrictTo('lab_assistant'), async (req, res) => {
  try {
    await Magazine.updateMany({ status: 'draft' }, { status: 'archived' });
    const magazine = await Magazine.create({
      name: req.body.name || 'ZEPHYR',
      year: req.body.year || new Date().getFullYear(),
      tagline: req.body.tagline || 'Voices. Vision. Victory.',
      template: req.body.template || 'zephyr-dark',
      sections: buildDefaultSections(),
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, magazine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PUT /api/editor/magazine/:id — Save full magazine ────────────────────────
router.put('/magazine/:id', protect, restrictTo('lab_assistant'), async (req, res) => {
  try {
    const magazine = await Magazine.findByIdAndUpdate(
      req.params.id,
      { $set: { sections: req.body.sections, template: req.body.template, name: req.body.name, tagline: req.body.tagline } },
      { new: true, runValidators: true }
    );
    if (!magazine) return res.status(404).json({ success: false, message: 'Magazine not found' });

    await logActivity({ user: req.user, action: 'MAGAZINE_SAVED', details: 'Magazine editor saved', req, severity: 'info' });
    res.json({ success: true, magazine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/editor/magazine/:id/section/:sectionId — Update single section ─
router.patch('/magazine/:id/section/:sectionId', protect, restrictTo('lab_assistant'), async (req, res) => {
  try {
    const magazine = await Magazine.findById(req.params.id);
    if (!magazine) return res.status(404).json({ success: false, message: 'Magazine not found' });

    const sIdx = magazine.sections.findIndex(s => s.id === req.params.sectionId);
    if (sIdx === -1) return res.status(404).json({ success: false, message: 'Section not found' });

    Object.assign(magazine.sections[sIdx], req.body);
    magazine.markModified('sections');
    await magazine.save();

    res.json({ success: true, section: magazine.sections[sIdx] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/editor/magazine/:id/reorder — Reorder sections ───────────────
router.patch('/magazine/:id/reorder', protect, restrictTo('lab_assistant'), async (req, res) => {
  try {
    const { orderedIds } = req.body; // array of section IDs in new order
    const magazine = await Magazine.findById(req.params.id);
    if (!magazine) return res.status(404).json({ success: false, message: 'Magazine not found' });

    const sectionMap = Object.fromEntries(magazine.sections.map(s => [s.id, s]));
    magazine.sections = orderedIds.map((id, i) => ({ ...sectionMap[id].toObject(), order: i }));
    magazine.markModified('sections');
    await magazine.save();

    res.json({ success: true, sections: magazine.sections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PATCH /api/editor/magazine/:id/publish ────────────────────────────────────
router.patch('/magazine/:id/publish', protect, restrictTo('lab_assistant'), async (req, res) => {
  try {
    const magazine = await Magazine.findByIdAndUpdate(req.params.id, { status: 'published' }, { new: true });
    await logActivity({ user: req.user, action: 'MAGAZINE_PUBLISHED', details: 'Magazine published', req, severity: 'success' });
    res.json({ success: true, magazine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST /api/editor/upload — AI File Parse ──────────────────────────────────
router.post('/upload', protect, restrictTo('lab_assistant'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  try {
    const results = await parseUploadedFile(req.file.path, req.file.originalname);

    // Clean up temp file
    fs.unlink(req.file.path, () => {});

    res.json({
      success: true,
      results,
      message: `Parsed ${results.length} table(s) from "${req.file.originalname}"`,
    });
  } catch (err) {
    fs.unlink(req.file?.path, () => {});
    res.status(400).json({ success: false, message: err.message });
  }
});

// ─── POST /api/editor/upload-image ─────────────────────────────────────────────
const imgStorage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const imgUpload = multer({ storage: imgStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/upload-image', protect, restrictTo('lab_assistant'), imgUpload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
  res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

module.exports = router;
