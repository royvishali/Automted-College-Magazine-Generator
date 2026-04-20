import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Save, Eye, EyeOff, BookOpen, Zap, RefreshCw, CheckCircle, Settings, BookMarked } from 'lucide-react';
import api from '../api/axios';

import SectionNavigator from '../components/editor/SectionNavigator';
import AiUploadPanel from '../components/editor/AiUploadPanel';

// Section editors
import CoverEditor from '../components/editor/editors/CoverEditor';
import RichTextEditor from '../components/editor/editors/RichTextEditor';
import ProfileGridEditor from '../components/editor/editors/ProfileGridEditor';
import EventEditor from '../components/editor/editors/EventEditor';
import TableEditor from '../components/editor/editors/TableEditor';
import CreativeEditor from '../components/editor/editors/CreativeEditor';

// ─── TOC Preview ──────────────────────────────────────────────────────────────
const TocPreview = ({ sections }) => (
  <div className="section-editor">
    <h3 className="editor-section-title">📋 Table of Contents</h3>
    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
      Auto-generated from visible sections. Reorder sections in the left panel to change TOC order.
    </p>
    <div className="toc-list">
      {sections.filter(s => s.visible && s.type !== 'toc').map((s, i) => (
        <div key={s.id} className="toc-row">
          <span className="toc-num">{String(i + 1).padStart(2, '0')}</span>
          <span className="toc-title">{s.title}</span>
          <span className="toc-dots" />
          <span className="toc-page">{(i + 1) * 2 + 1}</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Section Editor Router ─────────────────────────────────────────────────────
const SectionEditorRouter = ({ section, onChange, allApprovedArticles }) => {
  if (!section) return (
    <div className="editor-empty-state">
      <BookMarked size={48} style={{ opacity: 0.2, display: 'block', margin: '0 auto 1rem' }} />
      <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Select a section from the left panel to start editing</p>
    </div>
  );

  const props = { section, onChange };

  switch (section.type) {
    case 'cover': return <CoverEditor {...props} />;
    case 'toc': return null; // handled separately via <TocPreview>
    case 'hod_message':
    case 'dept_details':
    case 'vision_mission':
      return <RichTextEditor {...props} />;
    case 'faculty_profiles':
    case 'committee':
      return <ProfileGridEditor {...props} />;
    case 'events':
    case 'extracurricular':
    case 'industrial_visits':
      return <EventEditor {...props} />;
    case 'cocurricular':
    case 'faculty_achievements':
    case 'placements':
      return <TableEditor {...props} />;
    case 'creative':
      return <CreativeEditor {...props} allApprovedArticles={allApprovedArticles} />;
    default:
      return <RichTextEditor {...props} />;
  }
};

// ─── Section Properties Panel ──────────────────────────────────────────────────
const SectionSettings = ({ section, onUpdate }) => {
  if (!section) return null;
  return (
    <div className="properties-panel">
      <div className="properties-header"><Settings size={14} /> Properties</div>
      <div className="field-group">
        <label>Section Title</label>
        <input className="editor-input" value={section.title} onChange={e => onUpdate({ ...section, title: e.target.value })} />
      </div>
      <div className="field-group" style={{ marginTop: '0.75rem' }}>
        <label>Visibility</label>
        <button
          className={`btn btn-sm ${section.visible ? 'btn-success' : 'btn-secondary'}`}
          onClick={() => onUpdate({ ...section, visible: !section.visible })}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {section.visible ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Hidden</>}
        </button>
      </div>
      <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Type: <code>{section.type}</code></div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Order: {section.order}</div>
      </div>
    </div>
  );
};

// ─── Main Editor ───────────────────────────────────────────────────────────────
export default function MagazineEditor() {
  const [magazine, setMagazine] = useState(null);
  const [allApprovedArticles, setAllApprovedArticles] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [rightPanel, setRightPanel] = useState('properties'); // properties | ai
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('editor'); // editor | preview

  // Load magazine
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/editor/magazine');
        setMagazine(res.data.magazine);
        setAllApprovedArticles(res.data.allApprovedArticles);
        if (res.data.magazine.sections.length > 0) {
          setActiveSectionId(res.data.magazine.sections[0].id);
        }
      } catch (err) {
        toast.error('Failed to load magazine: ' + (err.response?.data?.message || err.message));
      }
      setLoading(false);
    };
    load();
  }, []);

  const activeSection = magazine?.sections?.find(s => s.id === activeSectionId);

  // Update a section in local state
  const handleSectionChange = useCallback((updatedSection) => {
    setMagazine(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === updatedSection.id ? updatedSection : s),
    }));
    setSaved(false);
  }, []);

  // Reorder
  const handleReorder = useCallback((newSections) => {
    setMagazine(prev => ({ ...prev, sections: newSections }));
    setSaved(false);
  }, []);

  // AI insert table
  const handleInsertTable = useCallback((sectionType, table) => {
    setMagazine(prev => ({
      ...prev,
      sections: prev.sections.map(s => {
        if (s.type === sectionType) {
          return { ...s, tables: [...(s.tables || []), table] };
        }
        return s;
      }),
    }));
    // Navigate to that section
    const target = magazine?.sections?.find(s => s.type === sectionType);
    if (target) setActiveSectionId(target.id);
    setSaved(false);
  }, [magazine]);

  // Save
  const handleSave = async () => {
    if (!magazine) return;
    setSaving(true);
    try {
      await api.put(`/editor/magazine/${magazine._id}`, {
        sections: magazine.sections,
        template: magazine.template,
        name: magazine.name,
        tagline: magazine.tagline,
      });
      setSaved(true);
      toast.success('Magazine saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
    setSaving(false);
  };

  // Publish
  const handlePublish = async () => {
    await handleSave();
    try {
      await api.patch(`/editor/magazine/${magazine._id}/publish`);
      toast.success('🎉 Magazine published!');
      setMagazine(prev => ({ ...prev, status: 'published' }));
    } catch (err) {
      toast.error('Publish failed');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  if (!magazine) return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
      <p style={{ color: 'var(--text-muted)' }}>Could not load magazine. Check your connection.</p>
    </div>
  );

  return (
    <div className="magazine-editor-root">
      {/* ── Top Header Bar ── */}
      <div className="editor-topbar">
        <div className="editor-topbar-left">
          <BookOpen size={18} color="#f72585" />
          <span className="editor-mag-name">{magazine.name} {magazine.year || ''}</span>
          <span className={`status-pill ${magazine.status}`}>{magazine.status}</span>
        </div>

        {/* View toggle */}
        <div className="view-toggle">
          <button className={`view-btn ${view === 'editor' ? 'active' : ''}`} onClick={() => setView('editor')}>
            ✏️ Editor
          </button>
          <button className={`view-btn ${view === 'preview' ? 'active' : ''}`} onClick={() => setView('preview')}>
            👁 Preview
          </button>
        </div>

        <div className="editor-topbar-right">
          <button
            className={`btn btn-sm ${saved ? 'btn-success' : 'btn-secondary'}`}
            onClick={handleSave}
            disabled={saving}
            id="save-btn"
          >
            {saving ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save'}
          </button>
          <button className="btn btn-sm btn-primary" onClick={handlePublish} id="publish-btn">
            <CheckCircle size={14} /> Publish
          </button>
        </div>
      </div>

      {view === 'editor' ? (
        <div className="editor-body">
          {/* ── Left: Section Navigator ── */}
          <SectionNavigator
            sections={[...magazine.sections].sort((a, b) => a.order - b.order)}
            activeId={activeSectionId}
            onSelect={setActiveSectionId}
            onReorder={handleReorder}
            onToggleVisible={(id) => {
              setMagazine(prev => ({
                ...prev,
                sections: prev.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s),
              }));
              setSaved(false);
            }}
          />

          {/* ── Center: Section Editor ── */}
          <div className="editor-canvas">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSectionId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="editor-canvas-inner"
              >
                {activeSection?.type === 'toc'
                  ? <TocPreview sections={magazine.sections.filter(s => s.visible)} />
                  : <SectionEditorRouter
                      section={activeSection}
                      onChange={handleSectionChange}
                      allApprovedArticles={allApprovedArticles}
                    />
                }
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Right: Properties + AI Panel ── */}
          <div className="editor-right-panel">
            <div className="right-tabs">
              <button className={`right-tab ${rightPanel === 'properties' ? 'active' : ''}`} onClick={() => setRightPanel('properties')}>
                <Settings size={14} /> Props
              </button>
              <button className={`right-tab ${rightPanel === 'ai' ? 'active' : ''}`} onClick={() => setRightPanel('ai')}>
                <Zap size={14} /> AI Import
              </button>
            </div>

            {rightPanel === 'properties' ? (
              <SectionSettings
                section={activeSection}
                onUpdate={handleSectionChange}
              />
            ) : (
              <AiUploadPanel
                magazineId={magazine._id}
                sections={magazine.sections}
                onInsertTable={handleInsertTable}
              />
            )}
          </div>
        </div>
      ) : (
        <MagazinePreviewPanel magazine={magazine} allApprovedArticles={allApprovedArticles} />
      )}
    </div>
  );
}

// ─── Full Preview Panel ────────────────────────────────────────────────────────
import HTMLFlipBook from 'react-pageflip';
import { useRef } from 'react';

function MagazinePreviewPanel({ magazine, allApprovedArticles }) {
  const flipRef = useRef();
  const sections = [...magazine.sections].sort((a, b) => a.order - b.order).filter(s => s.visible);

  return (
    <div className="preview-panel">
      <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        🖱️ Click pages or use arrows · {sections.length} sections
      </div>
      <HTMLFlipBook
        ref={flipRef}
        width={400} height={560}
        size="fixed"
        minWidth={280} maxWidth={500}
        minHeight={350} maxHeight={700}
        showCover={true}
        mobileScrollSupport={true}
        style={{ boxShadow: '0 40px 100px rgba(0,0,0,0.7)', margin: '0 auto' }}
      >
        {sections.map((section, i) => (
          <div key={section.id}>
            <PreviewPage section={section} index={i} magazineName={magazine.name} allApprovedArticles={allApprovedArticles} />
          </div>
        ))}
      </HTMLFlipBook>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
        <button className="btn btn-secondary" onClick={() => flipRef.current?.pageFlip().flipPrev()}>◀ Prev</button>
        <button className="btn btn-secondary" onClick={() => flipRef.current?.pageFlip().flipNext()}>Next ▶</button>
      </div>
    </div>
  );
}

function PreviewPage({ section, index, magazineName, allApprovedArticles }) {
  const isCover = section.type === 'cover';
  const baseStyle = {
    height: '100%', padding: '2rem', fontFamily: 'Inter, sans-serif',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    background: isCover
      ? (section.coverImageUrl
        ? `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${section.coverImageUrl}) center/cover`
        : 'linear-gradient(135deg, #0a0a18 0%, #1a1a3e 50%, #0a0a18 100%)')
      : '#fefefe',
    color: isCover ? '#fff' : '#1a1a2e',
  };

  if (isCover) {
    return (
      <div style={baseStyle}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '0.6rem', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '0.75rem' }}>
            {section.collegeName} · {section.departmentName}
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'Georgia, serif', lineHeight: 1.1, marginBottom: '0.5rem' }}>
            {section.magazineName || magazineName}
          </h1>
          <div style={{ width: 36, height: 3, background: '#f72585', borderRadius: 2, margin: '0.75rem auto' }} />
          <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', fontStyle: 'italic' }}>{section.tagline}</div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', opacity: 0.4 }}>{section.year}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={baseStyle}>
      {/* Page header */}
      <div style={{ borderBottom: '2px solid #f72585', paddingBottom: '0.6rem', marginBottom: '0.8rem', flexShrink: 0 }}>
        <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#f72585', fontWeight: 700, marginBottom: '0.2rem' }}>
          {section.type.replace(/_/g, ' ')}
        </div>
        <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>{section.title}</h2>
      </div>

      {/* Section specific content preview */}
      <div style={{ flex: 1, overflow: 'hidden', fontSize: '0.72rem' }}>
        {section.richText && <p style={{ lineHeight: 1.7, color: '#333', display: '-webkit-box', WebkitLineClamp: 20, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{section.richText}</p>}

        {section.profiles?.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
            {section.profiles.slice(0, 6).map((p, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                {p.photoUrl ? <img src={p.photoUrl} alt={p.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eee', margin: '0 auto' }} />}
                <div style={{ fontSize: '0.58rem', fontWeight: 600, marginTop: 4 }}>{p.name}</div>
                <div style={{ fontSize: '0.52rem', color: '#666' }}>{p.designation}</div>
              </div>
            ))}
          </div>
        )}

        {section.tables?.[0] && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.58rem' }}>
              <thead><tr>{section.tables[0].headers.map((h, i) => <th key={i} style={{ padding: '4px', background: '#1a1a2e', color: '#fff', textAlign: 'left', borderBottom: '1px solid #f72585' }}>{h}</th>)}</tr></thead>
              <tbody>{section.tables[0].rows.slice(0, 8).map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c} style={{ padding: '3px 4px', borderBottom: '1px solid #eee', color: '#333' }}>{cell}</td>)}</tr>)}</tbody>
            </table>
            {section.tables[0].rows.length > 8 && <div style={{ textAlign: 'center', color: '#999', marginTop: 4 }}>+{section.tables[0].rows.length - 8} more rows</div>}
          </div>
        )}

        {section.events?.length > 0 && section.events.slice(0, 2).map((ev, i) => (
          <div key={i} style={{ marginBottom: '0.6rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.72rem' }}>{ev.title}</div>
            <div style={{ fontSize: '0.62rem', color: '#888' }}>{ev.date}</div>
            <div style={{ fontSize: '0.62rem', color: '#555', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.description}</div>
          </div>
        ))}

        {section.type === 'toc' && (
          <div style={{ color: '#555' }}>Table of Contents — see all sections</div>
        )}
      </div>

      {/* Page footer */}
      <div style={{ fontSize: '0.55rem', color: '#bbb', textAlign: 'right', flexShrink: 0, borderTop: '1px solid #eee', paddingTop: '0.4rem', marginTop: '0.5rem' }}>
        Page {index + 1} · {magazineName}
      </div>
    </div>
  );
}
