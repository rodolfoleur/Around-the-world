import { useState } from 'react';
import { TERRA, BLUE, GOLD, PLUM, SAGE } from '../../data/trip.js';

const CATEGORIES = ['Clothing', 'Toiletries', 'Documents', 'Electronics', 'Meds', 'Misc'];
const CATEGORY_COLOR = { Clothing: TERRA, Toiletries: BLUE, Documents: GOLD, Electronics: PLUM, Meds: SAGE };

/** Small round initial badge — same visual language as the world map's
 * per-visitor markers, so "whose job is this" reads the same way it does
 * there. No member picked (shared item, e.g. "passports") shows no badge. */
function AssigneeBadge({ member, size = 18 }) {
  if (!member) return null;
  return (
    <span
      title={member.display_name}
      style={{
        width: size, height: size, borderRadius: 999, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: member.color, color: '#fff', fontSize: size * 0.5, fontWeight: 700, fontFamily: 'ui-monospace, monospace',
      }}
    >
      {(member.display_name?.[0] || '?').toUpperCase()}
    </span>
  );
}

function AddPackingRow({ members, onAdd }) {
  const [text, setText] = useState('');
  const [category, setCategory] = useState('Clothing');
  const [assignee, setAssignee] = useState(null); // null = shared/either

  const submit = () => {
    if (onAdd(text, category, assignee)) setText('');
  };

  return (
    <div className="card" style={{ padding: 14, marginBottom: 18 }}>
      <input
        type="text"
        placeholder="Add something to pack…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        style={{ marginBottom: 10 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: members.length ? 10 : 0 }}>
        {CATEGORIES.map((c) => (
          <button key={c} type="button" className={'pill' + (category === c ? ' on' : '')} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>
      {members.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-3)' }}>For</span>
          <button
            type="button"
            onClick={() => setAssignee(null)}
            style={{
              padding: '5px 11px', borderRadius: 99, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
              border: `1px solid ${assignee === null ? 'var(--ink)' : 'var(--line-strong)'}`,
              background: assignee === null ? 'var(--ink)' : '#fff', color: assignee === null ? 'var(--bone)' : 'var(--ink)',
            }}
          >
            Shared
          </button>
          {members.map((m) => {
            const on = assignee === m.user_id;
            return (
              <button
                key={m.user_id}
                type="button"
                onClick={() => setAssignee(m.user_id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px 5px 7px', borderRadius: 99, cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12, border: `1px solid ${on ? m.color : 'var(--line-strong)'}`,
                  background: on ? m.color : '#fff', color: on ? '#fff' : 'var(--ink)',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: 99, background: on ? '#fff' : m.color, flex: 'none' }} />
                {m.display_name}
              </button>
            );
          })}
          <span style={{ flex: 1 }} />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button type="button" className="btn-dark" style={{ padding: '10px 16px', fontSize: 10.5 }} onClick={submit}>Add</button>
      </div>
    </div>
  );
}

function PackingRow({ item, memberById, onToggle, onRemove }) {
  return (
    <div className="card-btn" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'default' }}>
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        aria-label={item.packed ? 'Mark not packed' : 'Mark packed'}
        aria-pressed={item.packed}
        style={{
          width: 22, height: 22, borderRadius: 999, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: item.packed ? 'none' : '1.6px solid var(--line-strong)', background: item.packed ? 'var(--ink)' : 'none', cursor: 'pointer', padding: 0,
        }}
      >
        {item.packed && <span style={{ color: 'var(--bone)', fontSize: 12, lineHeight: 1 }}>✓</span>}
      </button>
      <span
        className="mono"
        style={{
          fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6, flex: 'none',
          background: 'var(--wash)', color: CATEGORY_COLOR[item.category] || 'var(--muted)',
        }}
      >{item.category}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.4, textDecoration: item.packed ? 'line-through' : 'none', color: item.packed ? 'var(--muted-3)' : 'var(--ink)' }}>
        {item.text}
      </span>
      <AssigneeBadge member={memberById[item.assignee]} />
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label="Remove"
        className="mono"
        style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--muted-3)', fontSize: 16, padding: '0 4px', flex: 'none', lineHeight: 1 }}
      >×</button>
    </div>
  );
}

export default function Packing({ trip, members = [] }) {
  const { packing, addPackingItem, togglePackingItem, removePackingItem } = trip;
  const memberById = Object.fromEntries(members.map((m) => [m.user_id, m]));
  const [filter, setFilter] = useState('All'); // 'All' | a user_id | 'shared'

  const filtered = packing.filter((p) => {
    if (filter === 'All') return true;
    if (filter === 'shared') return !p.assignee;
    return p.assignee === filter;
  });
  const pending = filtered.filter((p) => !p.packed);
  const packed = filtered.filter((p) => p.packed);
  const packedTotal = packing.filter((p) => p.packed).length;

  return (
    <div className="pad" style={{ paddingTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
        <h2 className="h2">Packing</h2>
        {packing.length > 0 && (
          <div className="mono" style={{ fontSize: 11, color: 'var(--muted-2)', whiteSpace: 'nowrap', paddingTop: 4 }}>
            {packedTotal}/{packing.length} packed
          </div>
        )}
      </div>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)', marginBottom: 16 }}>
        What's coming with you — grouped by category, tag who it's for.
      </div>

      {packing.length > 0 && (
        <div style={{ height: 4, borderRadius: 99, background: 'var(--wash)', overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ height: '100%', width: `${(packedTotal / packing.length) * 100}%`, background: 'var(--ink)', transition: 'width .2s' }} />
        </div>
      )}

      <AddPackingRow members={members} onAdd={addPackingItem} />

      {members.length > 0 && packing.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {[['All', 'All'], ['shared', 'Shared'], ...members.map((m) => [m.user_id, m.display_name])].map(([key, label]) => (
            <button key={key} type="button" className={'pill' + (filter === key ? ' on' : '')} onClick={() => setFilter(key)}>{label}</button>
          ))}
        </div>
      )}

      {packing.length === 0 ? (
        <div className="card" style={{ padding: '22px 18px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>Nothing on the list yet — add your first item above.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pending.map((item) => (
            <PackingRow key={item.id} item={item} memberById={memberById} onToggle={togglePackingItem} onRemove={removePackingItem} />
          ))}

          {pending.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>Everything's packed 🧳</div>
          )}

          {packed.length > 0 && (
            <>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-3)', margin: '14px 0 2px' }}>
                Packed · {packed.length}
              </div>
              {packed.map((item) => (
                <PackingRow key={item.id} item={item} memberById={memberById} onToggle={togglePackingItem} onRemove={removePackingItem} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
