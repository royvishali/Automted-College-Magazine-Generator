import { useState } from 'react';
import { PlusCircle, Trash2, PlusSquare, MinusSquare, Table } from 'lucide-react';

function TableWidget({ table, tableIndex, onUpdate, onDelete }) {
  const { headers = [], rows = [] } = table;

  const setHeader = (i, val) => {
    const h = [...headers]; h[i] = val;
    onUpdate(tableIndex, { ...table, headers: h });
  };

  const setCell = (r, c, val) => {
    const newRows = rows.map(row => [...row]);
    if (!newRows[r]) newRows[r] = [];
    newRows[r][c] = val;
    onUpdate(tableIndex, { ...table, rows: newRows });
  };

  const addColumn = () => {
    onUpdate(tableIndex, {
      ...table,
      headers: [...headers, `Column ${headers.length + 1}`],
      rows: rows.map(r => [...r, '']),
    });
  };

  const addRow = () => {
    onUpdate(tableIndex, { ...table, rows: [...rows, new Array(headers.length).fill('')] });
  };

  const deleteRow = (r) => onUpdate(tableIndex, { ...table, rows: rows.filter((_, i) => i !== r) });
  const deleteCol = (c) => {
    onUpdate(tableIndex, {
      ...table,
      headers: headers.filter((_, i) => i !== c),
      rows: rows.map(r => r.filter((_, i) => i !== c)),
    });
  };

  return (
    <div className="table-widget">
      <div className="table-widget-header">
        <Table size={14} />
        <span>Table {tableIndex + 1}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
          <button className="icon-btn" onClick={addColumn} title="Add Column"><PlusSquare size={14} /></button>
          <button className="icon-btn" onClick={addRow} title="Add Row"><PlusCircle size={14} /></button>
          <button className="icon-btn danger" onClick={() => onDelete(tableIndex)} title="Delete Table"><Trash2 size={14} /></button>
        </div>
      </div>
      <div className="table-scroll">
        <table className="editor-table">
          <thead>
            <tr>
              <th style={{ width: 28 }} />
              {headers.map((h, c) => (
                <th key={c}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      className="table-header-input"
                      value={h}
                      onChange={e => setHeader(c, e.target.value)}
                    />
                    <button className="icon-btn danger micro" onClick={() => deleteCol(c)} title="Delete Column"><MinusSquare size={11} /></button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                <td>
                  <button className="icon-btn danger micro" onClick={() => deleteRow(r)} title="Delete Row"><Trash2 size={11} /></button>
                </td>
                {headers.map((_, c) => (
                  <td key={c}>
                    <input
                      className="table-cell-input"
                      value={row[c] ?? ''}
                      onChange={e => setCell(r, c, e.target.value)}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
        {headers.length} cols · {rows.length} rows
      </div>
    </div>
  );
}

export default function TableEditor({ section, onChange }) {
  const tables = section.tables || [];

  const addTable = () => onChange({ ...section, tables: [...tables, { headers: ['Column 1', 'Column 2', 'Column 3'], rows: [['', '', ''], ['', '', '']] }] });
  const updateTable = (i, updated) => { const t = [...tables]; t[i] = updated; onChange({ ...section, tables: t }); };
  const deleteTable = (i) => onChange({ ...section, tables: tables.filter((_, idx) => idx !== i) });

  const icon = section.type === 'placements' ? '💼' : section.type === 'faculty_achievements' ? '📚' : '🏆';

  return (
    <div className="section-editor">
      <h3 className="editor-section-title">
        {icon} {section.title}
        <span className="count-badge">{tables.length} table{tables.length !== 1 ? 's' : ''}</span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {tables.map((table, i) => (
          <TableWidget key={i} table={table} tableIndex={i} onUpdate={updateTable} onDelete={deleteTable} />
        ))}
      </div>

      <button className="add-btn" onClick={addTable} style={{ marginTop: '1rem' }}>
        <PlusCircle size={16} /> Add Table
      </button>

      {tables.length === 0 && (
        <div className="empty-section-hint">
          No tables yet. Use <strong>AI Data Import</strong> (right panel) to auto-populate from Excel, or click "Add Table" to create manually.
        </div>
      )}
    </div>
  );
}
