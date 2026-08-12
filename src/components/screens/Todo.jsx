import { useState } from 'react';
import { TERRA, BLUE, GOLD, PLUM } from '../../data/trip.js';

const KINDS = ['Do', 'See', 'Try', 'Buy'];
const KIND_COLOR = { Do: TERRA, See: BLUE, Try: GOLD, Buy: PLUM };

function AddTodoRow({ onAdd }) {
  const [text, setText] = useState('');
  const [kind, setKind] = useState('Do');

  const submit = () => {
    if (onAdd(text, kind)) setText('');
  };

  return (
    <div className="card" style={{ padding: 14, marginBottom: 18 }}>
      <input
        type="text"
        placeholder="Add something to see, do, try or buy…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        style={{ marginBottom: 10 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
        {KINDS.map((k) => (
          <button key={k} type="button" className={'pill' + (kind === k ? ' on' : '')} onClick={() => setKind(k)}>{k}</button>
        ))}
        <span style={{ flex: 1 }} />
        <button type="button" className="btn-dark" style={{ padding: '10px 16px', fontSize: 10.5 }} onClick={submit}>Add</button>
      </div>
    </div>
  );
}

function TodoRow({ item, onToggle, onRemove }) {
  return (
    <div className="card-btn" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', cursor: 'default' }}>
      <button
        type="button"
        onClick={() => onToggle(item.id)}
        aria-label={item.done ? 'Mark not done' : 'Mark done'}
        aria-pressed={item.done}
        style={{
          width: 22, height: 22, borderRadius: 999, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: item.done ? 'none' : '1.6px solid var(--line-strong)', background: item.done ? 'var(--ink)' : 'none', cursor: 'pointer', padding: 0,
        }}
      >
        {item.done && <span style={{ color: 'var(--bone)', fontSize: 12, lineHeight: 1 }}>✓</span>}
      </button>
      <span
        className="mono"
        style={{
          fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 6, flex: 'none',
          background: 'var(--wash)', color: KIND_COLOR[item.kind] || 'var(--muted)',
        }}
      >{item.kind}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, lineHeight: 1.4, textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--muted-3)' : 'var(--ink)' }}>
        {item.text}
      </span>
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

export default function Todo({ trip }) {
  const { todos, addTodo, toggleTodo, removeTodo } = trip;
  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  return (
    <div className="pad" style={{ paddingTop: 20 }}>
      <h2 className="h2" style={{ marginBottom: 4 }}>To-do</h2>
      <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted-2)', marginBottom: 16 }}>
        Things to see, do, try or buy — not tied to a specific day or booking.
      </div>

      <AddTodoRow onAdd={addTodo} />

      {todos.length === 0 ? (
        <div className="card" style={{ padding: '22px 18px', textAlign: 'center', color: 'var(--muted)' }}>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>Nothing on the list yet — add your first idea above.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pending.map((item) => (
            <TodoRow key={item.id} item={item} onToggle={toggleTodo} onRemove={removeTodo} />
          ))}

          {pending.length === 0 && (
            <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '8px 0' }}>Everything's crossed off 🎉</div>
          )}

          {done.length > 0 && (
            <>
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted-3)', margin: '14px 0 2px' }}>
                Done · {done.length}
              </div>
              {done.map((item) => (
                <TodoRow key={item.id} item={item} onToggle={toggleTodo} onRemove={removeTodo} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
