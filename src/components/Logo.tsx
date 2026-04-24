import { Link } from "react-router-dom";

interface Props {
  className?: string;
  to?: string;
}

/**
 * KO wordmark. Italic K with brushed-gold underline.
 */
export const Logo = ({ className = "", to = "/" }: Props) => {
  return (
    <Link to={to} className={`inline-flex items-center gap-2 group ${className}`} aria-label="KO home">
      <span className="font-display text-2xl tracking-[0.35em] leading-none">
        <span className="italic">K</span>
        <span>O</span>
      </span>
      <span className="hidden sm:block w-6 h-px bg-gradient-gold transition-all duration-500 group-hover:w-10" />
    </Link>
  );
};
