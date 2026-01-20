
export default function PanelButton({
  children,
  onClick,
  type = "button",
  className = "",
  as = "button",
  href,
  style = {},
  size = "md", // xs | sm | md
  ...rest
}) {
  const Comp = as === 'a' ? 'a' : 'button';
  const extraProps = as === 'a' ? { href } : { type, onClick };
  const sizeClasses = size === 'xs'
    ? 'px-2 py-0.5 text-xs'
    : size === 'sm'
      ? 'px-2 py-1 text-xs'
      : 'px-3 py-2 text-sm';
  return (
    <Comp
      {...extraProps}
      className={`block rounded-lg font-semibold shadow transition-all duration-150 focus:outline-none ${sizeClasses} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Comp>
  );
}
