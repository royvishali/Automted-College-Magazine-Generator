const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const SECTION_TYPES = [
  'cover', 'toc', 'hod_message', 'dept_details', 'vision_mission',
  'faculty_profiles', 'events', 'cocurricular', 'extracurricular',
  'faculty_achievements', 'placements', 'industrial_visits', 'creative', 'committee',
];

const profileSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  designation: { type: String, default: '' },
  qualification: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  date: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
}, { _id: false });

const tableSchema = new mongoose.Schema({
  headers: [{ type: String }],
  rows: [[{ type: String }]],
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  id: { type: String, default: uuidv4 },
  type: { type: String, enum: SECTION_TYPES, required: true },
  title: { type: String, default: '' },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },

  // --- Rich text sections ---
  richText: { type: String, default: '' },         // hod_message, dept_details, vision_mission
  authorName: { type: String, default: '' },        // hod name
  authorPhoto: { type: String, default: '' },

  // --- Cover ---
  coverImageUrl: { type: String, default: '' },
  magazineName: { type: String, default: 'ZEPHYR 2025' },
  tagline: { type: String, default: 'Voices. Vision. Victory.' },
  departmentName: { type: String, default: 'Computer Engineering' },
  collegeName: { type: String, default: 'FCRIT' },
  year: { type: String, default: '2025' },

  // --- Profile grids (faculty, committee) ---
  profiles: { type: [profileSchema], default: [] },

  // --- Events / industrial visits ---
  events: { type: [eventSchema], default: [] },

  // --- Table sections (placements, cocurricular, faculty_achievements) ---
  tables: { type: [tableSchema], default: [] },  // Support multiple tables per section

  // --- Creative section ---
  articleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],

  // --- Dept details extra fields ---
  stats: {
    established: String,
    intake: String,
    accreditation: String,
    hod: String,
  },
}, { _id: false });

const magazineSchema = new mongoose.Schema({
  year: { type: Number, default: () => new Date().getFullYear() },
  name: { type: String, default: 'ZEPHYR' },
  tagline: { type: String, default: 'Voices. Vision. Victory.' },
  template: { type: String, enum: ['zephyr-dark', 'classic-light', 'minimal'], default: 'zephyr-dark' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  sections: { type: [sectionSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Magazine', magazineSchema);
module.exports.SECTION_TYPES = SECTION_TYPES;
