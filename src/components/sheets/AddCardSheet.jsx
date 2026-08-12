export default function AddCardSheet({ trip }) {
  const { state, patch, addCard } = trip;
  // Only ever opened from the expense sheet — Cancel returns there instead
  // of closing everything, so an in-progress expense isn't lost.
  const backToExpense = () => patch({ sheet: 'expense', newCardName: '', newCardNumber: '' });

  const digits = state.newCardNumber.replace(/\D/g, '');
  const invalidName = !state.newCardName.trim();
  const invalidNumber = digits.length < 4;

  return (
    <div style={{ padding: '8px 22px 30px' }}>
      <h3 style={{ fontWeight: 700, letterSpacing: '-.025em', fontSize: 25, margin: '0 0 6px' }}>Add a card</h3>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 }}>
        Only the last 4 digits are ever kept — nothing else about the card is stored.
      </div>

      <label className="field-label" htmlFor="card-name">Card name</label>
      <input
        id="card-name"
        type="text"
        placeholder="Chase Sapphire, Amex Gold…"
        value={state.newCardName}
        onChange={(e) => patch({ newCardName: e.target.value })}
        style={{ marginBottom: 16 }}
      />

      <label className="field-label" htmlFor="card-number">Card number</label>
      <input
        id="card-number"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="•••• •••• •••• 1234"
        value={state.newCardNumber}
        onChange={(e) => patch({ newCardNumber: e.target.value })}
        style={{ marginBottom: 8 }}
      />
      {digits.length >= 4 && (
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted)', marginBottom: 20 }}>
          Will be saved as: <strong>{state.newCardName.trim() || 'Card'} ••{digits.slice(-4)}</strong>
        </div>
      )}
      {digits.length < 4 && <div style={{ marginBottom: 20 }} />}

      <div style={{ display: 'flex', gap: 9 }}>
        <button type="button" className="btn-outline" style={{ flex: 'none', width: 96, padding: '15px 0', fontSize: 11 }} onClick={backToExpense}>
          Cancel
        </button>
        <button
          type="button"
          className="btn-primary"
          style={{ flex: 1, padding: 15, fontSize: 11.5, borderRadius: 14, opacity: (invalidName || invalidNumber) ? 0.55 : 1 }}
          onClick={addCard}
        >
          Add card
        </button>
      </div>
    </div>
  );
}
