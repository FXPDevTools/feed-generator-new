
export default function PanelButton({
  children,
  onClick,
  type = "button",
  className = "",
  as = "button",
  href,
  style = {},
  ...rest
}) {
  const Comp = as === 'a' ? 'a' : 'button';
  const extraProps = as === 'a' ? { href } : { type, onClick };
  return (
    <Comp
      {...extraProps}
      className={`px-5 py-2 rounded-lg font-semibold shadow transition-all duration-150 focus:outline-none focus:ring-2 ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Comp>
  );
}
