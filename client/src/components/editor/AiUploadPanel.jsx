import { useCallback, useRef, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Upload, Zap, CheckCircle, Table, ArrowRight } from 'lucide-react';

const SECTION_LABELS = {
  placements: '💼 Placements',
  cocurricular: '🏆 Co-curricular',
  extracurricular: '🎭 Extra-curricular',
  faculty_achievements: '📚 Faculty Achievements',
  events: '🎪 Events',
  industrial_visits: '🏭 Industrial Visits',
};

export default function AiUploadPanel({ magazineId, sections, onInsertTable }) {
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [results, setResults] = useState(null);
  const inputRef = useRef();

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setParsing(true);
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/editor/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResults(res.data.results);
      toast.success(`Parsed ${res.data.results.length} table(s)!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Parse failed');
    }
    setParsing(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInsert = (result, targetSection) => {
    onInsertTable(targetSection, result.table);
    toast.success(`Table inserted into "${SECTION_LABELS[targetSection] || targetSection}"!`);
    setResults(null);
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <Zap size={16} className="ai-icon" />
        <span>AI Data Import</span>
      </div>

      <p className="ai-desc">Upload an Excel or Word file — AI will detect what it is and place the data in the right section.</p>

      {/* Drop Zone */}
      <div
        className={`ai-dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv,.docx,.doc" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
        {parsing ? (
          <div className="ai-parsing">
            <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 0.5rem' }} />
            <div>Analyzing with AI...</div>
          </div>
        ) : (
          <>
            <Upload size={28} style={{ opacity: 0.5, margin: '0 auto 0.5rem', display: 'block' }} />
            <div style={{ fontSize: '0.8rem', textAlign: 'center', opacity: 0.7 }}>
              Drop <strong>.xlsx</strong>, <strong>.csv</strong>, or <strong>.docx</strong> here<br />or click to browse
            </div>
          </>
        )}
      </div>

      {/* Results */}
      {results && results.map((result, i) => (
        <div key={i} className="ai-result-card">
          <div className="ai-result-header">
            <CheckCircle size={14} color="#06d6a0" />
            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
              Sheet: {result.sheetName}
            </span>
            <span className={`ai-confidence ${result.confidence}`}>{result.confidence}</span>
          </div>

          <div className="ai-suggested">
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>AI suggests:</span>
            <span className="ai-suggestion-badge">{SECTION_LABELS[result.suggestedSection] || result.suggestedSection}</span>
          </div>

          {result.aiReason && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0.3rem 0' }}>ℹ️ {result.aiReason}</p>
          )}

          {/* Mini table preview */}
          <div className="ai-table-preview">
            <Table size={12} style={{ marginBottom: 4 }} />
            <div style={{ fontSize: '0.72rem', opacity: 0.8 }}>
              {result.table.headers.slice(0, 4).join(' · ')}
              {result.table.headers.length > 4 && ` +${result.table.headers.length - 4}`}
            </div>
            <div style={{ fontSize: '0.68rem', opacity: 0.5 }}>{result.table.rows.length} rows</div>
          </div>

          {/* Insert buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleInsert(result, result.suggestedSection)}
              style={{ fontSize: '0.75rem' }}
            >
              <ArrowRight size={12} /> Insert into {SECTION_LABELS[result.suggestedSection]?.split(' ')[1] || 'Section'}
            </button>
            {/* Custom section picker */}
            <select
              className="ai-section-select"
              defaultValue=""
              onChange={e => { if (e.target.value) handleInsert(result, e.target.value); }}
            >
              <option value="" disabled>Or insert into another section…</option>
              {Object.entries(SECTION_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      ))}

      {!results && !parsing && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.6 }}>
          <strong>Examples:</strong><br />
          📊 Placement list → Placements section<br />
          🏆 Awards table → Co-curricular section<br />
          📄 Research papers → Faculty Achievements
        </div>
      )}
    </div>
  );
}
