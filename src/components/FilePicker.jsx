export default function FilePicker({ label, ...props }) {
  return (
    <span style={{ display: 'inline-flex', position: 'relative', alignItems: 'center', verticalAlign: 'middle' }}>
      <span className="btn ghost" aria-hidden="true">{label}</span>
      <input
        {...props}
        aria-label={label}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: props.disabled ? 'not-allowed' : 'pointer' }}
      />
    </span>
  )
}
